<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salle', function (Blueprint $table) {
            $table->id('id_salle');
            $table->string('nom_salle', 100);
            $table->string('type_salle', 50);
            $table->integer('capacite');
            $table->text('description')->nullable();
            $table->text('equipements')->nullable();
            $table->string('image', 255)->nullable();
            $table->enum('statut', ['libre', 'reservee', 'occupee'])->default('libre');
            $table->timestamps(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salle');
    }
};