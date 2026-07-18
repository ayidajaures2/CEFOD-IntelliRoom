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
}
