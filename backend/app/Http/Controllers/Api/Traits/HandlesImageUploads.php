<?php

namespace App\Http\Controllers\Api\Traits;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Petites aides pour stocker/supprimer des images sur le disque "public".
 * Le fichier est enregistré dans storage/app/public/<dossier>/ et on ne
 * garde en base que le chemin relatif (ex: "salles/abc123.jpg").
 *
 * Prérequis : php artisan storage:link (crée public/storage → storage/app/public).
 */
trait HandlesImageUploads
{
    /**
     * Stocke une image et renvoie son chemin relatif ; supprime l'ancienne si fournie.
     */
    protected function storeImage(UploadedFile $file, string $dossier, ?string $ancien = null): string
    {
        if ($ancien) {
            $this->deleteImage($ancien);
        }

        $nom = Str::uuid() . '.' . $file->getClientOriginalExtension();
        // stocke dans storage/app/public/<dossier>/<uuid>.<ext>
        $file->storeAs($dossier, $nom, 'public');

        return $dossier . '/' . $nom;
    }

    /**
     * Supprime une image du disque public si elle existe.
     */
    protected function deleteImage(?string $chemin): void
    {
        if ($chemin && Storage::disk('public')->exists($chemin)) {
            Storage::disk('public')->delete($chemin);
        }
    }
}
