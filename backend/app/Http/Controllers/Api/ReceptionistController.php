<?php
// app/Http/Controllers/Api/ReceptionistController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Salle;
use Illuminate\Http\Request;

class ReceptionistController extends Controller
{
    /**
     * ⚠ CORRIGÉ : dashboard() imbriquait des JsonResponse → objets vides.
     */
    public function dashboard()
    {
        return response()->json([
            'stats' => $this->statsArray(),
            'recentBookings' => $this->recentBookingsArray(),
        ]);
    }

    public function getStats()
    {
        return response()->json($this->statsArray());
    }

    private function statsArray(): array
    {
        $today = now()->toDateString();

        return [
            'todayBookings' => Reservation::whereDate('date_debut', $today)->count(),
            'pendingBookings' => Reservation::where('statut', 'en_attente')->count(),
            // ⚠ CORRIGÉ : 'terminee' n'est jamais stocké — on compte les
            // confirmées dont le créneau est passé.
            'completedBookings' => Reservation::where('statut', 'confirmee')
                ->where('date_fin', '<', now())->count(),
            'cancelledBookings' => Reservation::where('statut', 'annulee')->count(),
            'totalRooms' => Salle::count(),
            'occupancyRate' => $this->calculateOccupancyRate(),
        ];
    }

    public function getChartData()
    {
        $data = [];
        $jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $jour = $jours[$date->dayOfWeekIso - 1];

            $data[] = [
                'jour' => $jour,
                // ⚠ CORRIGÉ : même raison — "effectuées" = confirmées dont
                // la fin est passée, pas un statut 'terminee' inexistant.
                'effectuees' => Reservation::whereDate('date_debut', $date->toDateString())
                    ->where('statut', 'confirmee')
                    ->where('date_fin', '<', now())->count(),
                'en_attente' => Reservation::whereDate('date_debut', $date->toDateString())
                    ->where('statut', 'en_attente')->count(),
                'annulees' => Reservation::whereDate('date_debut', $date->toDateString())
                    ->where('statut', 'annulee')->count(),
            ];
        }

        return response()->json($data);
    }

    private function recentBookingsArray()
    {
        return Reservation::with(['client', 'salle'])
            ->orderBy('date_creation', 'desc')
            ->limit(10)
            ->get();
    }

    public function getRecentBookings()
    {
        return response()->json($this->recentBookingsArray());
    }

    /**
     * ⚠ CORRIGÉ : se basait sur la colonne brute `statut` (jamais mise à
     * jour automatiquement) — utilise maintenant statut_effectif, cohérent
     * avec l'affichage temps réel.
     */
    private function calculateOccupancyRate()
    {
        $salles = Salle::all();
        $total = $salles->count();
        if ($total === 0) return 0;

        $occupied = $salles->filter(fn ($s) => $s->statut_effectif === 'occupee')->count();
        return round(($occupied / $total) * 100);
    }

    // Donut d'occupation pour le dashboard réception
    public function getOccupancyChart()
    {
        $salles = \App\Models\Salle::all();
        $counts = ['libre' => 0, 'reservee' => 0, 'occupee' => 0];
        foreach ($salles as $s) {
            $st = $s->statut_effectif;
            $counts[$st] = ($counts[$st] ?? 0) + 1;
        }
        return response()->json([
            ['name' => 'Libre',    'value' => $counts['libre']],
            ['name' => 'Réservée', 'value' => $counts['reservee']],
            ['name' => 'Occupée',  'value' => $counts['occupee']],
        ]);
    }
}
