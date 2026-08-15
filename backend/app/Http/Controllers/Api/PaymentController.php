<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\Facture;
use App\Models\LigneFacture;
use App\Models\Notification;
use App\Support\BusinessHours;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    /**
     * CAISSIER / COMPTABILITÉ - Liste des paiements
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
            'stats' => $this->statsArray(),
        ]);
    }

    private function statsArray(): array
    {
        return [
            'pendingPayments' => Paiement::where('statut', 'en_attente')->count(),
            'encaissedPayments' => Paiement::where('statut', 'encaisse')->count(),
            'validatedPayments' => Paiement::where('statut', 'valide')->count(),
            'cancelledPayments' => Paiement::where('statut', 'annule')->count(),
            'totalRevenue' => (Paiement::where('statut', 'valide')->sum('montant') ?? 0)
                + (Paiement::where('statut', 'valide')->sum('frais') ?? 0),
        ];
    }

    /**
     * Calcul des frais selon l'opérateur mobile money (Tchad).
     * Espèces / chèque / virement : aucun frais.
     */
    private function calculateFrais($montant, $mode_paiement)
    {
        $rates = [
            'airtel_money' => 1.8,
            'moov_money' => 1.6,
        ];

        $rate = $rates[$mode_paiement] ?? 0;
        if ($rate <= 0) {
            return 0;
        }

        $frais = $montant * ($rate / 100);
        $frais = ceil($frais);
        $frais = ceil($frais / 5) * 5;

        return max(40, min($frais, 3000));
    }

    /**
     * CAISSIER - Encaisser un paiement en espèces (présentiel).
     *
     * Uniquement le cash : le caissier n'encaisse que les espèces. Statut
     * → encaisse ; la réservation reste validee. La confirmation et la facture
     * viennent après validation par la comptabilité.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_reservation' => 'required|exists:reservation,id_reservation',
            'montant' => 'required|numeric|min:0',
            // Référence obligatoire et unique : saisie par le caissier, c'est
            // le lien de traçabilité entre le cash reçu et le paiement en base
            // que la comptabilité vérifiera avant validation.
            'reference' => 'required|string|max:100|unique:paiement,reference',
        ]);

        $reservation = Reservation::with(['client', 'salle'])->find($validated['id_reservation']);
        if (!$reservation) {
            return response()->json(['message' => 'Réservation non trouvée'], 404);
        }

        if ($reservation->statut !== 'validee') {
            return response()->json([
                'message' => 'Cette réservation ne peut pas être payée (statut: ' . $reservation->statut . '). Elle doit d\'abord être validée par le SG.'
            ], 400);
        }

        $existing = Paiement::where('id_reservation', $validated['id_reservation'])
            ->whereIn('statut', ['en_attente', 'encaisse', 'valide'])
            ->first();
        if ($existing) {
            return response()->json([
                'message' => 'Un paiement existe déjà pour cette réservation',
                'paiement' => $existing
            ], 409);
        }

        DB::beginTransaction();
        try {
            $paiement = Paiement::create([
                'id_reservation' => $validated['id_reservation'],
                'id_caissier' => Auth::id(),
                'montant' => $validated['montant'],
                'frais' => 0,
                'mode_paiement' => 'especes',
                'statut' => 'encaisse',
                'reference' => $validated['reference'],
                'date_paiement' => now(),
            ]);

            $this->notifyClient(
                $reservation,
                'Paiement encaissé',
                'Votre paiement en espèces a été encaissé par la caisse. Il doit encore être validé par la comptabilité avant que votre réservation soit confirmée.'
            );

            DB::commit();

            return response()->json([
                'message' => 'Paiement encaissé avec succès. En attente de validation par la comptabilité.',
                'paiement' => $paiement->load(['reservation.client', 'reservation.salle']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur encaissement paiement', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de l\'encaissement du paiement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * COMPTABILITÉ - Enregistrer un paiement par chèque ou virement.
     *
     * Le caissier n'intervient pas pour ces modes : la comptabilité les
     * enregistre elle-même (statut → encaisse), puis les valide dans un
     * second temps via validatePayment() après vérification de conformité.
     */
    public function storeManual(Request $request)
    {
        $validated = $request->validate([
            'id_reservation' => 'required|exists:reservation,id_reservation',
            'montant' => 'required|numeric|min:0',
            'mode_paiement' => 'required|in:cheque,virement',
            // Référence obligatoire et unique : numéro du chèque ou du bordereau
            // de virement, saisi par la comptabilité. Lien de traçabilité avant
            // vérification de conformité et validation.
            'reference' => 'required|string|max:100|unique:paiement,reference',
        ]);

        $reservation = Reservation::with(['client', 'salle'])->find($validated['id_reservation']);
        if (!$reservation) {
            return response()->json(['message' => 'Réservation non trouvée'], 404);
        }

        if ($reservation->statut !== 'validee') {
            return response()->json([
                'message' => 'Cette réservation ne peut pas être payée (statut: ' . $reservation->statut . '). Elle doit d\'abord être validée par le SG.'
            ], 400);
        }

        $existing = Paiement::where('id_reservation', $validated['id_reservation'])
            ->whereIn('statut', ['en_attente', 'encaisse', 'valide'])
            ->first();
        if ($existing) {
            return response()->json([
                'message' => 'Un paiement existe déjà pour cette réservation',
                'paiement' => $existing
            ], 409);
        }

        DB::beginTransaction();
        try {
            $paiement = Paiement::create([
                'id_reservation' => $validated['id_reservation'],
                'id_caissier' => null,
                'montant' => $validated['montant'],
                'frais' => 0,
                'mode_paiement' => $validated['mode_paiement'],
                'statut' => 'encaisse',
                'reference' => $validated['reference'],
                'date_paiement' => now(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Paiement enregistré. En attente de validation après vérification de conformité.',
                'paiement' => $paiement->load(['reservation.client', 'reservation.salle']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur enregistrement paiement manuel', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de l\'enregistrement du paiement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * COMPTABILITÉ - Valider un paiement encaissé (espèces, chèque, virement).
     * Confirme la réservation et génère la facture automatiquement.
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

        if ($paiement->statut !== 'encaisse') {
            return response()->json([
                'message' => "Ce paiement doit d'abord être encaissé avant validation (statut actuel : {$paiement->statut})."
            ], 400);
        }

        DB::beginTransaction();
        try {
            $paiement->statut = 'valide';
            $paiement->id_comptable = Auth::id();
            $paiement->save();

            $reservation = $paiement->reservation;
            $reservation->statut = 'confirmee';
            $reservation->save();

            if (!Facture::where('id_paiement', $paiement->id_paiement)->exists()) {
                $this->generateInvoice($paiement, 'manuelle', Auth::id());
            }

            $this->notifyClient(
                $reservation,
                'Paiement confirmé',
                'Votre paiement a été validé par la comptabilité et votre réservation est désormais confirmée.'
            );

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

    public function show($id)
    {
        $paiement = Paiement::with([
            'reservation',
            'reservation.client',
            'reservation.salle',
            'reservation.salle.tarifs',
            'reservation.services.service',
            'facture'
        ])->findOrFail($id);

        return response()->json($paiement);
    }

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
     * Annuler un paiement non encore validé. Un paiement validé ne peut plus
     * être annulé que par l'admin.
     */
    public function cancelPayment($id)
    {
        $paiement = Paiement::with('reservation')->findOrFail($id);

        if ($paiement->statut === 'annule') {
            return response()->json(['message' => 'Ce paiement est déjà annulé'], 400);
        }

        if ($paiement->statut === 'valide') {
            return response()->json([
                'message' => 'Ce paiement a déjà été validé par la comptabilité et ne peut plus être annulé depuis cet écran.'
            ], 400);
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
     * CLIENT - Paiement mobile money (Moov / Airtel).
     *
     * Entièrement automatique : l'API confirme, le paiement passe direct à
     * valide, la réservation est confirmée et la facture générée
     * (mode_generation = automatique). Aucune action caissier/comptabilité.
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
                'message' => 'La réservation doit être validée par le SG avant le paiement'
            ], 400);
        }

        $existing = Paiement::where('id_reservation', $validated['id_reservation'])
            ->whereIn('statut', ['en_attente', 'encaisse', 'valide'])
            ->first();
        if ($existing) {
            return response()->json([
                'message' => 'Un paiement est déjà en cours pour cette réservation',
                'paiement' => $existing
            ], 409);
        }

        DB::beginTransaction();
        try {
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

            $facture = $this->generateInvoice($paiement, 'automatique');
            $this->notifyClient($reservation, 'Paiement confirmé', 'Votre paiement en ligne a été confirmé et votre réservation est validée.');

            DB::commit();

            $rates = ['airtel_money' => 1.8, 'moov_money' => 1.6];

            return response()->json([
                'message' => 'Paiement effectué avec succès. Réservation confirmée.',
                'paiement' => $paiement->load(['reservation.client', 'reservation.salle']),
                'simulation' => [
                    'operator' => $validated['mode_paiement'],
                    'rate' => $rates[$validated['mode_paiement']] ?? 0,
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
            Log::error('Erreur paiement mobile money', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors du paiement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * WEBHOOK - Confirmation paiement mobile money (intégration réelle future).
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

                    $this->generateInvoice($paiement, 'automatique');
                    $this->notifyClient($reservation, 'Paiement en ligne confirmé', 'Votre paiement en ligne a été confirmé et votre réservation est validée.');

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

    /**
     * Génère la facture (en-tête + lignes) associée à un paiement : une ligne
     * pour la salle, une ligne par service annexe, et une ligne de frais si
     * un frais mobile money s'applique.
     */
    private function generateInvoice(Paiement $paiement, string $modeGeneration = 'automatique', ?int $idComptable = null): Facture
    {
        $paiement->loadMissing(['reservation.salle', 'reservation.services.service']);
        $reservation = $paiement->reservation;
        $salle = $reservation?->salle;

        $next = (Facture::max('id_facture') ?? 0) + 1;

        $facture = Facture::create([
            'id_paiement' => $paiement->id_paiement,
            'numero_facture' => 'FACT-' . now()->format('Y') . '-' . str_pad($next, 4, '0', STR_PAD_LEFT),
            'id_comptable' => $idComptable,
            'date_emission' => now(),
            'mode_generation' => $modeGeneration,
            'net_a_payer' => $paiement->montant,
            'frais_livraison' => 0,
            'taux_remise' => 0,
            'total_ttc' => $paiement->montant + $paiement->frais,
        ]);

        // Montant des services annexes (déjà figé sur la réservation)
        $montantServices = $reservation
            ? $reservation->services->sum('montant')
            : 0;
        $montantSalle = max(0, $paiement->montant - $montantServices);

        // Ligne salle
        LigneFacture::create([
            'id_facture' => $facture->id_facture,
            'quantite' => 1,
            'description' => 'Location salle ' . ($salle->nom_salle ?? '—'),
            'prix_unitaire' => $montantSalle,
            'montant' => $montantSalle,
        ]);

        // Lignes services annexes
        if ($reservation) {
            foreach ($reservation->services as $rs) {
                LigneFacture::create([
                    'id_facture' => $facture->id_facture,
                    'quantite' => $rs->quantite,
                    'description' => $rs->service->nom ?? 'Service',
                    'prix_unitaire' => $rs->prix_unitaire_applique,
                    'montant' => $rs->montant,
                ]);
            }
        }

        // Ligne frais mobile money
        if ($paiement->frais > 0) {
            LigneFacture::create([
                'id_facture' => $facture->id_facture,
                'quantite' => 1,
                'description' => 'Frais ' . str_replace('_', ' ', $paiement->mode_paiement),
                'prix_unitaire' => $paiement->frais,
                'montant' => $paiement->frais,
            ]);
        }

        return $facture;
    }

    private function notifyClient($reservation, $titre, $contenu = null)
    {
        Notification::create([
            'id_utilisateur' => $reservation->id_client,
            'titre' => $titre,
            'contenu' => $contenu ?? ('Votre paiement pour la réservation du ' . $reservation->date_debut->format('d/m/Y à H:i') . ' a été traité.'),
            'type' => 'paiement',
            'est_lu' => false,
            'date_creation' => now(),
        ]);
    }

    /**
     * Prix total = location salle (heures ouvrées) + services annexes figés.
     */
    private function calculatePrice($reservation)
    {
        $reservation->loadMissing(['salle.tarifs', 'client', 'services']);

        $categorieClient = $reservation->client->categorie_client ?? 'association_base';

        $tarif = $reservation->salle->tarifs
            ->where('categorie_client', $categorieClient)
            ->first()
            ?? $reservation->salle->tarifs->first();

        $prixSalle = 0;
        if ($tarif) {
            $openMinutes = BusinessHours::computeOpenMinutes($reservation->date_debut, $reservation->date_fin);
            if ($tarif->unite === 'heure') {
                $unites = max(1, (int) ceil($openMinutes / 60));
            } else {
                $unites = max(1, (int) ceil($openMinutes / 600));
            }
            $prixSalle = $tarif->prix * $unites;
        } else {
            Log::warning('Aucun tarif trouvé pour la salle', [
                'id_salle' => $reservation->id_salle,
                'categorie_client' => $categorieClient,
            ]);
        }

        $prixServices = $reservation->services->sum('montant');

        return $prixSalle + $prixServices;
    }
}