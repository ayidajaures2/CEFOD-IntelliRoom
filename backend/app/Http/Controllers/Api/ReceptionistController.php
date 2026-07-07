<?php
// app/Http/Controllers/Api/ReceptionistController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Salle;
use Illuminate\Http\Request;

class ReceptionistController extends Controller
{
    public function getStats()
    {
        $today = now()->toDateString();
        
        return response()->json([
            'todayBookings' => Reservation::whereDate('date_debut', $today)->count(),
            'pendingBookings' => Reservation::where('statut', 'en_attente')->count(),
            'completedBookings' => Reservation::where('statut', 'terminee')->count(),
            'cancelledBookings' => Reservation::where('statut', 'annulee')->count(),
            'totalRooms' => Salle::count(),
            'occupancyRate' => $this->calculateOccupancyRate(),
        ]);
    }

    public function getChartData()
    {
        $data = [];
        $jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $jour = $jours[now()->subDays($i)->dayOfWeekIso - 1];
            
            $data[] = [
                'jour' => $jour,
                'effectuees' => Reservation::whereDate('date_debut', $date->toDateString())
                    ->where('statut', 'terminee')->count(),
                'en_attente' => Reservation::whereDate('date_debut', $date->toDateString())
                    ->where('statut', 'en_attente')->count(),
                'annulees' => Reservation::whereDate('date_debut', $date->toDateString())
                    ->where('statut', 'annulee')->count(),
            ];
        }
        
        return response()->json($data);
    }

    private function calculateOccupancyRate()
    {
        $total = Salle::count();
        if ($total === 0) return 0;
        
        $occupied = Salle::where('statut', 'occupee')->count();
        return round(($occupied / $total) * 100);
    }
}