<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InvoiceController extends Controller
{
    // CLIENT - Mes factures
    public function clientInvoices()
    {
        $user = Auth::user();
        return response()->json(
            Facture::whereHas('paiement.reservation', function ($query) use ($user) {
                $query->where('id_client', $user->id_utilisateur);
            })->with(['paiement.reservation.salle'])->get()
        );
    }

    // CLIENT - Télécharger une facture
    public function download($id)
    {
        $facture = Facture::with(['paiement.reservation.client', 'paiement.reservation.salle'])
            ->findOrFail($id);

        // TODO: Implémenter PDF avec DomPDF
        return response()->json([
            'message' => 'Téléchargement PDF - À implémenter avec DomPDF',
            'facture' => $facture
        ]);
    }

    // RÉCEPTIONNISTE - Liste des factures
    public function receptionistInvoices(Request $request)
    {
        $query = Facture::with(['paiement.reservation.client', 'paiement.reservation.salle'])
            ->orderBy('date_emission', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('numero_facture', 'LIKE', "%{$search}%");
        }

        return response()->json($query->paginate(20));
    }

    // RÉCEPTIONNISTE - Envoyer une facture par email
    public function sendByEmail($id)
    {
        $facture = Facture::with(['paiement.reservation.client'])->findOrFail($id);

        // TODO: Implémenter envoi email
        return response()->json(['message' => 'Facture envoyée par email - À implémenter']);
    }

    // ADMIN - Liste des factures
    public function adminIndex(Request $request)
    {
        $query = Facture::with(['paiement.reservation.client', 'paiement.reservation.salle'])
            ->orderBy('date_emission', 'desc')
            ->paginate(20);

        return response()->json($query);
    }

    // ADMIN - Voir une facture
    public function show($id)
    {
        return response()->json(
            Facture::with(['paiement.reservation.client', 'paiement.reservation.salle'])->findOrFail($id)
        );
    }

    // CAISSIER - Générer une facture manuelle
    public function generateManually(Request $request)
    {
        $validated = $request->validate([
            'id_paiement' => 'required|exists:paiement,id_paiement',
        ]);

        $paiement = Paiement::find($validated['id_paiement']);

        $facture = Facture::create([
            'id_paiement' => $paiement->id_paiement,
            'numero_facture' => 'FACT-' . now()->format('Y') . '-' . str_pad(Facture::count() + 1, 4, '0', STR_PAD_LEFT),
            'date_emission' => now(),
        ]);

        return response()->json($facture, 201);
    }
}