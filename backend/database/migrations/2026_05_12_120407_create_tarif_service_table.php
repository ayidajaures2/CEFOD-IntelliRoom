<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tarif_service', function (Blueprint $table) {
            $table->id('id_tarif_service');
            $table->foreignId('id_service')->constrained('service', 'id_service')->onDelete('cascade');
            // NULL = tarif unique, valable pour toutes les catégories (ex: la
            // sonorisation à 10 000 F/jour, fixe quelle que soit la catégorie).
            // Une valeur précise = ce service a un prix différent pour cette
            // catégorie (ex: le vidéoprojecteur, dont le prix varie).
            // NB : MySQL autorise plusieurs lignes NULL sur une colonne UNIQUE,
            // donc l'unicité "un seul tarif par défaut par service" doit être
            // contrôlée côté application (pas de contrainte DB pour ce cas).
            $table->enum('categorie_client', ['org_internationale', 'admin_ong', 'association_base'])->nullable();
            $table->decimal('prix', 10, 2);
            $table->unique(['id_service', 'categorie_client']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tarif_service');
    }
};
