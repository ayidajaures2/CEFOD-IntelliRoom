<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Traits\HandlesImageUploads;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Photo de profil (avatar) — chaque utilisateur gère la sienne.
 * Routes (dans le groupe auth:sanctum) :
 *   POST   /api/profile/photo   -> upload/remplacement
 *   DELETE /api/profile/photo   -> suppression
 */
class ProfilePhotoController extends Controller
{
    use HandlesImageUploads;

    public function update(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,jpg,png,webp|max:2048', // 2 Mo
        ]);

        /** @var \App\Models\Utilisateur $user */
        $user = Auth::user();

        $chemin = $this->storeImage($request->file('photo'), 'avatars', $user->photo);
        $user->photo = $chemin;
        $user->save();

        return response()->json([
            'message' => 'Photo de profil mise à jour.',
            'photo_url' => $user->photo_url,
            'user' => $user,
        ]);
    }

    public function destroy()
    {
        /** @var \App\Models\Utilisateur $user */
        $user = Auth::user();

        $this->deleteImage($user->photo);
        $user->photo = null;
        $user->save();

        return response()->json([
            'message' => 'Photo de profil supprimée.',
            'user' => $user,
        ]);
    }
}
