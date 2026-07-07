<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Salle;
use App\Models\TarifSalle;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    // PUBLIC
    public function index()
    {
        return response()->json(Salle::all());
    }

    public function show($id)
    {
        return response()->json(Salle::with('tarifs')->findOrFail($id));
    }

    public function getOccupation()
    {
        return response()->json(Salle::select('id_salle', 'nom_salle', 'statut')->get());
    }

    // ADMIN
    public function adminIndex()
    {
        return response()->json(Salle::with('tarifs')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom_salle' => 'required|string|max:100|unique:salle,nom_salle',
            'type_salle' => 'required|string|max:50',
            'capacite' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'equipements' => 'nullable|string',
        ]);

        return response()->json(Salle::create($validated), 201);
    }

    public function update(Request $request, $id)
    {
        $salle = Salle::findOrFail($id);

        $validated = $request->validate([
            'nom_salle' => 'sometimes|string|max:100|unique:salle,nom_salle,' . $id . ',id_salle',
            'type_salle' => 'sometimes|string|max:50',
            'capacite' => 'sometimes|integer|min:1',
            'description' => 'nullable|string',
            'equipements' => 'nullable|string',
            'statut' => 'sometimes|in:libre,reservee,occupee',
        ]);

        $salle->update($validated);
        return response()->json($salle);
    }

    public function destroy($id)
    {
        Salle::findOrFail($id)->delete();
        return response()->json(['message' => 'Salle supprimée']);
    }

    // TARIFS
    public function getPrices($id)
    {
        return response()->json(TarifSalle::where('id_salle', $id)->get());
    }

    public function updatePrices(Request $request, $id)
    {
        $validated = $request->validate([
            'prices' => 'required|array',
            'prices.*.categorie_client' => 'required|in:org_internationale,admin_ong,association_base',
            'prices.*.prix' => 'required|numeric|min:0',
            'prices.*.unite' => 'required|in:jour,heure',
        ]);

        foreach ($validated['prices'] as $priceData) {
            TarifSalle::updateOrCreate(
                ['id_salle' => $id, 'categorie_client' => $priceData['categorie_client']],
                ['prix' => $priceData['prix'], 'unite' => $priceData['unite']]
            );
        }

        return response()->json(['message' => 'Tarifs mis à jour']);
    }
}