<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservation', function (Blueprint $table) {
            $table->id('id_reservation');
            $table->foreignId('id_salle')->constrained('salle', 'id_salle');
            $table->foreignId('id_client')->constrained('utilisateur', 'id_utilisateur');
            $table->foreignId('id_sg')->nullable()->constrained('utilisateur', 'id_utilisateur');
            $table->datetime('date_debut');
            $table->datetime('date_fin');
            $table->string('motif', 255)->nullable();
            $table->enum('statut', ['en_attente', 'validee', 'confirmee', 'terminee', 'annulee'])
                ->default('en_attente');
            $table->text('note_interne')->nullable();

            // Champs repris de la fiche papier de demande de réservation
            $table->enum('type_activite', [
                'reunion', 'congres', 'atelier', 'formation',
                'seminaire_colloque_symposium', 'ceremonie_cloture_formation',
                'conference_presse_debat_ag', 'film', 'recrutement', 'autre',
            ])->nullable();
            $table->string('type_activite_autre', 150)->nullable();

            $table->enum('sujet_principal', [
                'droit_homme', 'aspect_genre', 'secours_humanitaire_securite_alimentaire',
                'refugies_pdi', 'agriculture_elevage_pisciculture', 'environnement_climat',
                'ressources_sol_sous_sol', 'droit_foncier_lotissement', 'entrepreneuriat',
                'pauvrete_cherte_vie', 'services_base', 'politique_developpement',
                'education_formation_logiciel', 'sante', 'decentralisation_recensement',
                'gouvernance_corruption', 'securite_interieure',
                'situation_internationale_militaire', 'internet_telephone',
                'sport_culture_loisirs', 'autre',
            ])->nullable();
            $table->string('sujet_principal_autre', 150)->nullable();

            $table->enum('public_cible', ['interne', 'invitation', 'public'])->nullable();
            $table->enum('medias_invites', ['aucun', 'presse_ecrite', 'radio_television', 'tous'])->nullable();
            $table->boolean('retransmission_radio')->default(false);
            $table->decimal('duree_retransmission_heures', 5, 2)->nullable();

            // Statistiques de la fiche papier
            $table->unsignedInteger('nombre_participants')->nullable();
            $table->enum('nombre_femmes', ['tres_peu', 'minorite', 'moitie_moitie', 'majorite', 'presque_tous'])->nullable();

            // Identification du dossier (peut différer du compte client connecté)
            $table->string('titre_groupe_utilisateur', 150)->nullable();
            $table->string('adresse_groupe_utilisateur', 255)->nullable();
            $table->string('nom_responsable_reunion', 150)->nullable();
            $table->string('adresse_responsable_reunion', 255)->nullable();

            $table->timestamp('date_creation')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservation');
    }
};
