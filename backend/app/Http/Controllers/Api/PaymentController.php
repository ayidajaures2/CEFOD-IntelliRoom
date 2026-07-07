<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\Facture;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PaymentController extends Controller
{
    // CAISSIER - Liste des paiements
    public function cashierPayments(Request $request)
    {
        $query = Paiement::with(['reservation', 'reservation.client', 'reservation.salle'])
            ->orderBy('date_paiement', 'desc');

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        return response()->json($query->paginate(20));
    }

    // CAISSIER - Enregistrer un paiement présentiel
    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_reservation' => 'required|exists:reservation,id_reservation',
            'montant' => 'required|numeric|min:0',
            'mode_paiement' => 'required|in:especes,mobile_money',
            'reference' => 'nullable|string|max:100',
        ]);

        // Vérifier si paiement existe déjà
        $existing = Paiement::where('id_reservation', $validated['id_reservation'])->first();
        if ($existing) {
            return response()->json(['message' => 'Un paiement existe déjà pour cette réservation'], 409);
        }

        $paiement = Paiement::create([
            'id_reservation' => $validated['id_reservation'],
            'id_caissier' => Auth::id(),
            'montant' => $validated['montant'],
            'mode_paiement' => $validated['mode_paiement'],
            'statut' => 'valide',
            'reference' => $validated['reference'] ?? null,
            'date_paiement' => now(),
        ]);

        // Mettre à jour la réservation
        $reservation = Reservation::find($validated['id_reservation']);
        $reservation->statut = 'confirmee';
        $reservation->save();

        // Générer la facture
        $facture = Facture::create([
            'id_paiement' => $paiement->id_paiement,
            'numero_facture' => 'FACT-' . now()->format('Y') . '-' . str_pad($paiement->id_paiement, 4, '0', STR_PAD_LEFT),
            'date_emission' => now(),
        ]);

        // Notifier le client
        $this->notifyClient($reservation, 'Paiement confirmé');

        return response()->json([
            'paiement' => $paiement,
            'facture' => $facture,
        ], 201);
    }

    // CAISSIER - Valider un paiement
    public function validatePayment($id)
    {
        $paiement = Paiement::findOrFail($id);
        $paiement->statut = 'valide';
        $paiement->id_caissier = Auth::id();
        $paiement->save();

        $reservation = $paiement->reservation;
        $reservation->statut = 'confirmee';
        $reservation->save();

        Facture::create([
            'id_paiement' => $paiement->id_paiement,
            'numero_facture' => 'FACT-' . now()->format('Y') . '-' . str_pad($paiement->id_paiement, 4, '0', STR_PAD_LEFT),
            'date_emission' => now(),
        ]);

        $this->notifyClient($reservation, 'Paiement confirmé');

        return response()->json(['message' => 'Paiement validé']);
    }

    // CAISSIER - Voir un paiement
    public function show($id)
    {
        return response()->json(Paiement::with(['reservation', 'reservation.client', 'reservation.salle'])->findOrFail($id));
    }

    // CAISSIER - Annuler un paiement
    public function cancel($id)
    {
        $paiement = Paiement::findOrFail($id);
        $paiement->statut = 'annule';
        $paiement->save();

        return response()->json(['message' => 'Paiement annulé']);
    }

    // CAISSIER - Historique des paiements
    public function history(Request $request)
    {
        $query = Paiement::with(['reservation', 'reservation.client', 'reservation.salle'])
            ->orderBy('date_paiement', 'desc');

        if ($request->has('start_date')) {
            $query->whereDate('date_paiement', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('date_paiement', '<=', $request->end_date);
        }

        return response()->json($query->paginate(20));
    }

    // ADMIN - Superviser les paiements
    public function adminIndex(Request $request)
    {
        $query = Paiement::with(['reservation', 'reservation.client', 'reservation.salle'])
            ->orderBy('date_paiement', 'desc');

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        return response()->json($query->paginate(20));
    }

    // PAIEMENT EN LIGNE (V2 - à implémenter plus tard)
    public function initiateOnlinePayment(Request $request)
    {
        return response()->json(['message' => 'Paiement en ligne bientôt disponible'], 501);
    }

    public function checkPaymentStatus($transaction_id)
    {
        return response()->json(['status' => 'en_attente']);
    }

    public function handleWebhook(Request $request)
    {
        return response()->json(['message' => 'Webhook reçu']);
    }

    // PRIVÉ
    private function notifyClient($reservation, $message)
    {
        Notification::create([
            'id_utilisateur' => $reservation->id_client,
            'titre' => $message,
            'contenu' => 'Votre paiement pour la réservation du ' . $reservation->date_debut->format('d/m/Y à H:i') . ' a été confirmé.',
            'type' => 'confirmation',
            'est_lu' => false,
            'date_creation' => now(),
        ]);
    }
}