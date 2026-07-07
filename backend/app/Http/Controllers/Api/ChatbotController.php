<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use App\Models\Salle;
use App\Models\TarifSalle;
use Illuminate\Http\Request;

class ChatbotController extends Controller
{
    // PUBLIC
    public function getFaq()
    {
        return response()->json(Faq::all());
    }

    public function ask(Request $request)
    {
        $question = strtolower(trim($request->input('question')));

        // 1. FAQ
        $faq = Faq::where('question', 'LIKE', "%{$question}%")
            ->orWhere('mots_cles', 'LIKE', "%{$question}%")
            ->first();

        if ($faq) {
            return response()->json(['reponse' => $faq->reponse, 'type' => 'faq']);
        }

        // 2. Disponibilité
        if (strpos($question, 'disponible') !== false || strpos($question, 'libre') !== false) {
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
        if (strpos($question, 'capacité') !== false || strpos($question, 'combien') !== false) {
            preg_match('/\d+/', $question, $matches);
            if ($matches) {
                $nb = (int)$matches[0];
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
        if (strpos($question, 'tarif') !== false || strpos($question, 'prix') !== false) {
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
        if (strpos($question, 'réserver') !== false || strpos($question, 'reserver') !== false) {
            return response()->json([
                'reponse' => "Pour réserver :\n1. Connectez-vous\n2. Choisissez une salle\n3. Sélectionnez une date\n4. Validez\n5. Payez (en ligne ou sur place)",
                'type' => 'procedure'
            ]);
        }

        // 6. Localisation
        if (strpos($question, 'localisation') !== false || strpos($question, 'adresse') !== false) {
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

    // ADMIN - FAQ
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
}