<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Traits\HandlesImageUploads;
use App\Models\Salle;
use Illuminate\Http\Request;

/**
 * Photo d'une salle — réservé à l'admin.
 * Routes (groupe role:admin, prefix admin) :
 *   POST   /api/admin/rooms/{id}/image  -> upload/remplacement
 *   DELETE /api/admin/rooms/{id}/image  -> suppression
 */
class RoomPhotoController extends Controller
{
    use HandlesImageUploads;

    public function update(Request $request, $id)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,jpg,png,webp|max:4096', // 4 Mo
        ]);

        $salle = Salle::findOrFail($id);

        $chemin = $this->storeImage($request->file('image'), 'salles', $salle->image);
        $salle->image = $chemin;
        $salle->save();

        return response()->json([
            'message' => 'Photo de la salle mise à jour.',
            'image_url' => $salle->image_url,
            'salle' => $salle->load('tarifs'),
        ]);
    }

    public function destroy($id)
    {
        $salle = Salle::findOrFail($id);

        $this->deleteImage($salle->image);
        $salle->image = null;
        $salle->save();

        return response()->json([
            'message' => 'Photo de la salle supprimée.',
            'salle' => $salle->load('tarifs'),
        ]);
    }
}
