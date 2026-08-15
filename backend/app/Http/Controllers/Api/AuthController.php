<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Inscription publique — TOUJOURS en tant que 'client'.
     *
     * Le rôle n'est jamais accepté depuis la requête (faille corrigée) : il
     * est forcé à 'client'. La création de comptes staff passe exclusivement
     * par AdminController::storeUser().
     *
     * On saisit sous_categorie_client (7 valeurs de la fiche papier) et non
     * categorie_client : le palier tarifaire est dérivé automatiquement par
     * le mutateur du modèle Utilisateur.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|unique:utilisateur,email',
            'telephone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6|confirmed',
            'sous_categorie_client' => 'required|in:association,organisation_feminine,admin_tchad,ong_tchad,syndicat_tchad,ong_internationale,structure_internationale',
        ]);

        $user = Utilisateur::create([
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'email' => $validated['email'],
            'telephone' => $validated['telephone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'client', // forcé, jamais pris depuis la requête
            'sous_categorie_client' => $validated['sous_categorie_client'], // categorie_client dérivé par le mutateur
            'date_creation' => now(),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Inscription réussie',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt(['email' => $validated['email'], 'password' => $validated['password']])) {
            throw ValidationException::withMessages([
                'email' => ['Identifiants incorrects'],
            ]);
        }

        $user = Auth::user();
        /** @var \App\Models\Utilisateur $user */
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Connexion réussie',
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * L'email est TOTALEMENT immuable après création (règle CEFOD) : il n'est
     * accepté par aucune règle de validation ici. Même si le frontend l'envoie,
     * il est ignoré. La catégorie tarifaire n'est pas modifiable non plus par
     * le client lui-même.
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();
        /** @var \App\Models\Utilisateur $user */

        $validated = $request->validate([
            'nom' => 'sometimes|string|max:100',
            'prenom' => 'sometimes|string|max:100',
            'telephone' => 'nullable|string|max:20',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profil mis à jour',
            'user' => $user,
        ]);
    }

    public function changePassword(Request $request)
    {
        $user = Auth::user();
        /** @var \App\Models\Utilisateur $user */

        $validated = $request->validate([
            'oldPassword' => 'required|string',
            'newPassword' => 'required|string|min:6|confirmed',
        ]);

        if (!Hash::check($validated['oldPassword'], $user->password)) {
            throw ValidationException::withMessages([
                'oldPassword' => ['Mot de passe actuel incorrect'],
            ]);
        }

        $user->password = Hash::make($validated['newPassword']);
        $user->save();

        return response()->json(['message' => 'Mot de passe modifié']);
    }

    public function deleteAccount(Request $request)
    {
        $user = Auth::user();
        /** @var \App\Models\Utilisateur $user */

        $validated = $request->validate([
            'password' => 'required|string',
        ]);

        if (!Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['Mot de passe incorrect'],
            ]);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Compte supprimé']);
    }
}