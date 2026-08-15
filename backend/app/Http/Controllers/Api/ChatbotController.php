<?php
// app/Http/Controllers/Api/ChatbotController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Salle;
use App\Models\TarifSalle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatbotController extends Controller
{
    // ============================================================
    // PUBLIC
    // ============================================================

    public function getFaq()
    {
        return response()->json(Faq::all());
    }

    public function ask(Request $request)
    {
        $question = strtolower(trim(
            $request->input('message', $request->input('question', ''))
        ));

        if ($question === '') {
            return response()->json([
                'reponse' => "Posez-moi une question sur les salles, les tarifs ou les réservations.",
                'type' => 'aide',
            ]);
        }

        $faq = Faq::where('question', 'LIKE', "%{$question}%")
            ->orWhere('mots_cles', 'LIKE', "%{$question}%")
            ->first();

        if ($faq) {
            return response()->json(['reponse' => $faq->reponse, 'type' => 'faq']);
        }

        if (str_contains($question, 'disponible') || str_contains($question, 'libre')) {
            $salles = Salle::where('statut', 'libre')->get();
            if ($salles->count() > 0) {
                return response()->json([
                    'reponse' => 'Salles disponibles : ' . $salles->pluck('nom_salle')->implode(', '),
                    'type' => 'disponibilite'
                ]);
            }
            return response()->json(['reponse' => 'Aucune salle disponible.', 'type' => 'disponibilite']);
        }

        if (str_contains($question, 'capacité') || str_contains($question, 'combien')) {
            preg_match('/\d+/', $question, $matches);
            if ($matches) {
                $nb = (int) $matches[0];
                $salles = Salle::where('capacite', '>=', $nb)->get();
                if ($salles->count() > 0) {
                    return response()->json([
                        'reponse' => "Salles pour {$nb} personnes : " . $salles->pluck('nom_salle')->implode(', '),
                        'type' => 'capacite'
                    ]);
                }
                return response()->json(['reponse' => "Aucune salle pour {$nb} personnes.", 'type' => 'capacite']);
            }
        }

        if (str_contains($question, 'tarif') || str_contains($question, 'prix')) {
            $tarifs = TarifSalle::with('salle')->get();
            if ($tarifs->count() > 0) {
                $msg = "Tarifs :\n";
                foreach ($tarifs as $t) {
                    $msg .= "• {$t->salle->nom_salle} : {$t->prix} FCFA / {$t->unite}\n";
                }
                return response()->json(['reponse' => $msg, 'type' => 'tarifs']);
            }
        }

        if (str_contains($question, 'réserver') || str_contains($question, 'reserver')) {
            return response()->json([
                'reponse' => "Pour réserver :\n1. Connectez-vous\n2. Choisissez une salle\n3. Sélectionnez une date\n4. Validez\n5. Payez (en ligne ou sur place)",
                'type' => 'procedure'
            ]);
        }

        if (str_contains($question, 'localisation') || str_contains($question, 'adresse')) {
            return response()->json([
                'reponse' => "Le CEFOD est situé à [Adresse]. Ouvert du lundi au vendredi de 8h à 18h.",
                'type' => 'localisation'
            ]);
        }

        return response()->json([
            'reponse' => "Je n'ai pas trouvé de réponse. Souhaitez-vous être redirigé vers un réceptionniste ?",
            'type' => 'redirect',
            'redirect' => true
        ]);
    }

    // ============================================================
    // ADMIN - FAQ
    // ============================================================

    public function adminGetFaq()
    {
        return response()->json(Faq::all());
    }

    public function storeFaq(Request $request)
    {
        $validated = $request->validate([
            'question' => 'required|string',
            'reponse' => 'required|string',
            'categorie' => 'required|string|max:50',
            'mots_cles' => 'nullable|string',
        ]);

        return response()->json(Faq::create($validated), 201);
    }

    public function updateFaq(Request $request, $id)
    {
        $faq = Faq::findOrFail($id);

        $validated = $request->validate([
            'question' => 'sometimes|string',
            'reponse' => 'sometimes|string',
            'categorie' => 'sometimes|string|max:50',
            'mots_cles' => 'nullable|string',
        ]);

        $faq->update($validated);
        return response()->json($faq);
    }

    public function deleteFaq($id)
    {
        Faq::findOrFail($id)->delete();
        return response()->json(['message' => 'FAQ supprimée']);
    }

    // ============================================================
    // CONVERSATIONS (auth:sanctum)
    // ============================================================

    /** Le personnel voit toutes les conversations. Le SG n'y a PAS accès :
     * la communication avec les clients est le rôle exclusif de la réception
     * (décision actée) — le SG se concentre sur la validation des demandes. */
    private function isStaff(): bool
    {
        return in_array(Auth::user()?->role, ['receptionniste', 'admin', 'caissier'], true);
    }

    /**
     * La colonne `expediteur` du schéma accepte désormais exactement les
     * mêmes valeurs que `utilisateur.role` (client, receptionniste, sg,
     * caissier, comptabilite, admin) + chatbot — plus besoin de mapping.
     */
    private function expediteurCourant(): string
    {
        return Auth::user()?->role ?? 'client';
    }

    public function startConversation(Request $request)
    {
        $conversation = Conversation::create([
            'id_utilisateur' => Auth::id(),
            'debut_conversation' => now(),
        ]);

        return response()->json(['id_conversation' => $conversation->id_conversation]);
    }

    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'id_conversation' => 'required|exists:conversation,id_conversation',
            'contenu_mess' => 'required_without:message|string',
            'message' => 'required_without:contenu_mess|string',
        ]);

        $contenu = $validated['contenu_mess'] ?? $validated['message'];
        $expediteur = $this->expediteurCourant();

        Message::create([
            'id_conversation' => $validated['id_conversation'],
            'expediteur' => $expediteur,
            'contenu' => $contenu,
            'date_envoi' => now(),
        ]);

        return response()->json(['message' => 'Message envoyé.']);
    }

    private function generateResponse($message)
    {
        $message = strtolower(trim($message));

        $faq = Faq::where('question', 'LIKE', "%{$message}%")
            ->orWhere('mots_cles', 'LIKE', "%{$message}%")
            ->first();

        if ($faq) {
            return $faq->reponse;
        }

        return "Je n'ai pas trouvé de réponse. Un réceptionniste vous répondra ici dès que possible.";
    }

    public function getConversations()
    {
        $query = Conversation::with('messages')
            ->orderBy('debut_conversation', 'desc');

        if ($this->isStaff()) {
            $query->with('utilisateur:id_utilisateur,nom,prenom,email');
        } else {
            $query->where('id_utilisateur', Auth::id());
        }

        return response()->json($query->get());
    }

    public function getMessages($id)
    {
        $query = Conversation::with('messages');
        if (!$this->isStaff()) {
            $query->where('id_utilisateur', Auth::id());
        }

        return response()->json($query->findOrFail($id));
    }

    public function deleteConversation($id)
    {
        $query = Conversation::query();
        if (!$this->isStaff()) {
            $query->where('id_utilisateur', Auth::id());
        }

        $conversation = $query->findOrFail($id);
        Message::where('id_conversation', $conversation->id_conversation)->delete();
        $conversation->delete();

        return response()->json(['message' => 'Conversation supprimée']);
    }
}