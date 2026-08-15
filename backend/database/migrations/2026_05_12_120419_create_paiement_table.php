<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiement', function (Blueprint $table) {
            $table->id('id_paiement');
            $table->foreignId('id_reservation')->unique()->constrained('reservation', 'id_reservation');
            $table->foreignId('id_caissier')->nullable()->constrained('utilisateur', 'id_utilisateur');
            $table->foreignId('id_comptable')->nullable()->constrained('utilisateur', 'id_utilisateur');
            $table->decimal('montant', 10, 2);
            $table->decimal('frais', 10, 2)->default(0.00);
            $table->decimal('total', 10, 2)->virtualAs('montant + frais');
            $table->enum('mode_paiement', ['especes', 'cheque', 'virement', 'moov_money', 'airtel_money']);
            $table->timestamp('date_paiement')->useCurrent();
            $table->enum('statut', ['en_attente', 'encaisse', 'valide', 'annule'])->default('en_attente');
            // Référence unique : seul lien entre l'argent physique (cash compté,
            // chèque, bordereau de virement) et la ligne en base que la
            // comptabilité vérifie. Saisie par l'agent pour les paiements
            // manuels, auto-générée pour le mobile money. Unique en base pour
            // garantir la traçabilité même en cas de bug applicatif.
            $table->string('reference', 100)->nullable()->unique();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiement');
    }
};
