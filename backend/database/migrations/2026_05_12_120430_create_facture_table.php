<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facture', function (Blueprint $table) {
            $table->id('id_facture');
            $table->string('numero_facture', 50)->unique();
            $table->foreignId('id_paiement')->unique()->constrained('paiement', 'id_paiement');
            $table->foreignId('id_comptable')->nullable()->constrained('utilisateur', 'id_utilisateur');
            $table->string('ref_commande', 100)->nullable();
            $table->string('responsable_client', 150)->nullable();
            $table->timestamp('date_emission')->useCurrent();
            $table->enum('mode_generation', ['automatique', 'manuelle'])->default('automatique');
            $table->decimal('net_a_payer', 12, 2)->default(0);
            $table->decimal('frais_livraison', 10, 2)->default(0);
            $table->decimal('taux_remise', 5, 2)->default(0);
            $table->decimal('total_ttc', 12, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facture');
    }
};
