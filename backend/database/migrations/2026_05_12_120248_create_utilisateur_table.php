<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utilisateur', function (Blueprint $table) {
            $table->id('id_utilisateur');
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('email', 255)->unique();
            $table->string('telephone', 20)->nullable();
            $table->string('password', 255);
            $table->enum('role', ['admin', 'sg', 'comptabilite', 'receptionniste', 'caissier', 'client']);

            // Choisie par l'utilisateur/l'admin (clients uniquement). Reflète les
            // 7 cases de la fiche papier CEFOD.
            $table->enum('sous_categorie_client', [
                'association', 'organisation_feminine', 'admin_tchad', 'ong_tchad',
                'syndicat_tchad', 'ong_internationale', 'structure_internationale',
            ])->nullable();

            // Palier tarifaire : NE JAMAIS être saisi directement, toujours dérivé
            // de sous_categorie_client (voir mutateur à ajouter sur le modèle
            // Utilisateur). Reste une colonne physique pour rester rapide à
            // requêter/joindre avec tarif_salle et tarif_service.
            $table->enum('categorie_client', ['org_internationale', 'admin_ong', 'association_base'])
                ->nullable();

            $table->string('photo')->nullable();
            $table->timestamp('date_creation')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utilisateur');
    }
};
