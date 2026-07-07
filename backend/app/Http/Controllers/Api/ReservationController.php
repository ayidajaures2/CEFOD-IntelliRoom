<?php

namespace App\Http\Controllers\Api;

use App\Models\Reservation;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class ReservationController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'id_salle' => 'required|exists:Salle,id_salle',
            'date_debut' => 'required|date|after:now',
            'date_fin' => 'required|date|after:date_debut',
            'motif' => 'nullable|string'
        ]);

        // Vérification simple de conflit (on pourra améliorer)
        $reservation = Reservation::create([
            'id_salle' => $request->id_salle,
            'id_client' => $request->user()->id_utilisateur,
            'date_debut' => $request->date_debut,
            'date_fin' => $request->date_fin,
            'motif' => $request->motif,
            'statut' => 'en_attente',
            'date_creation' => now(),
        ]);

        return response()->json($reservation, 201);
    }

    public function myReservations(Request $request)
    {
        $reservations = Reservation::where('id_client', $request->user()->id_utilisateur)
            ->with('salle')
            ->get();
        return response()->json($reservations);
    }
}