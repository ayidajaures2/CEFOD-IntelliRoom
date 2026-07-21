<?php
// app/Http/Controllers/Api/CashierController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use Illuminate\Http\Request;

class CashierController extends Controller
{
    /**
     * ⚠ CORRIGÉ : dashboard() imbriquait le JsonResponse de getStats()
     * dans response()->json() → {"stats":{}} vide côté frontend.
     */
    public function dashboard()
    {
        return response()->json([
            'stats' => $this->statsArray(),
        ]);
    }

    public function getStats()
    {
        return response()->json($this->statsArray());
    }

    private function statsArray(): array
    {
        return [
            'pendingPayments' => Paiement::where('statut', 'en_attente')->count(),
            'validatedPayments' => Paiement::where('statut', 'valide')->count(),
            'totalRevenue' => Paiement::where('statut', 'valide')->sum('montant') ?? 0,
        ];
    }

    // Paiements par mode (donut) — uniquement les paiements validés
    public function getChartByMode()
    {
        return response()->json([
            ['name' => 'Espèces',      'value' => Paiement::where('mode_paiement','especes')->where('statut','valide')->count()],
            ['name' => 'Moov Money',   'value' => Paiement::where('mode_paiement','moov_money')->where('statut','valide')->count()],
            ['name' => 'Airtel Money', 'value' => Paiement::where('mode_paiement','airtel_money')->where('statut','valide')->count()],
        ]);
    }

    // Encaissements des 7 derniers jours (barres)
    public function getRevenueChart()
    {
        $data = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $montant = Paiement::where('statut','valide')
                ->whereDate('date_paiement', $date->toDateString())
                ->sum('montant');
            $data[] = [
                'jour' => ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'][$date->dayOfWeekIso - 1],
                'montant' => (float) $montant,
            ];
        }
        return response()->json($data);
    }
}
