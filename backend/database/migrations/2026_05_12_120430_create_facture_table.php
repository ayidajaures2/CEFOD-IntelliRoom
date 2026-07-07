<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Facture', function (Blueprint $table) {
            $table->id('id_facture');
            $table->string('numero_facture', 50)->unique();
            $table->foreignId('id_paiement')->unique()->constrained('Paiement', 'id_paiement');
            $table->timestamp('date_emission')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Facture');
    }
};