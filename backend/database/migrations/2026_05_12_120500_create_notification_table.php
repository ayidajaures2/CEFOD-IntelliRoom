<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('Notification', function (Blueprint $table) {
            $table->id('id_notification');
            $table->foreignId('id_utilisateur')->constrained('Utilisateur', 'id_utilisateur');
            $table->string('titre', 100);
            $table->text('contenu');
            $table->enum('type', ['confirmation', 'rappel', 'annulation', 'info']);
            $table->boolean('est_lu')->default(false);
            $table->timestamp('date_creation')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('Notification');
    }
};