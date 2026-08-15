<?php
// app/Http/Controllers/Api/CashierController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use Illuminate\Http\Request;

class CashierController extends Controller
{
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

    /**
     * Le caissier n'encaisse que les espèces. Ses stats distinguent désormais
     * les paiements encaissés (en attente de validation comptable) des
     * paiements déjà validés.
     */
    private function statsArray(): array
    {
        return [
            // Espèces encaissées par la caisse, en attente de validation comptable
            'encaissedPayments' => Paiement::where('mode_paiement', 'especes')
                ->where('statut', 'encaisse')->count(),
            // Espèces déjà validées par la comptabilité
            'validatedPayments' => Paiement::where('mode_paiement', 'especes')
                ->where('statut', 'valide')->count(),
            // Total encaissé en espèces et validé
            'totalRevenue' => Paiement::where('mode_paiement', 'especes')
                ->where('statut', 'valide')->sum('montant') ?? 0,
        ];
    }

    /**
     * Répartition des paiements VALIDÉS par mode (donut). Inclut désormais les
     * 5 modes. Le caissier ne gère que le cash, mais ce graphe donne une vue
     * d'ensemble des encaissements de l'établissement.
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
     * Encaissements espèces des 7 derniers jours (barres). On se base sur les
     * paiements espèces validés, cohérent avec le périmètre du caissier.
     */
    public function getRevenueChart()
    {
        $data = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $montant = Paiement::where('mode_paiement', 'especes')
                ->where('statut', 'valide')
                ->whereDate('date_paiement', $date->toDateString())
                ->sum('montant');
            $data[] = [
                'jour' => ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][$date->dayOfWeekIso - 1],
                'montant' => (float) $montant,
            ];
        }
        return response()->json($data);
    }
}