<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Utilisateur;
use Illuminate\Http\Request;

/**
 * Contrôleur des notifications côté administration.
 *
 * Routes couvertes (api.php, groupe role:admin) :
 *   GET  /api/admin/notifications            -> adminIndex
 *   POST /api/admin/notifications/broadcast  -> broadcast
 *
 * Aligné sur le modèle App\Models\Notification :
 * table `notification`, clé `id_notification`, colonnes
 * id_utilisateur / titre / contenu / type / est_lu / date_creation,
 * $timestamps = false, cast est_lu => boolean.
 */
class NotificationController extends Controller
{
    /**
     * GET /api/admin/notifications
     * Supervision : toutes les notifications, les plus récentes d'abord,
     * avec l'utilisateur destinataire. Paginé (25 par défaut, ?per_page=N).
     */
    public function adminIndex(Request $request)
    {
        $notifications = Notification::with('utilisateur:id_utilisateur,nom,prenom,email,role')
            ->orderByDesc('date_creation')
            ->paginate($request->integer('per_page', 25));

        return response()->json($notifications);
    }

    /**
     * POST /api/admin/notifications/broadcast
     * Diffuse une annonce à tous les utilisateurs, ou à un rôle précis.
     *
     * Corps attendu :
     *   titre   : string (obligatoire, max 255)
     *   contenu : string (obligatoire, max 2000)
     *   type    : string (optionnel — ex. info, alerte ; "info" par défaut)
     *   role    : client|receptionniste|sg|caissier|comptabilite|admin (optionnel — tous si absent)
     */
    public function broadcast(Request $request)
    {
        $validated = $request->validate([
            'titre'   => ['required', 'string', 'max:255'],
            'contenu' => ['required', 'string', 'max:2000'],
            'type'    => ['nullable', 'string', 'max:50'],
            'role'    => ['nullable', 'in:client,receptionniste,sg,caissier,comptabilite,admin'],
        ]);

        $destinataires = Utilisateur::query()
            ->when($validated['role'] ?? null, fn ($q, $role) => $q->where('role', $role))
            ->pluck('id_utilisateur');

        if ($destinataires->isEmpty()) {
            return response()->json([
                'message' => 'Aucun destinataire ne correspond à ce critère.',
            ], 422);
        }

        $now = now();
        $rows = $destinataires->map(fn ($id) => [
            'id_utilisateur' => $id,
            'titre'          => $validated['titre'],
            'contenu'        => $validated['contenu'],
            'type'           => $validated['type'] ?? 'info',
            'est_lu'         => false,
            'date_creation'  => $now,
        ])->all();

        Notification::insert($rows);

        return response()->json([
            'message'       => 'Notification diffusée.',
            'destinataires' => $destinataires->count(),
        ], 201);
    }
}