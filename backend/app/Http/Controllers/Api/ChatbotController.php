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
        // ⚠ CORRIGÉ : le frontend envoie le champ `message` ;
        // on accepte aussi `question` pour rester rétrocompatible.
        $question = strtolower(trim(
            $request->input('message', $request->input('question', ''))
        ));

        if ($question === '') {
            return response()->json([
                'reponse' => "Posez-moi une question sur les salles, les tarifs ou les réservations.",
                'type' => 'aide',
            ]);
        }

        // 1. FAQ
        $faq = Faq::where('question', 'LIKE', "%{$question}%")
            ->orWhere('mots_cles', 'LIKE', "%{$question}%")
            ->first();

        if ($faq) {
            return response()->json(['reponse' => $faq->reponse, 'type' => 'faq']);
        }

        // 2. Disponibilité
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

        // 3. Capacité
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

        // 4. Tarifs
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

        // 5. Procédure
        if (str_contains($question, 'réserver') || str_contains($question, 'reserver')) {
            return response()->json([
                'reponse' => "Pour réserver :\n1. Connectez-vous\n2. Choisissez une salle\n3. Sélectionnez une date\n4. Validez\n5. Payez (en ligne ou sur place)",
                'type' => 'procedure'
            ]);
        }

        // 6. Localisation
        if (str_contains($question, 'localisation') || str_contains($question, 'adresse')) {
            return response()->json([
                'reponse' => "Le CEFOD est situé à [Adresse]. Ouvert du lundi au vendredi de 8h à 18h.",
                'type' => 'localisation'
            ]);
        }

        // 7. Pas de réponse
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
            'categorie' => 'required|in:orientation,reservation,salle,general',
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
            'categorie' => 'sometimes|in:orientation,reservation,salle,general',
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

    /** Le personnel (réception, admin, caisse) voit toutes les conversations. */
    private function isStaff(): bool
    {
        return in_array(Auth::user()?->role, ['receptionniste', 'admin', 'caissier'], true);
    }

    /**
     * ⚠ CORRIGÉ : la colonne `expediteur` du schéma n'accepte que
     * client / receptionniste / chatbot — on mappe admin et caissier
     * sur "receptionniste" pour éviter une violation d'ENUM.
     */
    private function expediteurCourant(): string
    {
        $role = Auth::user()?->role ?? 'client';
        return $role === 'client' ? 'client' : 'receptionniste';
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
            // ⚠ CORRIGÉ : `exists:conversation` (table au singulier) —
            // c'était `exists:conversations`, cause du SQLSTATE[42S02].
            'id_conversation' => 'required|exists:conversation,id_conversation',
            // ⚠ CORRIGÉ : le frontend envoie contenu_mess (et message en doublon).
            'contenu_mess' => 'required_without:message|string',
            'message' => 'required_without:contenu_mess|string',
        ]);

        $contenu = $validated['contenu_mess'] ?? $validated['message'];
        $expediteur = $this->expediteurCourant();

        // ⚠ ALIGNÉ sur le modèle Message réel : la colonne s'appelle
        // `contenu` (le cahier des charges disait contenu_mess, mais le
        // code fait foi). `date_envoi` renseignée car $timestamps = false.
        Message::create([
            'id_conversation' => $validated['id_conversation'],
            'expediteur' => $expediteur,
            'contenu' => $contenu,
            'date_envoi' => now(),
        ]);

        // ⚠ CORRIGÉ : le chatbot ne répond automatiquement qu'aux clients.
        // Quand la réception répond, son message est simplement enregistré —
        // sinon chaque réponse humaine déclenchait une réponse robot.
        $reponse = null;
        if ($expediteur === 'client') {
            $reponse = $this->generateResponse($contenu);

            Message::create([
                'id_conversation' => $validated['id_conversation'],
                'expediteur' => 'chatbot',
                'contenu' => $reponse,
                'date_envoi' => now(),
            ]);
        }

        return response()->json(['reponse' => $reponse, 'message' => 'Message envoyé.']);
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
        // ⚠ CORRIGÉ : la réception/admin voit TOUTES les conversations
        // (avec l'utilisateur), sinon la page « Conversations » du
        // personnel restait vide à jamais.
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
        // ⚠ CORRIGÉ : un client ne peut lire que SES conversations ;
        // le personnel peut toutes les lire.
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
        // Supprimer d'abord les messages pour éviter un blocage de clé étrangère.
        Message::where('id_conversation', $conversation->id_conversation)->delete();
        $conversation->delete();

        return response()->json(['message' => 'Conversation supprimée']);
    }
}
