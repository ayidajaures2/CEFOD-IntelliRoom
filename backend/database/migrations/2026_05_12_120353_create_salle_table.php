<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Salle', function (Blueprint $table) {
            $table->id('id_salle');
            $table->string('nom_salle', 100);
            $table->string('type_salle', 50);
            $table->integer('capacite');
            $table->text('description')->nullable();
            $table->text('equipements')->nullable();
            $table->enum('statut', ['libre', 'reservee', 'occupee'])->default('libre');
            $table->timestamps(false); // on utilise date_creation manuellement? mais on peut ajouter un champ si besoin
            // Pour rester cohérent avec le MCD, pas de created_at/updated_at automatiques.
        });
        // Si vous voulez un champ date_creation, ajoutez-le, mais votre modèle ne l'utilise pas. Laissons simple.
    }

    public function down(): void
    {
        Schema::dropIfExists('Salle');
    }
};