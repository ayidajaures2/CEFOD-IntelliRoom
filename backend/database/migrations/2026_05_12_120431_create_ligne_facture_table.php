<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ligne_facture', function (Blueprint $table) {
            $table->id('id_ligne');
            $table->foreignId('id_facture')->constrained('facture', 'id_facture')->onDelete('cascade');
            $table->string('reference', 50)->nullable();
            $table->decimal('quantite', 8, 2)->default(1);
            $table->string('description', 255);
            $table->string('code_tva', 20)->nullable();
            $table->decimal('prix_unitaire', 10, 2);
            $table->decimal('montant', 12, 2);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ligne_facture');
    }
};
