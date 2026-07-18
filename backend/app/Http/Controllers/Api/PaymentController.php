<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\Facture;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    /**
     * CAISSIER - Liste des paiements
     */
    public function cashierPayments(Request $request)
    {
        $query = Paiement::with(['reservation', 'reservation.client', 'reservation.salle'])
            ->orderBy('date_paiement', 'desc');

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('reservation.client', function ($q) use ($search) {
                $q->where('nom', 'LIKE', "%{$search}%")
                    ->orWhere('prenom', 'LIKE', "%{$search}%");
            });
        }

        return response()->json([
            'data' => $query->paginate(20),
            'stats' => $this->cashierStatsArray()
        ]);
    }

    /**
     * ⚠ CORRIGÉ : renvoie un tableau (utilisé en interne) — l'ancien
     * getCashierStats public était embarqué tel quel dans cashierPayments.
     */
    private function cashierStatsArray(): array
    {
        return [
            'pendingPayments' => Paiement::where('statut', 'en_attente')->count(),
            'validatedPayments' => Paiement::where('statut', 'valide')->count(),
            'cancelledPayments' => Paiement::where('statut', 'annule')->count(),
            'totalRevenue' => Paiement::where('statut', 'valide')->sum('montant') ?? 0,
        ];
    }

    /**
     * CAISSIER - Enregistrer un paiement présentiel
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_reservation' => 'required|exists:reservation,id_reservation',
            'montant' => 'required|numeric|min:0',
            'mode_paiement' => 'required|in:especes,moov_money,airtel_money',
            'reference' => 'nullable|string|max:100',
        ]);

        $reservation = Reservation::with(['client', 'salle'])->find($validated['id_reservation']);
        if (!$reservation) {
            return response()->json(['message' => 'Réservation non trouvée'], 404);
        }

        $existing = Paiement::where('id_reservation', $validated['id_reservation'])
            // ⚠ CORRIGÉ : un paiement ANNULÉ ne doit pas bloquer un nouvel
            // encaissement — seuls en_attente/valide comptent.
            ->whereIn('statut', ['en_attente', 'valide'])
            ->first();
        if ($existing) {
            return response()->json([
                'message' => 'Un paiement existe déjà pour cette réservation',
                'paiement' => $existing
            ], 409);
        }

        if (!in_array($reservation->statut, ['validee', 'confirmee', 'en_attente'])) {
            return response()->json([
                'message' => 'Cette réservation ne peut pas être payée (statut: ' . $reservation->statut . ')'
            ], 400);
        }

        DB::beginTransaction();

        try {
            $paiement = Paiement::create([
                'id_reservation' => $validated['id_reservation'],
                'id_caissier' => Auth::id(),
                'montant' => $validated['montant'],
                'mode_paiement' => $validated['mode_paiement'],
                'statut' => 'valide',
                'reference' => $validated['reference'] ?? 'PAY-' . time(),
                'date_paiement' => now(),
            ]);

            $reservation->statut = 'confirmee';
            $reservation->save();

            $facture = $this->generateInvoice($paiement);

            $this->notifyClient($reservation, 'Paiement confirmé');

            DB::commit();

            return response()->json([
                'message' => 'Paiement enregistré avec succès',
                'paiement' => $paiement->load(['reservation.client', 'reservation.salle']),
                'facture' => $facture
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur enregistrement paiement', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de l\'enregistrement du paiement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CAISSIER - Valider un paiement existant
     */
    public function validatePayment($id)
    {
        $paiement = Paiement::with(['reservation'])->findOrFail($id);

        if ($paiement->statut === 'valide') {
            return response()->json(['message' => 'Ce paiement est déjà validé'], 400);
        }

        if ($paiement->statut === 'annule') {
            return response()->json(['message' => 'Ce paiement est annulé et ne peut pas être validé'], 400);
        }

        DB::beginTransaction();

        try {
            $paiement->statut = 'valide';
            $paiement->id_caissier = Auth::id();
            $paiement->date_paiement = now();
            $paiement->save();

            $reservation = $paiement->reservation;
            $reservation->statut = 'confirmee';
            $reservation->save();

            $existingFacture = Facture::where('id_paiement', $paiement->id_paiement)->first();
            if (!$existingFacture) {
                $this->generateInvoice($paiement);
            }

            $this->notifyClient($reservation, 'Paiement confirmé');

            DB::commit();

            return response()->json([
                'message' => 'Paiement validé avec succès',
                'paiement' => $paiement->load(['reservation.client', 'reservation.salle'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur validation paiement', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la validation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CAISSIER - Voir un paiement
     */
    public function show($id)
    {
        $paiement = Paiement::with([
            'reservation',
            'reservation.client',
            'reservation.salle',
            'reservation.salle.tarifs',
            'facture'
        ])->findOrFail($id);

        return response()->json($paiement);
    }

    /**
     * CAISSIER - Annuler un paiement
     */
    public function cancel($id)
    {
        $paiement = Paiement::with(['reservation'])->findOrFail($id);

        if ($paiement->statut === 'annule') {
            return response()->json(['message' => 'Ce paiement est déjà annulé'], 400);
        }

        if ($paiement->statut === 'valide') {
            return response()->json([
                'message' => 'Un paiement validé ne peut pas être annulé. Contactez l\'administrateur.',
                'paiement' => $paiement
            ], 400);
        }

        DB::beginTransaction();

        try {
            $paiement->statut = 'annule';
            $paiement->save();

            $reservation = $paiement->reservation;
            if ($reservation->statut === 'confirmee') {
                $reservation->statut = 'validee';
                $reservation->save();
            }

            $this->notifyClient($reservation, 'Paiement annulé');

            DB::commit();

            return response()->json([
                'message' => 'Paiement annulé avec succès',
                'paiement' => $paiement
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur annulation paiement', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de l\'annulation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CAISSIER - Historique des paiements
     *
     * ⚠ CORRIGÉ : le résumé réutilisait $query APRÈS paginate() en le
     * mutant avec des where() supplémentaires — comptes faux. On clone
     * proprement la requête de base pour chaque agrégat.
     */
    public function history(Request $request)
    {
        $base = Paiement::query();

        if ($request->has('start_date')) {
            $base->whereDate('date_paiement', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $base->whereDate('date_paiement', '<=', $request->end_date);
        }

        if ($request->has('statut')) {
            $base->where('statut', $request->statut);
        }

        $payments = (clone $base)
            ->with(['reservation', 'reservation.client', 'reservation.salle'])
            ->orderBy('date_paiement', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => $payments,
            'summary' => [
                'total' => (clone $base)->count(),
                'totalAmount' => (clone $base)->sum('montant') ?? 0,
                'validated' => (clone $base)->where('statut', 'valide')->count(),
                'pending' => (clone $base)->where('statut', 'en_attente')->count(),
                'cancelled' => (clone $base)->where('statut', 'annule')->count(),
            ]
        ]);
    }

    /**
     * ADMIN - Superviser les paiements
     */
    public function adminIndex(Request $request)
    {
        $query = Paiement::with(['reservation', 'reservation.client', 'reservation.salle'])
            ->orderBy('date_paiement', 'desc');

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('reservation.client', function ($q) use ($search) {
                $q->where('nom', 'LIKE', "%{$search}%")
                    ->orWhere('prenom', 'LIKE', "%{$search}%");
            });
        }

        return response()->json([
            'data' => $query->paginate(20),
            'stats' => [
                'total' => Paiement::count(),
                'totalAmount' => Paiement::where('statut', 'valide')->sum('montant') ?? 0,
                'byMode' => $this->getPaymentStatsByMode(),
                'byStatus' => [
                    'valide' => Paiement::where('statut', 'valide')->count(),
                    'en_attente' => Paiement::where('statut', 'en_attente')->count(),
                    'annule' => Paiement::where('statut', 'annule')->count(),
                ]
            ]
        ]);
    }

    private function getPaymentStatsByMode()
    {
        return [
            'especes' => Paiement::where('mode_paiement', 'especes')->where('statut', 'valide')->count(),
            'moov_money' => Paiement::where('mode_paiement', 'moov_money')->where('statut', 'valide')->count(),
            'airtel_money' => Paiement::where('mode_paiement', 'airtel_money')->where('statut', 'valide')->count(),
        ];
    }

    /**
     * PAIEMENT EN LIGNE - Initier un paiement
     */
    public function initiateOnlinePayment(Request $request)
    {
        $validated = $request->validate([
            'id_reservation' => 'required|exists:reservation,id_reservation',
            'mode_paiement' => 'required|in:moov_money,airtel_money',
            'telephone' => 'required|string|max:20',
        ]);

        $reservation = Reservation::with(['client', 'salle'])->find($validated['id_reservation']);

        if (!$reservation) {
            return response()->json(['message' => 'Réservation non trouvée'], 404);
        }

        if ($reservation->id_client !== Auth::id()) {
            return response()->json(['message' => 'Cette réservation ne vous appartient pas'], 403);
        }

        if ($reservation->statut !== 'validee') {
            return response()->json([
                'message' => 'La réservation doit être validée avant le paiement'
            ], 400);
        }

        $existing = Paiement::where('id_reservation', $validated['id_reservation'])
            ->whereIn('statut', ['en_attente', 'valide'])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Un paiement est déjà en cours pour cette réservation',
                'paiement' => $existing
            ], 409);
        }

        DB::beginTransaction();

        try {
            $paiement = Paiement::create([
                'id_reservation' => $validated['id_reservation'],
                'id_caissier' => null,
                'montant' => $this->calculatePrice($reservation),
                'mode_paiement' => $validated['mode_paiement'],
                'statut' => 'en_attente',
                'reference' => 'ONLINE-' . time() . '-' . $reservation->id_reservation,
                'date_paiement' => null,
            ]);

            DB::commit();

            // TODO : appel réel à l'API Moov Money / Airtel Money ici
            // $response = $this->callPaymentGateway($paiement, $validated['telephone']);

            return response()->json([
                'message' => 'Paiement initié',
                'paiement' => $paiement,
                'instruction' => 'Confirmez le paiement sur votre téléphone'
            ], 202);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur initiation paiement en ligne', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de l\'initiation du paiement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PAIEMENT EN LIGNE - Vérifier le statut
     */
    public function checkPaymentStatus($transaction_id)
    {
        $paiement = Paiement::where('reference', $transaction_id)->firstOrFail();

        return response()->json([
            'paiement' => $paiement,
            'status' => $paiement->statut,
            'message' => $paiement->statut === 'valide' ? 'Paiement confirmé' : 'En attente'
        ]);
    }

    /**
     * WEBHOOK - Confirmation de paiement en ligne
     */
    public function handleWebhook(Request $request)
    {
        Log::info('Webhook reçu', $request->all());

        // TODO : vérifier la signature du webhook avant de faire confiance à son contenu

        $transaction_id = $request->input('transaction_id');
        $status = $request->input('status');

        if ($status === 'success') {
            $paiement = Paiement::where('reference', $transaction_id)->first();

            if ($paiement && $paiement->statut === 'en_attente') {
                DB::beginTransaction();
                try {
                    $paiement->statut = 'valide';
                    $paiement->date_paiement = now();
                    $paiement->save();

                    $reservation = $paiement->reservation;
                    $reservation->statut = 'confirmee';
                    $reservation->save();

                    $this->generateInvoice($paiement);
                    $this->notifyClient($reservation, 'Paiement en ligne confirmé');

                    DB::commit();
                } catch (\Exception $e) {
                    DB::rollBack();
                    Log::error('Erreur webhook', ['error' => $e->getMessage()]);
                }
            }
        }

        return response()->json(['message' => 'Webhook traité']);
    }

    // ============================================
    // MÉTHODES PRIVÉES
    // ============================================

    private function generateInvoice($paiement)
    {
        // ⚠ CORRIGÉ : count()+1 provoque des collisions de numéro après
        // une suppression de facture (contrainte UNIQUE violée). On repart
        // du dernier id, insensible aux trous.
        $next = (Facture::max('id_facture') ?? 0) + 1;
        return Facture::create([
            'id_paiement' => $paiement->id_paiement,
            'numero_facture' => 'FACT-' . now()->format('Y') . '-' . str_pad($next, 4, '0', STR_PAD_LEFT),
            'date_emission' => now(),
        ]);
    }

    private function notifyClient($reservation, $message)
    {
        Notification::create([
            'id_utilisateur' => $reservation->id_client,
            'titre' => $message,
            'contenu' => 'Votre paiement pour la réservation du ' . $reservation->date_debut->format('d/m/Y à H:i') . ' a été traité.',
            'type' => 'confirmation',
            'est_lu' => false,
            'date_creation' => now(),
        ]);
    }

    /**
     * Calculer le prix de la réservation à partir de la table TarifSalle.
     *
     * ⚠ CORRIGÉ (ex-"POINT OUVERT") : la catégorie tarifaire vient
     * désormais du PROFIL DU CLIENT (utilisateur.categorie_client,
     * déclarée à l'inscription, corrigeable par l'admin uniquement) —
     * plus de valeur devinée. Repli sur 'association_base' seulement
     * pour les anciens comptes créés avant la migration.
     */
    private function calculatePrice($reservation)
    {
        $reservation->loadMissing(['salle.tarifs', 'client']);

        $categorieClient = $reservation->client->categorie_client ?? 'association_base';

        $tarif = $reservation->salle->tarifs
            ->where('categorie_client', $categorieClient)
            ->first()
            // Repli : premier tarif si la grille de cette salle est incomplète
            ?? $reservation->salle->tarifs->first();

        if (!$tarif) {
            Log::warning('Aucun tarif trouvé pour la salle', [
                'id_salle' => $reservation->id_salle,
                'categorie_client' => $categorieClient,
            ]);
            return 0;
        }

        $debut = $reservation->date_debut;
        $fin = $reservation->date_fin;

        if ($tarif->unite === 'heure') {
            $unites = max(1, ceil($debut->diffInMinutes($fin) / 60));
        } else {
            $unites = max(1, ceil($debut->diffInHours($fin) / 24));
        }

        return $tarif->prix * $unites;
    }
}
