<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservation_service', function (Blueprint $table) {
            $table->id('id_reservation_service');
            $table->foreignId('id_reservation')->constrained('reservation', 'id_reservation')->onDelete('cascade');
            $table->foreignId('id_service')->constrained('service', 'id_service');
            $table->decimal('quantite', 8, 2)->default(1);
            // Prix figé au moment du choix (copié depuis tarif_service) : si le
            // tarif change plus tard, cette réservation garde son prix d'origine.
            $table->decimal('prix_unitaire_applique', 10, 2);
            $table->decimal('montant', 12, 2);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservation_service');
    }
};
