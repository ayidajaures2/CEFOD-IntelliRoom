<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Utilisateur', function (Blueprint $table) {
            $table->id('id_utilisateur');
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('email', 255)->unique();
            $table->string('telephone', 20)->nullable();
            $table->string('password', 255);
            $table->enum('role', ['admin', 'receptionniste', 'caissier', 'client']);
            $table->timestamp('date_creation')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Utilisateur');
    }
};