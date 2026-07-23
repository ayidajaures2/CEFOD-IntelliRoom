<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\Facture;
use App\Models\Notification;
use App\Support\BusinessHours; // ✅ AJOUT
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

    private function cashierStatsArray(): array
    {
        return [
            'pendingPayments' => Paiement::where('statut', 'en_attente')->count(),
            'validatedPayments' => Paiement::where('statut', 'valide')->count(),
            'cancelledPayments' => Paiement::where('statut', 'annule')->count(),
            // ⚠ CORRIGÉ : sum('total') sur colonne générée peut échouer si
            // la colonne est VIRTUAL (non STORED). montant+frais = même
            // résultat, robuste partout.
            'totalRevenue' => (Paiement::where('statut', 'valide')->sum('montant') ?? 0)
                + (Paiement::where('statut', 'valide')->sum('frais') ?? 0),
        ];
    }

    /**
     * Calcul des frais selon l'opérateur (Tchad)
     */
    private function calculateFrais($montant, $mode_paiement)
    {
        $rates = [
            'airtel_money' => 1.8, // 1.8%
            'moov_money' => 1.6,   // 1.6%
        ];

        $rate = $rates[$mode_paiement] ?? 0;

        if ($rate <= 0) {
            return 0;
        }

        $frais = $montant * ($rate / 100);
        $frais = ceil($frais);          // arrondi entier supérieur
        $frais = ceil($frais / 5) * 5;  // multiple de 5

        $min = 40;
        $max = 3000;
        $frais = max($min, min($frais, $max));

        return $frais;
    }

    /**
     * CAISSIER - Enregistrer un paiement présentiel
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_reservation' => 'required|exists:reservation,id_reservation',
            'montant' => 'required|numeric|min:0',
            'frais' => 'nullable|numeric|min:0',
            'mode_paiement' => 'required|in:especes,moov_money,airtel_money',
            'reference' => 'nullable|string|max:100',
        ]);

        $reservation = Reservation::with(['client', 'salle'])->find($validated['id_reservation']);
        if (!$reservation) {
            return response()->json(['message' => 'Réservation non trouvée'], 404);
        }

        $existing = Paiement::where('id_reservation', $validated['id_reservation'])
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
            // Frais : 0 pour espèces, calculés pour Mobile Money.
            $frais = 0;
            if ($validated['mode_paiement'] === 'moov_money' || $validated['mode_paiement'] === 'airtel_money') {
                $frais = $this->calculateFrais($validated['montant'], $validated['mode_paiement']);
            }

            $paiement = Paiement::create([
                'id_reservation' => $validated['id_reservation'],
                'id_caissier' => Auth::id(),
                'montant' => $validated['montant'],
                'frais' => $frais,
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
     * CAISSIER - Historique des paiements
     */
    public function history(Request $request)
    {
        $query = Paiement::with(['reservation.client', 'reservation.salle'])
            ->orderBy('date_paiement', 'desc');

        if ($request->has('mode_paiement')) {
            $query->where('mode_paiement', $request->mode_paiement);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * CAISSIER - Annuler un paiement
     */
    public function cancelPayment($id)
    {
        $paiement = Paiement::with('reservation')->findOrFail($id);

        if ($paiement->statut === 'annule') {
            return response()->json(['message' => 'Ce paiement est déjà annulé'], 400);
        }

        DB::beginTransaction();
        try {
            $paiement->statut = 'annule';
            $paiement->save();

            if ($paiement->reservation) {
                $paiement->reservation->statut = 'validee';
                $paiement->reservation->save();
            }

            DB::commit();

            return response()->json([
                'message' => 'Paiement annulé avec succès',
                'paiement' => $paiement
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de l\'annulation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CLIENT - Simuler un paiement Mobile Money
     *
     * ⚠ CORRIGÉ : cette route DOIT rester dans le groupe auth client
     * (sinon Auth::id() est null → faux 403).
     */
    public function simulateOnlinePayment(Request $request)
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

        if ((int) $reservation->id_client !== (int) Auth::id()) {
            return response()->json(['message' => 'Cette réservation ne vous appartient pas'], 403);
        }

        if ($reservation->statut !== 'validee') {
            return response()->json([
                'message' => 'La réservation doit être validée par la réception avant le paiement'
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
            // ⚠ CORRIGÉ : calculatePrice() utilise désormais BusinessHours
            $montant = $this->calculatePrice($reservation);
            $frais = $this->calculateFrais($montant, $validated['mode_paiement']);

            $transactionId = 'SIM-' . strtoupper(substr(md5(uniqid()), 0, 8));

            $paiement = Paiement::create([
                'id_reservation' => $validated['id_reservation'],
                'id_caissier' => null,
                'montant' => $montant,
                'frais' => $frais,
                'mode_paiement' => $validated['mode_paiement'],
                'statut' => 'valide',
                'reference' => $transactionId,
                'date_paiement' => now(),
            ]);

            $reservation->statut = 'confirmee';
            $reservation->save();

            $facture = $this->generateInvoice($paiement);
            $this->notifyClient($reservation, 'Paiement confirmé');

            DB::commit();

            $rates = ['airtel_money' => 1.8, 'moov_money' => 1.6];
            $rate = $rates[$validated['mode_paiement']] ?? 0;

            return response()->json([
                'message' => 'Paiement simulé avec succès. Réservation confirmée.',
                'paiement' => $paiement->load(['reservation.client', 'reservation.salle']),
                'simulation' => [
                    'operator' => $validated['mode_paiement'],
                    'rate' => $rate,
                    'frais' => $frais,
                    'total' => $montant + $frais,
                    'transaction_id' => $transactionId,
                    'country' => 'Tchad (TD)',
                ],
                'montant' => $montant,
                'frais' => $frais,
                'total' => $montant + $frais,
                'facture' => $facture
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur simulation paiement', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la simulation du paiement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PAIEMENT EN LIGNE - Initier (V2, vrai HUB2 : statut en_attente)
     * Conservé pour l'intégration future ; la simulation ci-dessus est
     * ce que le frontend appelle aujourd'hui.
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

        if ((int) $reservation->id_client !== (int) Auth::id()) {
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
            // ⚠ CORRIGÉ : calculatePrice() utilise désormais BusinessHours
            $montant = $this->calculatePrice($reservation);
            $frais = $this->calculateFrais($montant, $validated['mode_paiement']);

            $paiement = Paiement::create([
                'id_reservation' => $validated['id_reservation'],
                'id_caissier' => null,
                'montant' => $montant,
                'frais' => $frais,
                'mode_paiement' => $validated['mode_paiement'],
                'statut' => 'en_attente',
                'reference' => 'ONLINE-' . time() . '-' . $reservation->id_reservation,
                'date_paiement' => null,
            ]);

            DB::commit();

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
            'montant' => $paiement->montant,
            'frais' => $paiement->frais,
            'total' => $paiement->total,
            'message' => $paiement->statut === 'valide' ? 'Paiement confirmé' : 'En attente'
        ]);
    }

    /**
     * WEBHOOK - Confirmation de paiement en ligne (HUB2)
     */
    public function handleWebhook(Request $request)
    {
        Log::info('Webhook reçu', $request->all());

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
            'type' => 'paiement',
            'est_lu' => false,
            'date_creation' => now(),
        ]);
    }

    /**
     * ⚠ CORRIGÉ — Calcul du prix basé sur les HEURES OUVRÉES uniquement.
     *
     * Utilise BusinessHours::computeOpenMinutes() pour ne facturer que
     * les minutes où le CEFOD est ouvert (Lun–Sam 08:00–18:00).
     *
     * Exemple validé : vendredi 10h → samedi 12h
     *   → vendredi 10h–18h = 8 h + samedi 08h–12h = 4 h = 12 h facturées.
     *
     * Unité « jour » : 1 jour = 10 h ouvrées (600 min).
     */
    private function calculatePrice($reservation)
    {
        $reservation->loadMissing(['salle.tarifs', 'client']);

        $categorieClient = $reservation->client->categorie_client ?? 'association_base';

        $tarif = $reservation->salle->tarifs
            ->where('categorie_client', $categorieClient)
            ->first()
            ?? $reservation->salle->tarifs->first();

        if (!$tarif) {
            Log::warning('Aucun tarif trouvé pour la salle', [
                'id_salle' => $reservation->id_salle,
                'categorie_client' => $categorieClient,
            ]);
            return 0;
        }

        $debut = $reservation->date_debut;
        $fin   = $reservation->date_fin;

        // ✅ AJOUT : calcul basé sur les minutes ouvrées
        $openMinutes = BusinessHours::computeOpenMinutes($debut, $fin);

        if ($tarif->unite === 'heure') {
            // Arrondi à l'heure supérieure, minimum 1 h
            $unites = max(1, (int) ceil($openMinutes / 60));
        } else {
            // 1 jour ouvré = 10 h = 600 min, arrondi supérieur, minimum 1
            $unites = max(1, (int) ceil($openMinutes / 600));
        }

        Log::info('Calcul tarif heures ouvrées', [
            'id_reservation' => $reservation->id_reservation,
            'debut' => $debut->toDateTimeString(),
            'fin' => $fin->toDateTimeString(),
            'open_minutes' => $openMinutes,
            'unite' => $tarif->unite,
            'unites_facturees' => $unites,
            'prix_unitaire' => $tarif->prix,
            'total' => $tarif->prix * $unites,
        ]);

        return $tarif->prix * $unites;
    }
}