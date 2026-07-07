<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Paiement', function (Blueprint $table) {
            $table->id('id_paiement');
            $table->foreignId('id_reservation')->unique()->constrained('Reservation', 'id_reservation');
            $table->foreignId('id_caissier')->nullable()->constrained('Utilisateur', 'id_utilisateur');
            $table->decimal('montant', 10, 2);
            $table->enum('mode_paiement', ['especes', 'mobile_money']);
            $table->timestamp('date_paiement')->useCurrent();
            $table->enum('statut', ['en_attente', 'valide', 'annule'])->default('en_attente');
            $table->string('reference', 100)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Paiement');
    }
};