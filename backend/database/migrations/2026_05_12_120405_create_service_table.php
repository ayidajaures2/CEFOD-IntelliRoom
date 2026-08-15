<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service', function (Blueprint $table) {
            $table->id('id_service');
            $table->string('nom', 100);
            $table->text('description')->nullable();
            $table->enum('unite', ['jour', 'heure', 'personne']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service');
    }
};
