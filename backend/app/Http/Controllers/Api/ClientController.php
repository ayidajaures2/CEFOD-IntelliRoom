<?php
// app/Http/Controllers/Api/ClientController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClientController extends Controller
{
    /**
     * ⚠ CORRIGÉ : dashboard() imbriquait des JsonResponse (le retour de
     * getStats()/getRecentBookings()) dans response()->json(), ce qui
     * sérialise des objets vides {}. Les méthodes publiques restent pour
     * les routes, mais elles délèguent à des méthodes privées qui
     * renvoient des tableaux/collections bruts.
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
        $user = Auth::user();
        $bookings = Reservation::where('id_client', $user->id_utilisateur)->get();

        return [
            'totalBookings' => $bookings->count(),
            'upcomingBookings' => $bookings->whereIn('statut', ['en_attente', 'validee', 'confirmee'])->count(),
            // ⚠ CORRIGÉ : 'terminee' n'est JAMAIS stocké en base (statut
            // calculé) — l'ancien filtre renvoyait toujours 0.
            'completedBookings' => $bookings
                ->where('statut', 'confirmee')
                ->filter(fn ($b) => $b->date_fin && $b->date_fin->isPast())
                ->count(),
        ];
    }

    private function recentBookingsArray()
    {
        $user = Auth::user();

        return Reservation::where('id_client', $user->id_utilisateur)
            ->with(['salle'])
            ->orderBy('date_creation', 'desc')
            ->limit(10)
            ->get();
    }

    public function getRecentBookings()
    {
        return response()->json($this->recentBookingsArray());
    }

    public function index()
    {
        return response()->json(Utilisateur::where('role', 'client')->get());
    }

    public function show($id)
    {
        return response()->json(Utilisateur::findOrFail($id));
    }
}
