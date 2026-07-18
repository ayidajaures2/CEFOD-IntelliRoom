<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Salle;
use App\Models\TarifSalle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RoomController extends Controller
{
    /**
     * PUBLIC - Catalogue des salles (avec tarifs)
     */
    public function index(Request $request)
    {
        $query = Salle::with('tarifs');

        if ($request->has('limit')) {
            $query->limit((int) $request->limit);
        }

        return response()->json($query->get());
    }

    /**
     * PUBLIC - Détail d'une salle
     */
    public function show($id)
    {
        $salle = Salle::with('tarifs')->findOrFail($id);
        return response()->json($salle);
    }

    /**
     * PUBLIC - Statut temps réel des salles (affichage / polling 5 s)
     *
     * ⚠ CORRIGÉ/ENRICHI : l'écran d'affichage (RealTimeDisplay.jsx) montre
     * le type, la capacité et la prochaine occupation du jour — l'ancienne
     * version ne renvoyait que id/nom/statut, laissant ces zones vides.
     */
    public function getOccupation()
    {
        $now = now();

        $salles = Salle::with(['reservations' => function ($q) use ($now) {
            $q->where('statut', 'confirmee')
                ->where('date_fin', '>=', $now)
                ->whereDate('date_debut', $now->toDateString())
                ->orderBy('date_debut');
        }])->get();

        $result = $salles->map(function ($salle) use ($now) {
            $prochaine = $salle->reservations
                ->first(fn ($r) => $r->date_debut->gt($now));

            return [
                'id_salle' => $salle->id_salle,
                'nom_salle' => $salle->nom_salle,
                'type_salle' => $salle->type_salle,
                'capacite' => $salle->capacite,
                'statut' => $salle->statut_effectif, // calculé, jamais la colonne brute
                'prochaine_reservation' => $prochaine
                    ? $prochaine->date_debut->format('H\hi')
                    : null,
            ];
        });

        return response()->json($result);
    }

    /**
     * ADMIN - Liste complète (gestion)
     * Renvoie un tableau brut (pas de pagination), le frontend fait .filter().
     */
    public function adminIndex(Request $request)
    {
        $query = Salle::with('tarifs')->orderBy('nom_salle');

        if ($request->has('search')) {
            $query->where('nom_salle', 'LIKE', '%' . $request->search . '%');
        }

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        return response()->json($query->get());
    }

    /**
     * ADMIN - Créer une salle (+ tarifs optionnels)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom_salle' => 'required|string|max:100',
            'type_salle' => 'required|string|max:50',
            'capacite' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'equipements' => 'nullable|string',
            'statut' => 'nullable|in:libre,reservee,occupee',
            'tarifs' => 'nullable|array',
            'tarifs.*.categorie_client' => 'required_with:tarifs|in:org_internationale,admin_ong,association_base',
            'tarifs.*.prix' => 'required_with:tarifs|numeric|min:0',
            'tarifs.*.unite' => 'required_with:tarifs|in:jour,heure',
        ]);

        DB::beginTransaction();

        try {
            $salle = Salle::create([
                'nom_salle' => $validated['nom_salle'],
                'type_salle' => $validated['type_salle'],
                'capacite' => $validated['capacite'],
                'description' => $validated['description'] ?? null,
                'equipements' => $validated['equipements'] ?? null,
                'statut' => $validated['statut'] ?? 'libre',
            ]);

            foreach ($validated['tarifs'] ?? [] as $tarif) {
                TarifSalle::create([
                    'id_salle' => $salle->id_salle,
                    'categorie_client' => $tarif['categorie_client'],
                    'prix' => $tarif['prix'],
                    'unite' => $tarif['unite'],
                ]);
            }

            DB::commit();

            return response()->json($salle->load('tarifs'), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur création salle', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la création de la salle',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ADMIN - Modifier une salle
     */
    public function update(Request $request, $id)
    {
        $salle = Salle::findOrFail($id);

        $validated = $request->validate([
            'nom_salle' => 'sometimes|string|max:100',
            'type_salle' => 'sometimes|string|max:50',
            'capacite' => 'sometimes|integer|min:1',
            'description' => 'nullable|string',
            'equipements' => 'nullable|string',
            'statut' => 'sometimes|in:libre,reservee,occupee',
        ]);

        $salle->update($validated);

        return response()->json($salle->load('tarifs'));
    }

    /**
     * ADMIN - Supprimer une salle (blocage propre si réservations liées)
     */
    public function destroy($id)
    {
        $salle = Salle::findOrFail($id);

        $hasReservations = $salle->reservations()->exists();
        if ($hasReservations) {
            return response()->json([
                'message' => 'Impossible de supprimer cette salle : elle a des réservations associées. '
                    . 'Supprimez ou réaffectez d\'abord ces réservations.'
            ], 409);
        }

        DB::beginTransaction();

        try {
            $salle->tarifs()->delete();
            $salle->delete();

            DB::commit();

            return response()->json(['message' => 'Salle supprimée avec succès']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur suppression salle', ['id_salle' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la suppression de la salle',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ADMIN - Voir les tarifs d'une salle
     */
    public function getPrices($id)
    {
        $salle = Salle::with('tarifs')->findOrFail($id);
        return response()->json($salle->tarifs);
    }

    /**
     * ADMIN - Mettre à jour les tarifs (upsert par catégorie)
     * Attend : { "tarifs": [ { "categorie_client": "...", "prix": ..., "unite": "..." } ] }
     */
    public function updatePrices(Request $request, $id)
    {
        $salle = Salle::findOrFail($id);

        $validated = $request->validate([
            'tarifs' => 'required|array|min:1',
            'tarifs.*.categorie_client' => 'required|in:org_internationale,admin_ong,association_base',
            'tarifs.*.prix' => 'required|numeric|min:0',
            'tarifs.*.unite' => 'required|in:jour,heure',
        ]);

        DB::beginTransaction();

        try {
            foreach ($validated['tarifs'] as $tarif) {
                TarifSalle::updateOrCreate(
                    [
                        'id_salle' => $salle->id_salle,
                        'categorie_client' => $tarif['categorie_client'],
                    ],
                    [
                        'prix' => $tarif['prix'],
                        'unite' => $tarif['unite'],
                    ]
                );
            }

            DB::commit();

            return response()->json($salle->load('tarifs'));

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur mise à jour tarifs', ['id_salle' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la mise à jour des tarifs',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
