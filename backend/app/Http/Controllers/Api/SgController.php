<?php
// app/Http/Controllers/Api/SgController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SgController extends Controller
{
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
        return [
            // Demandes en attente de décision — l'indicateur le plus important
            // pour le SG, c'est ce qu'il doit traiter aujourd'hui.
            'pendingBookings' => Reservation::where('statut', 'en_attente')->count(),
            // Déjà validées, en attente de paiement côté client
            'validatedBookings' => Reservation::where('statut', 'validee')->count(),
            // Confirmées (payées) — pour donner une vue d'ensemble, même si
            // le SG n'intervient plus à ce stade
            'confirmedBookings' => Reservation::where('statut', 'confirmee')->count(),
            'cancelledBookings' => Reservation::where('statut', 'annulee')->count(),
            // Productivité personnelle : combien CE SG a validé au total
            'validatedByMe' => Reservation::where('id_sg', Auth::id())->count(),
        ];
    }

    private function recentBookingsArray()
    {
        // Les demandes en attente d'abord (ce qui requiert une action),
        // les plus anciennes en premier (FIFO, éviter qu'une demande
        // ancienne traîne indéfiniment derrière des plus récentes).
        return Reservation::where('statut', 'en_attente')
            ->with(['client', 'salle'])
            ->orderBy('date_creation', 'asc')
            ->limit(10)
            ->get();
    }

    public function getRecentBookings()
    {
        return response()->json($this->recentBookingsArray());
    }

    /**
     * Répartition des demandes des 7 derniers jours par statut. Basé sur
     * date_creation (aucune colonne date_validation n'existe pour dater
     * précisément l'action du SG) — cohérent avec le même choix déjà fait
     * dans ReceptionistController::getChartData().
     */
    public function getChartData()
    {
        $data = [];
        $jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $jour = $jours[$date->dayOfWeekIso - 1];

            $data[] = [
                'jour' => $jour,
                'recues' => Reservation::whereDate('date_creation', $date->toDateString())->count(),
                'validees' => Reservation::whereDate('date_creation', $date->toDateString())
                    ->whereIn('statut', ['validee', 'confirmee', 'terminee'])->count(),
                'annulees' => Reservation::whereDate('date_creation', $date->toDateString())
                    ->where('statut', 'annulee')->count(),
            ];
        }

        return response()->json($data);
    }
}