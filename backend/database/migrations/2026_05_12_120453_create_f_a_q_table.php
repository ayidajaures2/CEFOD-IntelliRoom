<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faq', function (Blueprint $table) {
            $table->id('id_faq');
            $table->text('question');
            $table->text('reponse');
            // mots_cles : utilisé par ChatbotController::ask() pour élargir la
            // recherche au-delà du texte exact de la question (LIKE sur les deux
            // colonnes). Sans cette colonne, storeFaq()/updateFaq() plantent dès
            // qu'ils tentent de l'écrire.
            $table->string('mots_cles', 255)->nullable();
            // varchar libre, PAS un ENUM : les catégories sont amenées à évoluer
            // (voir ChatbotController::storeFaq()/updateFaq(), qui valident ce
            // champ comme 'string|max:50', pas comme une liste fermée).
            $table->string('categorie', 50)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faq');
    }
};