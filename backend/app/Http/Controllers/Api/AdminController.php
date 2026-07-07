<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use App\Models\Salle;
use App\Models\Reservation;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function dashboard()
    {
        return response()->json([
            'stats' => $this->getStats(),
            'recentBookings' => $this->getRecentBookings(),
            'recentUsers' => $this->getRecentUsers(),
        ]);
    }

    public function getStats()
    {
        $totalRooms = Salle::count();
        $occupiedRooms = Salle::where('statut', 'occupee')->count();
        $occupancyRate = $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100) : 0;

        return response()->json([
            'totalUsers' => Utilisateur::count(),
            'totalRooms' => $totalRooms,
            'totalBookings' => Reservation::count(),
            'pendingBookings' => Reservation::where('statut', 'en_attente')->count(),
            'completedBookings' => Reservation::where('statut', 'terminee')->count(),
            'cancelledBookings' => Reservation::where('statut', 'annulee')->count(),
            'totalRevenue' => Paiement::where('statut', 'valide')->sum('montant') ?? 0,
            'occupancyRate' => $occupancyRate,
        ]);
    }

    public function getChartData()
    {
        $data = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $data[] = [
                'mois' => $month->format('M'),
                'reservations' => Reservation::whereYear('date_creation', $month->year)
                    ->whereMonth('date_creation', $month->month)->count(),
                'revenus' => Paiement::whereYear('date_paiement', $month->year)
                    ->whereMonth('date_paiement', $month->month)
                    ->where('statut', 'valide')->sum('montant') ?? 0,
            ];
        }
        return response()->json($data);
    }

    public function getOccupancyData()
    {
        return response()->json([
            ['name' => 'Libres', 'value' => Salle::where('statut', 'libre')->count()],
            ['name' => 'Réservées', 'value' => Salle::where('statut', 'reservee')->count()],
            ['name' => 'Occupées', 'value' => Salle::where('statut', 'occupee')->count()],
        ]);
    }

    public function getRevenueData()
    {
        $data = DB::table('salle')
            ->join('reservation', 'salle.id_salle', '=', 'reservation.id_salle')
            ->join('paiement', 'reservation.id_reservation', '=', 'paiement.id_reservation')
            ->where('paiement.statut', 'valide')
            ->select('salle.nom_salle as salle', DB::raw('SUM(paiement.montant) as revenus'))
            ->groupBy('salle.id_salle', 'salle.nom_salle')
            ->get();

        return response()->json($data);
    }

    public function getRecentBookings()
    {
        $bookings = Reservation::with(['client', 'salle'])
            ->orderBy('date_creation', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($b) {
                return [
                    'id' => $b->id_reservation,
                    'client' => ($b->client->prenom ?? '') . ' ' . ($b->client->nom ?? ''),
                    'salle' => $b->salle->nom_salle ?? 'N/A',
                    'date' => $b->date_debut->format('Y-m-d'),
                    'heure' => $b->date_debut->format('H:i'),
                    'statut' => $b->statut,
                    'montant' => $b->paiement?->montant,
                ];
            });

        return response()->json($bookings);
    }

    public function getRecentUsers()
    {
        $users = Utilisateur::orderBy('date_creation', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id_utilisateur,
                    'nom' => $u->nom,
                    'prenom' => $u->prenom,
                    'email' => $u->email,
                    'role' => $u->role,
                    'date' => $u->date_creation->format('Y-m-d'),
                ];
            });

        return response()->json($users);
    }

    public function getUsers(Request $request)
    {
        $query = Utilisateur::orderBy('date_creation', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('nom', 'LIKE', "%{$search}%")
                ->orWhere('prenom', 'LIKE', "%{$search}%")
                ->orWhere('email', 'LIKE', "%{$search}%");
        }

        return response()->json($query->paginate(15));
    }

    public function getUser($id)
    {
        return response()->json(Utilisateur::findOrFail($id));
    }

    public function storeUser(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|unique:utilisateur,email',
            'telephone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,receptionniste,caissier,client',
        ]);

        $user = Utilisateur::create([
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'email' => $validated['email'],
            'telephone' => $validated['telephone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'date_creation' => now(),
        ]);

        return response()->json($user, 201);
    }

    public function updateUser(Request $request, $id)
    {
        $user = Utilisateur::findOrFail($id);

        $validated = $request->validate([
            'nom' => 'sometimes|string|max:100',
            'prenom' => 'sometimes|string|max:100',
            'email' => 'sometimes|email|unique:utilisateur,email,' . $id . ',id_utilisateur',
            'telephone' => 'nullable|string|max:20',
            'role' => 'sometimes|in:admin,receptionniste,caissier,client',
        ]);

        if ($request->filled('password')) {
            $validated['password'] = Hash::make($request->password);
        }

        $user->update($validated);
        return response()->json($user);
    }

    public function updateUserRole(Request $request, $id)
    {
        $user = Utilisateur::findOrFail($id);
        $user->role = $request->validate(['role' => 'required|in:admin,receptionniste,caissier,client'])['role'];
        $user->save();

        return response()->json(['message' => 'Rôle mis à jour']);
    }

    public function deleteUser($id)
    {
        if ((int)$id === Auth::id()) {
            return response()->json(['message' => 'Vous ne pouvez pas vous supprimer vous-même'], 403);
        }

        Utilisateur::findOrFail($id)->delete();
        return response()->json(['message' => 'Utilisateur supprimé']);
    }
}