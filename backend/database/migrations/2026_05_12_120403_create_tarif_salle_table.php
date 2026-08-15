<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ⚠ Nom de table SANS underscore : c'est ce que le modèle Eloquent
        // TarifSalle::$table attend ('tarifsalle', hérité du tout premier
        // Schema::create('TarifSalle', ...), lowercased par MySQL/MariaDB
        // sous Windows). Ne PAS renommer en 'tarif_salle' sans mettre à jour
        // le modèle en même temps.
        Schema::create('tarifsalle', function (Blueprint $table) {
            $table->id('id_tarif');
            $table->foreignId('id_salle')->constrained('salle', 'id_salle')->onDelete('cascade');
            $table->enum('categorie_client', ['org_internationale', 'admin_ong', 'association_base']);
            $table->decimal('prix', 10, 2);
            $table->enum('unite', ['jour', 'heure']);
            $table->unique(['id_salle', 'categorie_client']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tarifsalle');
    }
};