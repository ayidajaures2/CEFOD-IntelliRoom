<?php
// app/Http/Controllers/Api/ComptabiliteController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use App\Models\Facture;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ComptabiliteController extends Controller
{
    public function dashboard()
    {
        return response()->json([
            'stats' => $this->statsArray(),
            'recentPayments' => $this->recentPaymentsArray(),
        ]);
    }

    public function getStats()
    {
        return response()->json($this->statsArray());
    }

    private function statsArray(): array
    {
        return [
            // Paiements encaissés (espèces par le caissier, ou chèque/virement
            // enregistrés par la comptabilité elle-même) en attente de
            // validation — l'indicateur le plus important pour ce rôle.
            'pendingValidation' => Paiement::where('statut', 'encaisse')->count(),
            'validatedPayments' => Paiement::where('statut', 'valide')->count(),
            'totalRevenue' => (Paiement::where('statut', 'valide')->sum('montant') ?? 0)
                + (Paiement::where('statut', 'valide')->sum('frais') ?? 0),
            // Productivité personnelle : combien CETTE comptabilité a validé
            'validatedByMe' => Paiement::where('id_comptable', Auth::id())->count(),
            'totalInvoices' => Facture::count(),
            'manualInvoices' => Facture::where('mode_generation', 'manuelle')->count(),
            'automaticInvoices' => Facture::where('mode_generation', 'automatique')->count(),
        ];
    }

    private function recentPaymentsArray()
    {
        // Les paiements encaissés en attente de validation d'abord, les plus
        // anciens en premier (éviter qu'un dossier traîne).
        return Paiement::where('statut', 'encaisse')
            ->with(['reservation.client', 'reservation.salle'])
            ->orderBy('date_paiement', 'asc')
            ->limit(10)
            ->get();
    }

    public function getRecentPayments()
    {
        return response()->json($this->recentPaymentsArray());
    }

    /**
     * Répartition des paiements VALIDÉS par mode (donut), tous modes
     * confondus — vue d'ensemble complète, contrairement au caissier qui
     * ne voit que les espèces.
     */
    public function getChartByMode()
    {
        return response()->json([
            ['name' => 'Espèces',      'value' => Paiement::where('mode_paiement', 'especes')->where('statut', 'valide')->count()],
            ['name' => 'Chèque',       'value' => Paiement::where('mode_paiement', 'cheque')->where('statut', 'valide')->count()],
            ['name' => 'Virement',     'value' => Paiement::where('mode_paiement', 'virement')->where('statut', 'valide')->count()],
            ['name' => 'Moov Money',   'value' => Paiement::where('mode_paiement', 'moov_money')->where('statut', 'valide')->count()],
            ['name' => 'Airtel Money', 'value' => Paiement::where('mode_paiement', 'airtel_money')->where('statut', 'valide')->count()],
        ]);
    }

    /**
     * Revenus validés des 7 derniers jours (barres), tous modes confondus.
     */
    public function getRevenueChart()
    {
        $data = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $montant = Paiement::where('statut', 'valide')
                ->whereDate('date_paiement', $date->toDateString())
                ->sum('montant');
            $data[] = [
                'jour' => ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][$date->dayOfWeekIso - 1],
                'montant' => (float) $montant,
            ];
        }
        return response()->json($data);
    }

    /**
     * Factures par année (réutilise la logique déjà présente côté admin,
     * mais accessible directement à la comptabilité sans passer par /admin).
     */
    public function getInvoicesByYear()
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

        return response()->json($data);
    }
}