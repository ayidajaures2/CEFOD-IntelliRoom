<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Reservation', function (Blueprint $table) {
            $table->id('id_reservation');
            $table->foreignId('id_salle')->constrained('Salle', 'id_salle');
            $table->foreignId('id_client')->constrained('Utilisateur', 'id_utilisateur');
            $table->foreignId('id_receptionniste')->nullable()->constrained('Utilisateur', 'id_utilisateur');
            $table->datetime('date_debut');
            $table->datetime('date_fin');
            $table->string('motif', 255)->nullable();
            $table->enum('statut', ['en_attente', 'validee', 'annulee', 'terminee'])->default('en_attente');
            $table->timestamp('date_creation')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Reservation');
    }
};