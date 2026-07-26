<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Notification;
use App\Models\Utilisateur;
use App\Support\BusinessHours;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class BookingController extends Controller
{
    // ==========================================
    // CLIENT
    // ==========================================

    public function clientBookings()
    {
        $user = Auth::user();
        return response()->json(
            Reservation::where('id_client', $user->id_utilisateur)
                ->with(['salle.tarifs', 'paiement'])
                ->orderBy('date_creation', 'desc')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $isStaff = in_array($user->role, ['receptionniste', 'admin'], true);

        $validated = $request->validate([
            'id_salle' => 'required|exists:salle,id_salle',
            'date_debut' => 'required|date|after:now',
            'date_fin' => 'required|date|after:date_debut',
            'motif' => 'nullable|string|max:255',
            'id_client' => ($isStaff ? 'sometimes' : 'prohibited') . '|exists:utilisateur,id_utilisateur',
        ]);

        $start = \Carbon\Carbon::parse($validated['date_debut']);
        $end   = \Carbon\Carbon::parse($validated['date_fin']);

        $slotErrors = BusinessHours::validateSlot($start, $end);
        if ($slotErrors) {
            return response()->json([
                'message' => 'Le créneau demandé ne respecte pas les horaires d\'ouverture du CEFOD (' . BusinessHours::humanSchedule() . ').',
                'errors' => $slotErrors,
            ], 422);
        }

        $idClient = $isStaff && isset($validated['id_client'])
            ? $validated['id_client']
            : $user->id_utilisateur;

        $conflict = Reservation::where('id_salle', $validated['id_salle'])
            ->whereIn('statut', ['en_attente', 'validee', 'confirmee'])
            ->where(function ($query) use ($validated) {
                $query->whereBetween('date_debut', [$validated['date_debut'], $validated['date_fin']])
                    ->orWhereBetween('date_fin', [$validated['date_debut'], $validated['date_fin']])
                    ->orWhere(function ($q) use ($validated) {
                        $q->where('date_debut', '<=', $validated['date_debut'])
                            ->where('date_fin', '>=', $validated['date_fin']);
                    });
            })
            ->exists();

        if ($conflict) {
            return response()->json([
                'message' => 'Cette salle est déjà réservée sur ce créneau.'
            ], 409);
        }

        $reservation = Reservation::create([
            'id_salle' => $validated['id_salle'],
            'id_client' => $idClient,
            'id_receptionniste' => $isStaff ? $user->id_utilisateur : null,
            'date_debut' => $validated['date_debut'],
            'date_fin' => $validated['date_fin'],
            'motif' => $validated['motif'] ?? null,
            'statut' => 'en_attente',
            'date_creation' => now(),
        ]);
        $reservation->load('salle');

        $receptionnistes = Utilisateur::where('role', 'receptionniste')->pluck('id_utilisateur');
        if ($receptionnistes->isNotEmpty()) {
            $now = now();
            Notification::insert($receptionnistes->map(fn ($idr) => [
                'id_utilisateur' => $idr,
                'titre' => 'Nouvelle demande de réservation',
                'contenu' => 'Une demande vient d\'arriver pour la salle « '
                    . ($reservation->salle->nom_salle ?? '#' . $reservation->id_salle)
                    . ' » du ' . $reservation->date_debut->format('d/m/Y H\hi') . '. À valider.',
                'type' => 'reservation',
                'est_lu' => false,
                'date_creation' => $now,
            ])->all());
        }

        return response()->json($reservation->load('salle'), 201);
    }

    // ==========================================
    // COMMUN
    // ==========================================

    public function show($id)
    {
        $reservation = Reservation::with(['salle', 'salle.tarifs', 'client', 'receptionniste', 'paiement'])
            ->find($id);

        if (!$reservation) {
            return response()->json([
                'message' => "Aucune réservation trouvée avec l'identifiant {$id}."
            ], 404);
        }

        $user = Auth::user();
        if ($user->role === 'client' && $reservation->id_client !== $user->id_utilisateur) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        // AJOUT : note_interne visible uniquement pour réception/admin.
        if (in_array($user->role, ['receptionniste', 'admin'], true)) {
            $reservation->makeVisible('note_interne');
        }

        return response()->json($reservation);
    }

    /**
     * AJOUT v8 : validation des créneaux via BusinessHours sur update aussi.
     * AJOUT : prise en charge de note_interne (staff uniquement).
     */
    public function update(Request $request, $id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json([
                'message' => "Aucune réservation trouvée avec l'identifiant {$id}."
            ], 404);
        }

        $user = Auth::user();
        if ($user->role === 'client') {
            if ($reservation->id_client !== $user->id_utilisateur) {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }
            if ($reservation->statut !== 'en_attente') {
                return response()->json([
                    'message' => 'Cette réservation a déjà été traitée et ne peut plus être modifiée.'
                ], 400);
            }
        }

        $validated = $request->validate([
            'id_salle' => 'sometimes|exists:salle,id_salle',
            'date_debut' => 'sometimes|date',
            'date_fin' => 'sometimes|date|after:date_debut',
            'motif' => 'nullable|string|max:255',
            'statut' => ($user->role === 'client' ? 'prohibited' : 'sometimes') . '|in:en_attente,validee,confirmee,annulee',
            // AJOUT : note interne réservée à la réception/admin.
            'note_interne' => ($user->role === 'client' ? 'prohibited' : 'sometimes') . '|nullable|string|max:1000',
        ]);

        $newStart = isset($validated['date_debut'])
            ? \Carbon\Carbon::parse($validated['date_debut'])
            : $reservation->date_debut;
        $newEnd = isset($validated['date_fin'])
            ? \Carbon\Carbon::parse($validated['date_fin'])
            : $reservation->date_fin;

        if (isset($validated['date_debut']) || isset($validated['date_fin'])) {
            $slotErrors = BusinessHours::validateSlot($newStart, $newEnd);
            if ($slotErrors) {
                return response()->json([
                    'message' => 'Le créneau modifié ne respecte pas les horaires d\'ouverture du CEFOD (' . BusinessHours::humanSchedule() . ').',
                    'errors' => $slotErrors,
                ], 422);
            }
        }

        $reservation->update($validated);
        $reservation->load('salle');

        // AJOUT : renvoyer note_interne dans la réponse pour le staff
        // (sinon le frontend ne peut pas afficher la note qu'il vient de saisir).
        if (in_array($user->role, ['receptionniste', 'admin'], true)) {
            $reservation->makeVisible('note_interne');
        }

        return response()->json($reservation);
    }

    public function cancel($id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json([
                'message' => "Aucune réservation trouvée avec l'identifiant {$id}."
            ], 404);
        }

        $user = Auth::user();
        if ($user->role === 'client' && $reservation->id_client !== $user->id_utilisateur) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        if ($reservation->statut === 'confirmee') {
            return response()->json([
                'message' => 'Cette réservation est déjà confirmée et payée. Contactez l\'administrateur pour l\'annuler.'
            ], 400);
        }

        $reservation->statut = 'annulee';
        $reservation->save();

        return response()->json(['message' => 'Réservation annulée avec succès']);
    }

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
        $notification = Notification::where('id_utilisateur', Auth::id())->find($id);

        if (!$notification) {
            return response()->json(['message' => 'Notification introuvable'], 404);
        }

        $notification->est_lu = true;
        $notification->save();

        return response()->json($notification);
    }

    // ==========================================
    // RÉCEPTIONNISTE
    // ==========================================

    public function receptionistBookings(Request $request)
    {
        $query = Reservation::with(['client', 'salle'])
            ->orderBy('date_creation', 'desc');

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        $result = $query->paginate(20);
        // AJOUT : note_interne visible pour la réception.
        $result->getCollection()->makeVisible('note_interne');

        return response()->json($result);
    }

    public function validateBooking($id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json(['message' => "Réservation {$id} introuvable"], 404);
        }

        if ($reservation->statut !== 'en_attente') {
            return response()->json([
                'message' => "Cette réservation ne peut pas être validée (statut actuel : {$reservation->statut})"
            ], 400);
        }

        $reservation->statut = 'validee';
        $reservation->id_receptionniste = Auth::id();
        $reservation->save();

        Notification::create([
            'id_utilisateur' => $reservation->id_client,
            'titre' => 'Réservation validée',
            'contenu' => 'Votre réservation a été validée par la réception. Vous pouvez procéder au paiement.',
            'type' => 'validation',
            'est_lu' => false,
            'date_creation' => now(),
        ]);

        return response()->json($reservation->load('salle'));
    }

    public function confirm($id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json(['message' => "Réservation {$id} introuvable"], 404);
        }

        $reservation->statut = 'confirmee';
        $reservation->save();

        return response()->json($reservation);
    }

    // ==========================================
    // CAISSIER
    // ==========================================

    public function cashierBookings(Request $request)
    {
        $query = Reservation::with(['client', 'salle', 'paiement'])
            ->orderBy('date_creation', 'desc');

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        return response()->json($query->paginate(20));
    }

    // ==========================================
    // ADMIN
    // ==========================================

    public function adminIndex(Request $request)
    {
        $query = Reservation::with(['client', 'salle', 'receptionniste', 'paiement'])
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

        $result = $query->paginate(20);
        // AJOUT : note_interne visible pour l'admin (AdminDashboard, Option A).
        $result->getCollection()->makeVisible('note_interne');

        return response()->json($result);
    }

    public function adminCancel($id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json(['message' => "Réservation {$id} introuvable"], 404);
        }

        $reservation->statut = 'annulee';
        $reservation->save();

        Notification::create([
            'id_utilisateur' => $reservation->id_client,
            'titre' => 'Réservation annulée',
            'contenu' => 'Votre réservation a été annulée par l\'administration.',
            'type' => 'annulation',
            'est_lu' => false,
            'date_creation' => now(),
        ]);

        return response()->json(['message' => 'Réservation annulée par l\'administrateur']);
    }
}