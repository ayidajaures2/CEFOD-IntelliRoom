<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use App\Models\LigneFacture;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceController extends Controller
{
    /**
     * Peut CONSULTER une facture : admin, comptabilité, caissier,
     * réceptionniste (le client accède aux siennes via une autre voie).
     * Le SG n'est pas concerné par les factures.
     */
    private function canView(): bool
    {
        return in_array(Auth::user()?->role, ['admin', 'comptabilite', 'caissier', 'receptionniste'], true);
    }

    /**
     * Peut TÉLÉCHARGER une facture : admin, comptabilité (le client télécharge
     * les siennes via le contrôle d'appartenance). Caissier et réceptionniste
     * consultent mais ne téléchargent pas ; le SG n'a aucun accès.
     */
    private function canDownload(): bool
    {
        return in_array(Auth::user()?->role, ['admin', 'comptabilite'], true);
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
            ->with(['paiement.reservation.salle', 'lignes'])
            ->orderBy('date_emission', 'desc')
            ->get();

        return response()->json([
            'data' => $invoices,
            'count' => $invoices->count(),
            'totalAmount' => $invoices->sum(fn ($invoice) => $invoice->paiement?->montant ?? 0),
        ]);
    }

    /**
     * Télécharger une facture PDF.
     * - Client : uniquement les siennes.
     * - Staff : admin et comptabilité seulement (caissier/réception : consultation
     *   seule → 403 ; SG : aucun accès).
     */
    public function download($id)
    {
        try {
            $facture = Facture::with([
                'paiement',
                'paiement.reservation',
                'paiement.reservation.client',
                'paiement.reservation.salle',
                'lignes',
                'comptable',
            ])->findOrFail($id);

            $user = Auth::user();
            $estProprietaire = $facture->paiement->reservation->id_client === $user->id_utilisateur;

            if (!$this->canDownload() && !$estProprietaire) {
                return response()->json([
                    'message' => 'Vous n\'êtes pas autorisé à télécharger cette facture.'
                ], 403);
            }

            if (!class_exists('Barryvdh\DomPDF\Facade\Pdf')) {
                return response()->json([
                    'message' => 'DomPDF n\'est pas installé. Exécutez : composer require barryvdh/laravel-dompdf'
                ], 500);
            }

            $pdf = Pdf::loadView('pdf.invoice', [
                'facture' => $facture,
                'lignes' => $facture->lignes,
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
     * Voir une facture (consultation).
     * - Client : uniquement les siennes.
     * - Staff : admin, comptabilité, caissier, réception (SG exclu).
     */
    public function showClientInvoice($id)
    {
        $user = Auth::user();
        $facture = Facture::with([
            'paiement',
            'paiement.reservation',
            'paiement.reservation.client',
            'paiement.reservation.salle',
            'lignes',
        ])->findOrFail($id);

        $estProprietaire = $facture->paiement->reservation->id_client === $user->id_utilisateur;

        if (!$this->canView() && !$estProprietaire) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        return response()->json($facture);
    }

    /**
     * RÉCEPTION / CAISSE - Liste des factures (consultation).
     */
    public function receptionistInvoices(Request $request)
    {
        $query = Facture::with([
            'paiement',
            'paiement.reservation',
            'paiement.reservation.client',
            'paiement.reservation.salle',
            'lignes',
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
     * Envoyer une facture par email (admin / comptabilité).
     */
    public function sendByEmail($id)
    {
        try {
            $facture = Facture::with([
                'paiement',
                'paiement.reservation',
                'paiement.reservation.client',
                'paiement.reservation.salle',
                'lignes',
                'comptable',
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
                'lignes' => $facture->lignes,
                'reservation' => $facture->paiement->reservation,
                'client' => $client,
                'salle' => $facture->paiement->reservation->salle,
                'paiement' => $facture->paiement,
            ]);

            // TODO: Mail::to($email)->send(new InvoiceMail($facture, $pdf));

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
     */
    public function adminIndex(Request $request)
    {
        $query = Facture::with([
            'paiement',
            'paiement.reservation',
            'paiement.reservation.client',
            'paiement.reservation.salle',
            'lignes',
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
            'paiement.reservation.salle.tarifs',
            'lignes',
        ])->findOrFail($id);

        $facture->montant = $facture->paiement?->montant ?? 0;
        $facture->mode_paiement = $facture->paiement?->mode_paiement ?? 'Non renseigné';
        $facture->client = $facture->paiement->reservation->client ?? null;
        $facture->salle = $facture->paiement->reservation->salle ?? null;

        return response()->json($facture);
    }

    /**
     * COMPTABILITÉ / ADMIN - Réparer une facture manquante (cas exceptionnel :
     * paiement valide sans facture, suite à un incident). Le chemin normal
     * génère la facture automatiquement à la validation du paiement.
     */
    public function generateManually(Request $request)
    {
        $validated = $request->validate([
            'id_paiement' => 'required|exists:paiement,id_paiement',
        ]);

        $paiement = Paiement::with(['reservation.salle', 'reservation.services.service'])->find($validated['id_paiement']);
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

        $reservation = $paiement->reservation;
        $next = (Facture::max('id_facture') ?? 0) + 1;

        $facture = Facture::create([
            'id_paiement' => $paiement->id_paiement,
            'numero_facture' => 'FACT-' . now()->format('Y') . '-' . str_pad($next, 4, '0', STR_PAD_LEFT),
            'id_comptable' => Auth::id(),
            'date_emission' => now(),
            'mode_generation' => 'manuelle',
            'net_a_payer' => $paiement->montant,
            'total_ttc' => $paiement->montant + $paiement->frais,
        ]);

        $montantServices = $reservation ? $reservation->services->sum('montant') : 0;
        $montantSalle = max(0, $paiement->montant - $montantServices);

        LigneFacture::create([
            'id_facture' => $facture->id_facture,
            'quantite' => 1,
            'description' => 'Location salle ' . ($reservation->salle->nom_salle ?? '—'),
            'prix_unitaire' => $montantSalle,
            'montant' => $montantSalle,
        ]);

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

        return response()->json([
            'message' => 'Facture générée avec succès',
            'facture' => $facture->load(['paiement.reservation.client', 'paiement.reservation.salle', 'lignes'])
        ], 201);
    }

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