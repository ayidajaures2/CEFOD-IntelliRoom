<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use App\Models\Salle;
use App\Models\Reservation;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    // ==========================================
    // DASHBOARD & STATISTIQUES
    // ==========================================

    public function dashboard()
    {
        return response()->json([
            'stats' => $this->buildStats(),
            'recentBookings' => $this->recentBookings(5),
            'recentUsers' => $this->recentUsers(5),
        ]);
    }

    public function getStats()
    {
        return response()->json($this->buildStats());
    }

    private function buildStats()
    {
        return [
            'totalUsers' => Utilisateur::count(),
            'totalRooms' => Salle::count(),
            'totalBookings' => Reservation::count(),
            'pendingBookings' => Reservation::where('statut', 'en_attente')->count(),
            // ⚠ CORRIGÉ : 'terminee' n'est JAMAIS stocké en base (statut
            // calculé par l'accessor statut_effectif) — l'ancien filtre
            // renvoyait toujours 0. "Terminée" = confirmée + fin passée.
            'completedBookings' => Reservation::where('statut', 'confirmee')
                ->where('date_fin', '<', now())->count(),
            'cancelledBookings' => Reservation::where('statut', 'annulee')->count(),
            'totalRevenue' => Paiement::where('statut', 'valide')->sum('montant') ?? 0,
            'occupancyRate' => $this->computeOccupancyRate(),
        ];
    }

    private function computeOccupancyRate()
    {
        $salles = Salle::all();
        $total = $salles->count();
        if ($total === 0) {
            return 0;
        }
        // ⚠ CORRIGÉ : se base sur statut_effectif (calculé), pas sur la
        // colonne brute qui n'est jamais mise à jour automatiquement.
        $occupied = $salles->filter(fn ($s) => $s->statut_effectif !== 'libre')->count();
        return round(($occupied / $total) * 100, 1);
    }

    /**
     * Endpoint combiné — tout le dashboard admin en UN SEUL appel réseau.
     */
    public function dashboardFull()
    {
        return response()->json([
            'stats' => $this->buildStats(),
            'recentBookings' => $this->recentBookings(10),
            'recentUsers' => $this->recentUsers(10),
            'chartData' => $this->chartDataArray(),
            'occupancyData' => $this->occupancyDataArray(),
            'revenueData' => $this->revenueDataArray(),
        ]);
    }

    public function getChartData(Request $request)
    {
        return response()->json($this->chartDataArray());
    }

    private function chartDataArray()
    {
        $data = Reservation::selectRaw("DATE_FORMAT(date_creation, '%Y-%m') as mois_cle, COUNT(*) as total")
            ->where('date_creation', '>=', now()->subMonths(6)->startOfMonth())
            ->groupBy('mois_cle')
            ->orderBy('mois_cle')
            ->get();

        $moisFr = [
            '01' => 'Jan', '02' => 'Fév', '03' => 'Mar', '04' => 'Avr',
            '05' => 'Mai', '06' => 'Jun', '07' => 'Jul', '08' => 'Aoû',
            '09' => 'Sep', '10' => 'Oct', '11' => 'Nov', '12' => 'Déc',
        ];

        return $data->map(function ($row) use ($moisFr) {
            [$annee, $mois] = explode('-', $row->mois_cle);
            return [
                'mois' => $moisFr[$mois] . ' ' . substr($annee, 2),
                'reservations' => (int) $row->total,
            ];
        })->values();
    }

    public function getOccupancyData()
    {
        return response()->json($this->occupancyDataArray());
    }

    private function occupancyDataArray()
    {
        $salles = Salle::with('reservations')->get();

        $counts = ['libre' => 0, 'reservee' => 0, 'occupee' => 0];

        foreach ($salles as $salle) {
            $statut = $salle->statut_effectif;
            $counts[$statut] = ($counts[$statut] ?? 0) + 1;
        }

        return [
            ['name' => 'Libre', 'value' => $counts['libre']],
            ['name' => 'Réservée', 'value' => $counts['reservee']],
            ['name' => 'Occupée', 'value' => $counts['occupee']],
        ];
    }

    public function getRevenueData()
    {
        return response()->json($this->revenueDataArray());
    }

    private function revenueDataArray()
    {
        return Paiement::where('paiement.statut', 'valide')
            ->join('reservation', 'paiement.id_reservation', '=', 'reservation.id_reservation')
            ->join('salle', 'reservation.id_salle', '=', 'salle.id_salle')
            ->selectRaw('salle.nom_salle as salle, SUM(paiement.montant) as revenus')
            ->groupBy('salle.nom_salle')
            ->orderByDesc('revenus')
            ->get();
    }

    /**
     * ✅ AJOUT — Revenus encaissés par mois (6 derniers mois), pour la
     * courbe évolutive du dashboard admin. Se base sur les paiements
     * validés : montant + frais.
     */
    public function getRevenueMonthly()
    {
        $data = Paiement::selectRaw(
                "DATE_FORMAT(date_paiement, '%Y-%m') as mois_cle, "
                . "SUM(montant) as somme_montant, SUM(frais) as somme_frais"
            )
            ->where('statut', 'valide')
            ->where('date_paiement', '>=', now()->subMonths(6)->startOfMonth())
            ->groupBy('mois_cle')
            ->orderBy('mois_cle')
            ->get();

        $moisFr = [
            '01' => 'Jan', '02' => 'Fév', '03' => 'Mar', '04' => 'Avr',
            '05' => 'Mai', '06' => 'Jun', '07' => 'Jul', '08' => 'Aoû',
            '09' => 'Sep', '10' => 'Oct', '11' => 'Nov', '12' => 'Déc',
        ];

        return response()->json(
            $data->map(function ($row) use ($moisFr) {
                [$annee, $mois] = explode('-', $row->mois_cle);
                return [
                    'mois' => $moisFr[$mois] . ' ' . substr($annee, 2),
                    'revenus' => (float) ($row->somme_montant + $row->somme_frais),
                ];
            })->values()
        );
    }

    public function getRecentBookings()
    {
        return response()->json($this->recentBookings(10));
    }

    private function recentBookings($limit)
    {
        return Reservation::with(['client', 'salle', 'paiement'])
            ->orderBy('date_creation', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($b) {
                return [
                    'id' => $b->id_reservation,
                    'client' => trim(($b->client->nom ?? '') . ' ' . ($b->client->prenom ?? '')),
                    'salle' => $b->salle->nom_salle ?? 'N/A',
                    'date' => optional($b->date_debut)->format('d/m/Y'),
                    'heure' => optional($b->date_debut)->format('H:i'),
                    'montant' => optional($b->paiement)->montant ?? 0,
                    'statut' => $b->statut_effectif,
                ];
            });
    }

    public function getRecentUsers()
    {
        return response()->json($this->recentUsers(10));
    }

    private function recentUsers($limit)
    {
        return Utilisateur::orderBy('date_creation', 'desc')
            ->limit($limit)
            ->get(['id_utilisateur', 'nom', 'prenom', 'email', 'role', 'date_creation'])
            ->map(function ($u) {
                return [
                    'id' => $u->id_utilisateur,
                    'id_utilisateur' => $u->id_utilisateur,
                    'nom' => $u->nom,
                    'prenom' => $u->prenom,
                    'email' => $u->email,
                    'role' => $u->role,
                    'date' => optional($u->date_creation)->format('d/m/Y'),
                    'date_creation' => $u->date_creation,
                ];
            });
    }

    // ==========================================
    // GESTION DES UTILISATEURS
    // ==========================================

    public function getUsers(Request $request)
    {
        $query = Utilisateur::query();

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'LIKE', "%{$search}%")
                    ->orWhere('prenom', 'LIKE', "%{$search}%")
                    ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        return response()->json(
            $query->orderBy('date_creation', 'desc')->paginate(20)
        );
    }

    public function getUser($id)
    {
        $user = Utilisateur::findOrFail($id);
        return response()->json($user);
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
            // ⚠ CORRIGÉ : sans cette règle, la catégorie envoyée par le
            // frontend était silencieusement IGNORÉE (absente de $validated)
            // → un client créé par l'admin n'avait pas de catégorie
            // tarifaire, et calculatePrice() retombait sur le tarif par
            // défaut. Obligatoire pour un client, interdite pour le staff.
            'categorie_client' => 'required_if:role,client|prohibited_unless:role,client|nullable|in:org_internationale,admin_ong,association_base',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['date_creation'] = now();

        $user = Utilisateur::create($validated);

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
            // Seul l'admin peut corriger la catégorie tarifaire d'un client.
            'categorie_client' => 'sometimes|nullable|in:org_internationale,admin_ong,association_base',
        ]);

        // ⚠ AJOUT : si un nouveau mot de passe est fourni, on le hache ;
        // sinon on n'y touche pas (le frontend n'envoie password que s'il
        // est renseigné).
        if ($request->filled('password')) {
            $request->validate(['password' => 'string|min:6']);
            $validated['password'] = Hash::make($request->password);
        }

        $user->update($validated);

        return response()->json($user);
    }

    public function updateUserRole(Request $request, $id)
    {
        $user = Utilisateur::findOrFail($id);

        $validated = $request->validate([
            'role' => 'required|in:admin,receptionniste,caissier,client',
        ]);

        $user->role = $validated['role'];
        $user->save();

        return response()->json($user);
    }

    /**
     * ADMIN - Supprimer un utilisateur (blocage propre si historique lié)
     */
    public function deleteUser($id)
    {
        $user = Utilisateur::findOrFail($id);

        if ($user->id_utilisateur === Auth::user()->id_utilisateur) {
            return response()->json([
                'message' => 'Vous ne pouvez pas supprimer votre propre compte.'
            ], 400);
        }

        $hasReservationsAsClient = Reservation::where('id_client', $user->id_utilisateur)->exists();
        $hasReservationsAsReceptionniste = Reservation::where('id_receptionniste', $user->id_utilisateur)->exists();
        $hasPaiementsAsCaissier = Paiement::where('id_caissier', $user->id_utilisateur)->exists();

        if ($hasReservationsAsClient || $hasReservationsAsReceptionniste || $hasPaiementsAsCaissier) {
            return response()->json([
                'message' => 'Impossible de supprimer cet utilisateur : il a des réservations ou paiements associés. '
                    . 'Pensez à désactiver le compte plutôt qu\'à le supprimer si l\'historique doit être conservé.'
            ], 409);
        }

        try {
            $user->delete();
            return response()->json(['message' => 'Utilisateur supprimé avec succès']);
        } catch (\Exception $e) {
            Log::error('Erreur suppression utilisateur', ['id_utilisateur' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la suppression de l\'utilisateur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ==========================================
    // CONFIGURATION
    // ==========================================

    public function getSettings()
    {
        // Placeholder simple : à remplacer par une vraie table `settings`
        // si tu veux le rendre persistant.
        return response()->json([
            'app_name' => 'CEFOD IntelliRoom',
            'contact_email' => 'contact@cefod.org',
            'polling_interval_seconds' => 5,
        ]);
    }

    public function updateSettings(Request $request)
    {
        // TODO: persister réellement ces paramètres (table settings, cache, etc.)
        return response()->json([
            'message' => 'Paramètres mis à jour (persistance à implémenter)',
            'settings' => $request->all(),
        ]);
    }
}