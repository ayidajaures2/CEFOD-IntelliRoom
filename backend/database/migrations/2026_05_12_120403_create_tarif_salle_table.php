<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('TarifSalle', function (Blueprint $table) {
            $table->id('id_tarif');
            $table->foreignId('id_salle')->constrained('Salle', 'id_salle')->onDelete('cascade');
            $table->enum('categorie_client', ['org_internationale', 'admin_ong', 'association_base']);
            $table->decimal('prix', 10, 2);
            $table->enum('unite', ['jour', 'heure']);
            $table->unique(['id_salle', 'categorie_client']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('TarifSalle');
    }
};