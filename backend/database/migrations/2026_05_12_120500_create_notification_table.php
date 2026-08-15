<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification', function (Blueprint $table) {
            $table->id('id_notification');
            $table->foreignId('id_utilisateur')->constrained('utilisateur', 'id_utilisateur');
            $table->string('titre', 100);
            $table->text('contenu');
            // varchar libre, PAS un ENUM : le code utilise en réalité
            // reservation / validation / annulation / paiement / info, et
            // NotificationController::broadcast() accepte n'importe quelle
            // valeur envoyée par l'admin (max 50 caractères). Un ENUM figé
            // ici tronque silencieusement (ou plante en mode strict) dès
            // qu'une valeur hors liste est insérée — déjà rencontré une
            // fois avec faq.categorie, même cause.
            $table->string('type', 50)->default('info');
            $table->boolean('est_lu')->default(false);
            $table->timestamp('date_creation')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification');
    }
};