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
    public function register(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|unique:utilisateur,email',
            'telephone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'sometimes|in:admin,receptionniste,caissier,client',
        ]);

        $user = Utilisateur::create([
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'email' => $validated['email'],
            'telephone' => $validated['telephone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'client',
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

    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'nom' => 'sometimes|string|max:100',
            'prenom' => 'sometimes|string|max:100',
            'email' => 'sometimes|email|unique:utilisateur,email,' . $user->id_utilisateur . ',id_utilisateur',
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