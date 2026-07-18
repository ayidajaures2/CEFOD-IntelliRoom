<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    /** Le personnel peut consulter/télécharger toutes les factures. */
    private function isStaff(): bool
    {
        return in_array(Auth::user()?->role, ['receptionniste', 'admin', 'caissier'], true);
    }

    /**
     * CLIENT - Mes factures
     */
    public function clientInvoices()
    {
        $user = Auth::user();
        $invoices = Facture::whereHas('paiement.reservation', function ($query) use ($user) {
                $query->where('id_client', $user->id_utilisateur);
            })
            ->with(['paiement.reservation.salle'])
            ->orderBy('date_emission', 'desc')
            ->get();

        return response()->json([
            'data' => $invoices,
            'count' => $invoices->count(),
            'totalAmount' => $invoices->sum(fn ($invoice) => $invoice->paiement?->montant ?? 0),
        ]);
    }

    /**
     * CLIENT & RÉCEPTIONNISTE - Télécharger une facture en PDF
     *
     * ⚠ CORRIGÉ : la route est aussi montée sous /receptionist, mais le
     * contrôle "appartient au client" renvoyait 403 à la réceptionniste.
     * Le personnel peut désormais télécharger toute facture ; le client
     * reste limité aux siennes.
     */
    public function download($id)
    {
        try {
            $facture = Facture::with([
                'paiement',
                'paiement.reservation',
                'paiement.reservation.client',
                'paiement.reservation.salle'
            ])->findOrFail($id);

            $user = Auth::user();
            if (!$this->isStaff()
                && $facture->paiement->reservation->id_client !== $user->id_utilisateur) {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }

            if (!class_exists('Barryvdh\DomPDF\Facade\Pdf')) {
                return response()->json([
                    'message' => 'DomPDF n\'est pas installé. Exécutez : composer require barryvdh/laravel-dompdf'
                ], 500);
            }

            $pdf = Pdf::loadView('pdf.invoice', [
                'facture' => $facture,
                'reservation' => $facture->paiement->reservation,
                'client' => $facture->paiement->reservation->client,
                'salle' => $facture->paiement->reservation->salle,
                'paiement' => $facture->paiement,
            ]);

            return $pdf->download('facture-' . $facture->numero_facture . '.pdf');

        } catch (\Exception $e) {
            Log::error('Erreur PDF', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return response()->json([
                'message' => 'Erreur lors de la génération du PDF',
                'error' => $e->getMessage(),
                'suggestion' => 'Vérifiez que DomPDF est installé : composer require barryvdh/laravel-dompdf'
            ], 500);
        }
    }

    /**
     * CLIENT - Voir une facture
     */
    public function showClientInvoice($id)
    {
        $user = Auth::user();
        $facture = Facture::with([
            'paiement',
            'paiement.reservation',
            'paiement.reservation.client',
            'paiement.reservation.salle'
        ])->findOrFail($id);

        if (!$this->isStaff()
            && $facture->paiement->reservation->id_client !== $user->id_utilisateur) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        return response()->json($facture);
    }

    /**
     * RÉCEPTIONNISTE - Liste des factures
     *
     * ⚠ CORRIGÉ (2 bugs) :
     *  1. `$query->sum('paiement.montant')` — SQL invalide (la notation
     *     relation.colonne n'existe pas en SQL) → erreur 500 « Unknown
     *     column 'paiement.montant' » à CHAQUE ouverture de la page.
     *     Le total passe maintenant par une vraie jointure.
     *  2. La recherche mélangeait where/orWhereHas sans parenthèses :
     *     combinée aux filtres de dates, la clause OR court-circuitait
     *     tout le reste. Regroupée dans une closure.
     */
    public function receptionistInvoices(Request $request)
    {
        $query = Facture::with([
            'paiement',
            'paiement.reservation',
            'paiement.reservation.client',
            'paiement.reservation.salle'
        ])->orderBy('date_emission', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('numero_facture', 'LIKE', "%{$search}%")
                    ->orWhereHas('paiement.reservation.client', function ($qc) use ($search) {
                        $qc->where('nom', 'LIKE', "%{$search}%")
                            ->orWhere('prenom', 'LIKE', "%{$search}%");
                    });
            });
        }

        if ($request->has('date_from')) {
            $query->whereDate('date_emission', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('date_emission', '<=', $request->date_to);
        }

        $summaryTotal = (clone $query)->count();
        $summaryAmount = (clone $query)
            ->join('paiement', 'facture.id_paiement', '=', 'paiement.id_paiement')
            ->sum('paiement.montant');

        return response()->json([
            'data' => $query->paginate(20),
            'summary' => [
                'total' => $summaryTotal,
                'totalAmount' => $summaryAmount ?? 0,
            ]
        ]);
    }

    /**
     * RÉCEPTIONNISTE - Envoyer une facture par email
     */
    public function sendByEmail($id)
    {
        try {
            $facture = Facture::with([
                'paiement',
                'paiement.reservation',
                'paiement.reservation.client',
                'paiement.reservation.salle'
            ])->findOrFail($id);

            $client = $facture->paiement->reservation->client;
            $email = $client->email;

            if (!$email) {
                return response()->json(['message' => 'Le client n\'a pas d\'email enregistré'], 400);
            }

            if (!class_exists('Barryvdh\DomPDF\Facade\Pdf')) {
                return response()->json([
                    'message' => 'DomPDF n\'est pas installé pour générer le PDF'
                ], 500);
            }

            $pdf = Pdf::loadView('pdf.invoice', [
                'facture' => $facture,
                'reservation' => $facture->paiement->reservation,
                'client' => $client,
                'salle' => $facture->paiement->reservation->salle,
                'paiement' => $facture->paiement,
            ]);

            // TODO: Envoyer l'email avec le PDF
            // Mail::to($email)->send(new InvoiceMail($facture, $pdf));

            return response()->json([
                'message' => 'Facture envoyée par email à ' . $email,
                'client' => $client,
                'email' => $email
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur envoi email facture', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Erreur lors de l\'envoi de l\'email',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ADMIN - Liste des factures (supervision complète)
     *
     * ⚠ CORRIGÉ : mêmes erreurs SQL `sum('paiement.montant')` qu'en
     * réception (page admin en 500), remplacées par des jointures.
     */
    public function adminIndex(Request $request)
    {
        $query = Facture::with([
            'paiement',
            'paiement.reservation',
            'paiement.reservation.client',
            'paiement.reservation.salle'
        ])->orderBy('date_emission', 'desc');

        if ($request->has('search')) {
            $query->where('numero_facture', 'LIKE', "%{$request->search}%");
        }

        if ($request->has('date_from')) {
            $query->whereDate('date_emission', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('date_emission', '<=', $request->date_to);
        }

        if ($request->has('mode_generation')) {
            $query->where('mode_generation', $request->mode_generation);
        }

        return response()->json([
            'data' => $query->paginate(20),
            'summary' => [
                'total' => Facture::count(),
                'totalAmount' => Facture::join('paiement', 'facture.id_paiement', '=', 'paiement.id_paiement')
                    ->sum('paiement.montant') ?? 0,
                'automatic' => Facture::where('mode_generation', 'automatique')->count(),
                'manual' => Facture::where('mode_generation', 'manuelle')->count(),
                'byYear' => $this->getInvoicesByYear(),
            ]
        ]);
    }

    /**
     * ADMIN - Voir une facture
     */
    public function show($id)
    {
        $facture = Facture::with([
            'paiement',
            'paiement.reservation',
            'paiement.reservation.client',
            'paiement.reservation.salle',
            'paiement.reservation.salle.tarifs'
        ])->findOrFail($id);

        $facture->montant = $facture->paiement?->montant ?? 0;
        $facture->mode_paiement = $facture->paiement?->mode_paiement ?? 'Non renseigné';
        $facture->client = $facture->paiement->reservation->client ?? null;
        $facture->salle = $facture->paiement->reservation->salle ?? null;

        return response()->json($facture);
    }

    /**
     * CAISSIER - Générer une facture manuelle
     */
    public function generateManually(Request $request)
    {
        $validated = $request->validate([
            'id_paiement' => 'required|exists:paiement,id_paiement',
        ]);

        $paiement = Paiement::with(['reservation'])->find($validated['id_paiement']);
        if (!$paiement) {
            return response()->json(['message' => 'Paiement non trouvé'], 404);
        }

        if ($paiement->statut !== 'valide') {
            return response()->json([
                'message' => 'Le paiement doit être validé avant de générer la facture'
            ], 400);
        }

        $existing = Facture::where('id_paiement', $paiement->id_paiement)->first();
        if ($existing) {
            return response()->json([
                'message' => 'Une facture existe déjà pour ce paiement',
                'facture' => $existing
            ], 409);
        }

        // ⚠ CORRIGÉ : count()+1 → collisions après suppression ; on
        // repart du dernier id, insensible aux trous.
        $next = (Facture::max('id_facture') ?? 0) + 1;
        $facture = Facture::create([
            'id_paiement' => $paiement->id_paiement,
            'numero_facture' => 'FACT-' . now()->format('Y') . '-' . str_pad($next, 4, '0', STR_PAD_LEFT),
            'date_emission' => now(),
            'mode_generation' => 'manuelle',
        ]);

        return response()->json([
            'message' => 'Facture générée avec succès',
            'facture' => $facture->load(['paiement.reservation.client', 'paiement.reservation.salle'])
        ], 201);
    }

    /**
     * ADMIN - Statistiques des factures par année
     *
     * ⚠ CORRIGÉ : même bug sum('paiement.montant') → jointure.
     */
    private function getInvoicesByYear()
    {
        $years = Facture::selectRaw('YEAR(date_emission) as year')
            ->distinct()
            ->orderBy('year', 'desc')
            ->pluck('year');

        $data = [];
        foreach ($years as $year) {
            $data[] = [
                'year' => $year,
                'count' => Facture::whereYear('date_emission', $year)->count(),
                'total' => Facture::whereYear('facture.date_emission', $year)
                    ->join('paiement', 'facture.id_paiement', '=', 'paiement.id_paiement')
                    ->sum('paiement.montant') ?? 0,
            ];
        }

        return $data;
    }

    /**
     * ADMIN - Supprimer une facture (seulement si pas de paiement validé)
     */
    public function deleteInvoice($id)
    {
        $facture = Facture::with(['paiement'])->findOrFail($id);

        if ($facture->paiement && $facture->paiement->statut === 'valide') {
            return response()->json([
                'message' => 'Impossible de supprimer une facture associée à un paiement validé'
            ], 400);
        }

        $facture->delete();

        return response()->json(['message' => 'Facture supprimée avec succès']);
    }
}
