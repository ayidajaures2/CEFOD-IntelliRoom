<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\TarifService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * ADMIN - Gestion du catalogue des services annexes (vidéoprojecteur,
 * sonorisation, restauration, retransmission radio...) et de leurs tarifs.
 *
 * Miroir de RoomController pour les salles : mêmes conventions
 * (adminIndex/store/update/destroy + getPrices/updatePrices dédiés).
 */
class ServiceController extends Controller
{
    /**
     * PUBLIC - Catalogue des services annexes avec leurs tarifs (miroir de
     * RoomController::index() pour les salles). La retransmission radio y
     * apparaît normalement : ce n'est qu'à la création d'une réservation
     * qu'elle est exclue de la sélection manuelle (voir BookingController::store()).
     */
    public function index()
    {
        return response()->json(Service::with('tarifs')->orderBy('nom')->get());
    }

    /**
     * ADMIN - Liste complète des services avec leurs tarifs.
     */
    public function adminIndex(Request $request)
    {
        $query = Service::with('tarifs')->orderBy('nom');

        if ($request->has('search')) {
            $query->where('nom', 'LIKE', '%' . $request->search . '%');
        }

        return response()->json($query->get());
    }

    /**
     * ADMIN - Voir un service et ses tarifs.
     */
    public function show($id)
    {
        $service = Service::with('tarifs')->findOrFail($id);
        return response()->json($service);
    }

    /**
     * ADMIN - Créer un service (+ tarifs optionnels).
     *
     * tarifs.*.categorie_client peut être null (tarif unique pour toutes les
     * catégories, comme la sonorisation ou la retransmission radio) — dans
     * ce cas, omettre la clé ou l'envoyer explicitement à null.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100|unique:service,nom',
            'description' => 'nullable|string',
            'unite' => 'required|in:jour,heure,personne',
            'tarifs' => 'nullable|array',
            'tarifs.*.categorie_client' => 'nullable|in:org_internationale,admin_ong,association_base',
            'tarifs.*.prix' => 'required_with:tarifs|numeric|min:0',
        ]);

        DB::beginTransaction();

        try {
            $service = Service::create([
                'nom' => $validated['nom'],
                'description' => $validated['description'] ?? null,
                'unite' => $validated['unite'],
            ]);

            foreach ($validated['tarifs'] ?? [] as $tarif) {
                TarifService::create([
                    'id_service' => $service->id_service,
                    'categorie_client' => $tarif['categorie_client'] ?? null,
                    'prix' => $tarif['prix'],
                ]);
            }

            DB::commit();

            return response()->json($service->load('tarifs'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur création service', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la création du service',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ADMIN - Modifier les informations générales d'un service (pas les
     * tarifs, voir updatePrices()).
     */
    public function update(Request $request, $id)
    {
        $service = Service::findOrFail($id);

        $validated = $request->validate([
            'nom' => 'sometimes|string|max:100|unique:service,nom,' . $id . ',id_service',
            'description' => 'nullable|string',
            'unite' => 'sometimes|in:jour,heure,personne',
        ]);

        $service->update($validated);

        return response()->json($service->load('tarifs'));
    }

    /**
     * ADMIN - Supprimer un service (blocage propre si déjà utilisé dans une
     * réservation, pour ne jamais casser une ligne de facture existante).
     */
    public function destroy($id)
    {
        $service = Service::findOrFail($id);

        $hasReservations = $service->reservationServices()->exists();
        if ($hasReservations) {
            return response()->json([
                'message' => 'Impossible de supprimer ce service : il est déjà utilisé dans au moins une réservation. '
                    . 'L\'historique de facturation doit rester intact.'
            ], 409);
        }

        DB::beginTransaction();

        try {
            $service->tarifs()->delete();
            $service->delete();

            DB::commit();

            return response()->json(['message' => 'Service supprimé avec succès']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur suppression service', ['id_service' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la suppression du service',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ADMIN - Voir les tarifs d'un service.
     */
    public function getPrices($id)
    {
        $service = Service::with('tarifs')->findOrFail($id);
        return response()->json($service->tarifs);
    }

    /**
     * ADMIN - Mettre à jour les tarifs (upsert par catégorie, y compris la
     * catégorie "null" = tarif unique).
     * Attend : { "tarifs": [ { "categorie_client": "..."|null, "prix": ... } ] }
     */
    public function updatePrices(Request $request, $id)
    {
        $service = Service::findOrFail($id);

        $validated = $request->validate([
            'tarifs' => 'required|array|min:1',
            'tarifs.*.categorie_client' => 'nullable|in:org_internationale,admin_ong,association_base',
            'tarifs.*.prix' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();

        try {
            foreach ($validated['tarifs'] as $tarif) {
                TarifService::updateOrCreate(
                    [
                        'id_service' => $service->id_service,
                        'categorie_client' => $tarif['categorie_client'] ?? null,
                    ],
                    [
                        'prix' => $tarif['prix'],
                    ]
                );
            }

            DB::commit();

            return response()->json($service->load('tarifs'));
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur mise à jour tarifs service', ['id_service' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la mise à jour des tarifs',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}