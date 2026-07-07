<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Notification;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookingController extends Controller
{
    // CLIENT
    public function clientBookings()
    {
        $user = Auth::user();
        return response()->json(
            Reservation::where('id_client', $user->id_utilisateur)
                ->with(['salle', 'paiement'])
                ->orderBy('date_creation', 'desc')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'id_salle' => 'required|exists:salle,id_salle',
            'date_debut' => 'required|date|after:now',
            'date_fin' => 'required|date|after:date_debut',
            'motif' => 'nullable|string|max:255',
        ]);

        // Vérifier les conflits
        $conflict = Reservation::where('id_salle', $validated['id_salle'])
            ->where(function ($query) use ($validated) {
                $query->whereBetween('date_debut', [$validated['date_debut'], $validated['date_fin']])
                    ->orWhereBetween('date_fin', [$validated['date_debut'], $validated['date_fin']])
                    ->orWhere(function ($q) use ($validated) {
                        $q->where('date_debut', '<=', $validated['date_debut'])
                            ->where('date_fin', '>=', $validated['date_fin']);
                    });
            })
            ->whereNotIn('statut', ['annulee', 'terminee'])
            ->exists();

        if ($conflict) {
            return response()->json(['message' => 'Cette salle est déjà réservée sur cette plage horaire'], 409);
        }

        $reservation = Reservation::create([
            'id_salle' => $validated['id_salle'],
            'id_client' => $user->id_utilisateur,
            'date_debut' => $validated['date_debut'],
            'date_fin' => $validated['date_fin'],
            'motif' => $validated['motif'] ?? null,
            'statut' => 'en_attente',
            'date_creation' => now(),
        ]);

        $this->notifyReceptionists($reservation);

        return response()->json($reservation, 201);
    }

    public function show($id)
    {
        return response()->json(
            Reservation::with(['salle', 'client', 'paiement'])->findOrFail($id)
        );
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $reservation = Reservation::where('id_reservation', $id)
            ->where('id_client', $user->id_utilisateur)
            ->firstOrFail();

        if ($reservation->statut !== 'en_attente') {
            return response()->json(['message' => 'Cette réservation ne peut pas être modifiée'], 400);
        }

        $validated = $request->validate([
            'date_debut' => 'sometimes|date|after:now',
            'date_fin' => 'sometimes|date|after:date_debut',
            'motif' => 'nullable|string|max:255',
        ]);

        $reservation->update($validated);
        return response()->json($reservation);
    }

    public function cancel($id)
    {
        $user = Auth::user();
        $reservation = Reservation::where('id_reservation', $id)
            ->where('id_client', $user->id_utilisateur)
            ->firstOrFail();

        if ($reservation->statut === 'terminee') {
            return response()->json(['message' => 'Impossible d\'annuler une réservation terminée'], 400);
        }

        $reservation->statut = 'annulee';
        $reservation->save();

        $this->notifyClient($reservation, 'Réservation annulée');

        return response()->json(['message' => 'Réservation annulée']);
    }

    // RECEPTIONIST
    public function receptionistBookings(Request $request)
    {
        $query = Reservation::with(['client', 'salle', 'paiement'])
            ->orderBy('date_creation', 'desc');

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('client', function ($q) use ($search) {
                $q->where('nom', 'LIKE', "%{$search}%")
                    ->orWhere('prenom', 'LIKE', "%{$search}%");
            });
        }

        return response()->json($query->paginate(20));
    }

    public function validateBooking($id)
    {
        $reservation = Reservation::findOrFail($id);

        if ($reservation->statut !== 'en_attente') {
            return response()->json(['message' => 'Cette réservation ne peut pas être validée'], 400);
        }

        $reservation->statut = 'validee';
        $reservation->id_receptionniste = Auth::id();
        $reservation->save();

        $this->notifyClient($reservation, 'Réservation validée');

        return response()->json(['message' => 'Réservation validée']);
    }

    // ADMIN
    public function adminIndex(Request $request)
    {
        $query = Reservation::with(['client', 'salle', 'paiement'])
            ->orderBy('date_creation', 'desc');

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('client', function ($q) use ($search) {
                $q->where('nom', 'LIKE', "%{$search}%")
                    ->orWhere('prenom', 'LIKE', "%{$search}%");
            });
        }

        return response()->json($query->paginate(20));
    }

    public function adminCancel($id)
    {
        $reservation = Reservation::findOrFail($id);
        $reservation->statut = 'annulee';
        $reservation->save();

        $this->notifyClient($reservation, 'Réservation annulée par l\'administrateur');

        return response()->json(['message' => 'Réservation annulée']);
    }

    // NOTIFICATIONS
    public function getNotifications()
    {
        $user = Auth::user();
        return response()->json(
            Notification::where('id_utilisateur', $user->id_utilisateur)
                ->orderBy('date_creation', 'desc')
                ->get()
        );
    }

    public function markNotificationAsRead($id)
    {
        $notification = Notification::where('id_notification', $id)
            ->where('id_utilisateur', Auth::id())
            ->firstOrFail();

        $notification->est_lu = true;
        $notification->save();

        return response()->json(['message' => 'Notification marquée comme lue']);
    }

    // PRIVATE
    private function notifyReceptionists($reservation)
    {
        $receptionists = Utilisateur::where('role', 'receptionniste')->get();
        foreach ($receptionists as $receptionist) {
            Notification::create([
                'id_utilisateur' => $receptionist->id_utilisateur,
                'titre' => 'Nouvelle réservation en attente',
                'contenu' => 'Réservation #' . $reservation->id_reservation . ' par ' . ($reservation->client->prenom ?? '') . ' ' . ($reservation->client->nom ?? ''),
                'type' => 'nouvelle_reservation',
                'est_lu' => false,
                'date_creation' => now(),
            ]);
        }
    }

    private function notifyClient($reservation, $message)
    {
        Notification::create([
            'id_utilisateur' => $reservation->id_client,
            'titre' => $message,
            'contenu' => 'Votre réservation du ' . $reservation->date_debut->format('d/m/Y à H:i') . ' a été ' . strtolower($message),
            'type' => 'confirmation',
            'est_lu' => false,
            'date_creation' => now(),
        ]);
    }
}