<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\ReservationService;
use App\Models\Service;
use App\Models\TarifService;
use App\Models\Notification;
use App\Models\Utilisateur;
use App\Support\BusinessHours;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
                ->with(['salle.tarifs', 'paiement', 'services.service'])
                ->orderBy('date_creation', 'desc')
                ->get()
        );
    }

    /**
     * Création d'une demande de réservation.
     * SG et admin peuvent créer pour le compte d'un client ; la réceptionniste
     * ne crée plus de réservation (rôle d'orientation uniquement).
     * Les services annexes éventuels sont enregistrés avec leur prix figé.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $isStaff = in_array($user->role, ['sg', 'admin'], true);

        $validated = $request->validate([
            'id_salle' => 'required|exists:salle,id_salle',
            'date_debut' => 'required|date|after:now',
            'date_fin' => 'required|date|after:date_debut',
            'motif' => 'nullable|string|max:255',
            'id_client' => ($isStaff ? 'sometimes' : 'prohibited') . '|exists:utilisateur,id_utilisateur',
            // Champs fiche papier
            'type_activite' => 'nullable|in:reunion,congres,atelier,formation,seminaire_colloque_symposium,ceremonie_cloture_formation,conference_presse_debat_ag,film,recrutement,autre',
            'type_activite_autre' => 'nullable|string|max:150',
            'sujet_principal' => 'nullable|in:droit_homme,aspect_genre,secours_humanitaire_securite_alimentaire,refugies_pdi,agriculture_elevage_pisciculture,environnement_climat,ressources_sol_sous_sol,droit_foncier_lotissement,entrepreneuriat,pauvrete_cherte_vie,services_base,politique_developpement,education_formation_logiciel,sante,decentralisation_recensement,gouvernance_corruption,securite_interieure,situation_internationale_militaire,internet_telephone,sport_culture_loisirs,autre',
            'sujet_principal_autre' => 'nullable|string|max:150',
            'public_cible' => 'nullable|in:interne,invitation,public',
            'medias_invites' => 'nullable|in:aucun,presse_ecrite,radio_television,tous',
            'retransmission_radio' => 'nullable|boolean',
            'duree_retransmission_heures' => 'nullable|numeric|min:0.5|required_if:retransmission_radio,true',
            'nombre_participants' => 'nullable|integer|min:0',
            'nombre_femmes' => 'nullable|in:tres_peu,minorite,moitie_moitie,majorite,presque_tous',
            'titre_groupe_utilisateur' => 'nullable|string|max:150',
            'adresse_groupe_utilisateur' => 'nullable|string|max:255',
            'nom_responsable_reunion' => 'nullable|string|max:150',
            'adresse_responsable_reunion' => 'nullable|string|max:255',
            // Services annexes (optionnels)
            'services' => 'nullable|array',
            'services.*.id_service' => 'required_with:services|exists:service,id_service',
            'services.*.quantite' => 'nullable|numeric|min:1',
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

        // Le vrai conflit ne se joue qu'entre engagements réels (validee/
        // confirmee) — plusieurs demandes en_attente concurrentes sur le même
        // créneau sont normales et volontairement autorisées : ce ne sont que
        // des expressions d'intérêt, rien n'est engagé tant que le SG n'a rien
        // validé. Voir validateBooking() pour le vrai contrôle de conflit.
        $conflict = Reservation::where('id_salle', $validated['id_salle'])
            ->whereIn('statut', ['validee', 'confirmee'])
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

        // Catégorie tarifaire du client (pour figer le prix des services)
        $client = Utilisateur::find($idClient);
        $categorieClient = $client->categorie_client ?? 'association_base';

        // Service "Retransmission radio" : jamais choisi dans la liste des
        // services (option C actée en conception) — créé automatiquement
        // ci-dessous si le client a répondu "oui" à la question de la fiche.
        $radioService = Service::where('nom', 'Retransmission radio')->first();

        DB::beginTransaction();

        try {
            $reservation = Reservation::create([
                'id_salle' => $validated['id_salle'],
                'id_client' => $idClient,
                'id_sg' => null,
                'date_debut' => $validated['date_debut'],
                'date_fin' => $validated['date_fin'],
                'motif' => $validated['motif'] ?? null,
                'statut' => 'en_attente',
                'type_activite' => $validated['type_activite'] ?? null,
                'type_activite_autre' => $validated['type_activite_autre'] ?? null,
                'sujet_principal' => $validated['sujet_principal'] ?? null,
                'sujet_principal_autre' => $validated['sujet_principal_autre'] ?? null,
                'public_cible' => $validated['public_cible'] ?? null,
                'medias_invites' => $validated['medias_invites'] ?? null,
                'retransmission_radio' => $validated['retransmission_radio'] ?? false,
                'duree_retransmission_heures' => $validated['duree_retransmission_heures'] ?? null,
                'nombre_participants' => $validated['nombre_participants'] ?? null,
                'nombre_femmes' => $validated['nombre_femmes'] ?? null,
                'titre_groupe_utilisateur' => $validated['titre_groupe_utilisateur'] ?? null,
                'adresse_groupe_utilisateur' => $validated['adresse_groupe_utilisateur'] ?? null,
                'nom_responsable_reunion' => $validated['nom_responsable_reunion'] ?? null,
                'adresse_responsable_reunion' => $validated['adresse_responsable_reunion'] ?? null,
                'date_creation' => now(),
            ]);

            // Enregistrement des services annexes avec prix figé. Le service
            // radio est explicitement ignoré s'il est envoyé ici par erreur —
            // il ne doit exister qu'une fois, créé automatiquement plus bas.
            foreach ($validated['services'] ?? [] as $svc) {
                if ($radioService && (int) $svc['id_service'] === (int) $radioService->id_service) {
                    continue;
                }

                $prixUnitaire = $this->resolveServicePrice($svc['id_service'], $categorieClient);
                $quantite = $svc['quantite'] ?? 1;

                ReservationService::create([
                    'id_reservation' => $reservation->id_reservation,
                    'id_service' => $svc['id_service'],
                    'quantite' => $quantite,
                    'prix_unitaire_applique' => $prixUnitaire,
                    'montant' => $prixUnitaire * $quantite,
                ]);
            }

            // Retransmission radio : une seule saisie (la question de la
            // fiche), traduite ici automatiquement en ligne facturable.
            if ($radioService && ($validated['retransmission_radio'] ?? false) && !empty($validated['duree_retransmission_heures'])) {
                $prixUnitaire = $this->resolveServicePrice($radioService->id_service, $categorieClient);
                $quantite = $validated['duree_retransmission_heures'];

                ReservationService::create([
                    'id_reservation' => $reservation->id_reservation,
                    'id_service' => $radioService->id_service,
                    'quantite' => $quantite,
                    'prix_unitaire_applique' => $prixUnitaire,
                    'montant' => $prixUnitaire * $quantite,
                ]);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur création réservation', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la création de la réservation',
                'error' => $e->getMessage(),
            ], 500);
        }

        $reservation->load(['salle', 'services.service']);

        $sgUsers = Utilisateur::where('role', 'sg')->pluck('id_utilisateur');
        if ($sgUsers->isNotEmpty()) {
            $now = now();
            Notification::insert($sgUsers->map(fn ($id) => [
                'id_utilisateur' => $id,
                'titre' => 'Nouvelle demande de réservation',
                'contenu' => 'Une demande vient d\'arriver pour la salle « '
                    . ($reservation->salle->nom_salle ?? '#' . $reservation->id_salle)
                    . ' » du ' . $reservation->date_debut->format('d/m/Y H\hi') . '. À valider.',
                'type' => 'reservation',
                'est_lu' => false,
                'date_creation' => $now,
            ])->all());
        }

        return response()->json($reservation, 201);
    }

    /**
     * Résout le prix d'un service pour une catégorie client donnée :
     * tarif spécifique à la catégorie si présent, sinon tarif par défaut
     * (categorie_client NULL), sinon 0.
     */
    private function resolveServicePrice($idService, $categorieClient): float
    {
        $tarif = TarifService::where('id_service', $idService)
            ->where('categorie_client', $categorieClient)
            ->first();

        if (!$tarif) {
            $tarif = TarifService::where('id_service', $idService)
                ->whereNull('categorie_client')
                ->first();
        }

        return $tarif ? (float) $tarif->prix : 0.0;
    }

    // ==========================================
    // COMMUN
    // ==========================================

    public function show($id)
    {
        $reservation = Reservation::with(['salle', 'salle.tarifs', 'client', 'sg', 'paiement', 'services.service'])
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

        if (in_array($user->role, ['receptionniste', 'sg', 'admin'], true)) {
            $reservation->makeVisible('note_interne');
        }

        return response()->json($reservation);
    }

    /**
     * Modification : le client peut modifier SA réservation tant qu'elle est
     * en_attente ; seuls SG et admin peuvent changer statut/note_interne/
     * créneau/salle. La réceptionniste est en lecture seule.
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
        $canManage = in_array($user->role, ['sg', 'admin'], true);

        if ($user->role === 'client') {
            if ($reservation->id_client !== $user->id_utilisateur) {
                return response()->json(['message' => 'Accès non autorisé'], 403);
            }
            if ($reservation->statut !== 'en_attente') {
                return response()->json([
                    'message' => 'Cette réservation a déjà été traitée et ne peut plus être modifiée.'
                ], 400);
            }
        } elseif (!$canManage) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        $validated = $request->validate([
            'id_salle' => 'sometimes|exists:salle,id_salle',
            'date_debut' => 'sometimes|date',
            'date_fin' => 'sometimes|date|after:date_debut',
            'motif' => 'nullable|string|max:255',
            'statut' => ($canManage ? 'sometimes' : 'prohibited') . '|in:en_attente,validee,confirmee,terminee,annulee',
            'note_interne' => ($canManage ? 'sometimes' : 'prohibited') . '|nullable|string|max:1000',
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

        if (in_array($user->role, ['receptionniste', 'sg', 'admin'], true)) {
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

        if ($user->role !== 'client' && !in_array($user->role, ['sg', 'admin'], true)) {
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
    // RÉCEPTIONNISTE (lecture seule)
    // ==========================================

    public function receptionistBookings(Request $request)
    {
        $query = Reservation::with(['client', 'salle'])
            ->orderBy('date_creation', 'desc');

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        $result = $query->paginate(20);
        $result->getCollection()->makeVisible('note_interne');

        return response()->json($result);
    }

    // ==========================================
    // SG
    // ==========================================

    public function sgBookings(Request $request)
    {
        $query = Reservation::with(['client', 'salle', 'services.service'])
            ->orderBy('date_creation', 'desc');

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        $result = $query->paginate(20);
        $result->getCollection()->makeVisible('note_interne');

        // Compteur indicatif : combien d'AUTRES demandes en_attente visent le
        // même créneau (même salle, chevauchement de dates). Purement informatif
        // pour aider le SG à prioriser — n'affecte aucun comportement.
        $result->getCollection()->transform(function ($r) {
            if ($r->statut !== 'en_attente') {
                $r->demandes_concurrentes = 0;
                return $r;
            }

            $r->demandes_concurrentes = Reservation::where('id_salle', $r->id_salle)
                ->where('id_reservation', '!=', $r->id_reservation)
                ->where('statut', 'en_attente')
                ->where(function ($q) use ($r) {
                    $q->whereBetween('date_debut', [$r->date_debut, $r->date_fin])
                        ->orWhereBetween('date_fin', [$r->date_debut, $r->date_fin])
                        ->orWhere(function ($qq) use ($r) {
                            $qq->where('date_debut', '<=', $r->date_debut)
                                ->where('date_fin', '>=', $r->date_fin);
                        });
                })
                ->count();

            return $r;
        });

        return response()->json($result);
    }

    /**
     * SG - Valide une demande. Refuse un créneau déjà entièrement passé.
     */
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

        if ($reservation->date_fin->isPast()) {
            return response()->json([
                'message' => 'Impossible de valider cette réservation : le créneau demandé est déjà passé. Refusez la demande et invitez le client à en soumettre une nouvelle.'
            ], 422);
        }

        // Le vrai contrôle de conflit : uniquement contre des engagements déjà
        // réels (validee/confirmee). Deux demandes en_attente concurrentes
        // pouvaient coexister jusqu'ici (voir store()) — c'est au moment de
        // valider qu'il faut trancher.
        $dejaPrise = Reservation::where('id_salle', $reservation->id_salle)
            ->where('id_reservation', '!=', $reservation->id_reservation)
            ->whereIn('statut', ['validee', 'confirmee'])
            ->where(function ($q) use ($reservation) {
                $q->whereBetween('date_debut', [$reservation->date_debut, $reservation->date_fin])
                    ->orWhereBetween('date_fin', [$reservation->date_debut, $reservation->date_fin])
                    ->orWhere(function ($qq) use ($reservation) {
                        $qq->where('date_debut', '<=', $reservation->date_debut)
                            ->where('date_fin', '>=', $reservation->date_fin);
                    });
            })
            ->exists();

        if ($dejaPrise) {
            return response()->json([
                'message' => 'Impossible de valider : ce créneau a déjà été attribué à une autre réservation validée entre-temps.'
            ], 409);
        }

        DB::beginTransaction();

        try {
            $reservation->statut = 'validee';
            $reservation->id_sg = Auth::id();
            $reservation->save();

            Notification::create([
                'id_utilisateur' => $reservation->id_client,
                'titre' => 'Réservation validée',
                'contenu' => 'Votre réservation a été validée par le secrétariat général. Vous pouvez procéder au paiement.',
                'type' => 'validation',
                'est_lu' => false,
                'date_creation' => now(),
            ]);

            // Les autres demandes en_attente concurrentes sur ce créneau
            // deviennent caduques : la salle est prise. On les bascule
            // automatiquement en annulee plutôt que de laisser le SG les
            // traiter une par une — avec un message qui ne sonne jamais
            // comme un refus (jamais "rejetée"), juste "non disponible" +
            // invitation immédiate à resoumettre ailleurs.
            $concurrentes = Reservation::where('id_salle', $reservation->id_salle)
                ->where('id_reservation', '!=', $reservation->id_reservation)
                ->where('statut', 'en_attente')
                ->where(function ($q) use ($reservation) {
                    $q->whereBetween('date_debut', [$reservation->date_debut, $reservation->date_fin])
                        ->orWhereBetween('date_fin', [$reservation->date_debut, $reservation->date_fin])
                        ->orWhere(function ($qq) use ($reservation) {
                            $qq->where('date_debut', '<=', $reservation->date_debut)
                                ->where('date_fin', '>=', $reservation->date_fin);
                        });
                })
                ->get();

            foreach ($concurrentes as $autre) {
                $autre->statut = 'annulee';
                $autre->save();

                Notification::create([
                    'id_utilisateur' => $autre->id_client,
                    'titre' => 'Salle occupée sur ce créneau',
                    'contenu' => 'Nous sommes désolés, mais la salle « '
                        . ($reservation->salle->nom_salle ?? '#' . $reservation->id_salle)
                        . ' » est occupée durant le créneau du '
                        . $reservation->date_debut->format('d/m/Y')
                        . ' de ' . $reservation->date_debut->format('H:i')
                        . ' à ' . $reservation->date_fin->format('H:i') . '. '
                        . 'N\'hésitez pas à soumettre une nouvelle demande sur une autre salle ou un autre horaire, '
                        . 'nous serons ravis de vous accueillir.',
                    'type' => 'info',
                    'est_lu' => false,
                    'date_creation' => now(),
                ]);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur validation réservation', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la validation',
                'error' => $e->getMessage(),
            ], 500);
        }

        return response()->json($reservation->load('salle'));
    }

    /**
     * Confirmation manuelle (ADMIN, cas exceptionnel). Le chemin normal passe
     * par la validation du paiement (PaymentController::validatePayment()).
     */
    public function confirm($id)
    {
        $reservation = Reservation::find($id);

        if (!$reservation) {
            return response()->json(['message' => "Réservation {$id} introuvable"], 404);
        }

        if ($reservation->statut !== 'validee') {
            return response()->json([
                'message' => "Cette réservation ne peut pas être confirmée (statut actuel : {$reservation->statut})"
            ], 400);
        }

        if ($reservation->date_fin->isPast()) {
            return response()->json([
                'message' => 'Impossible de confirmer cette réservation : le créneau demandé est déjà passé.'
            ], 422);
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
        $query = Reservation::with(['client', 'salle', 'sg', 'paiement', 'services.service'])
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