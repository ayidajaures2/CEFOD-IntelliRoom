<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\TarifService;
use Illuminate\Database\Seeder;

/**
 * Catalogue des services annexes, avec les tarifs exacts relevés sur les
 * 3 fiches papier CEFOD (Organisations Internationales / Admin-ONG-Syndicat /
 * Association de base). Mise à jour du 07 Mars 2025 sur les fiches.
 */
class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        // ------------------------------------------------------------
        // Vidéoprojecteur — prix/jour qui varie selon la catégorie
        // ------------------------------------------------------------
        $videoprojecteur = Service::create([
            'nom' => 'Vidéoprojecteur',
            'description' => 'Location d\'un vidéoprojecteur pour la durée de l\'activité.',
            'unite' => 'jour',
        ]);

        TarifService::create([
            'id_service' => $videoprojecteur->id_service,
            'categorie_client' => 'org_internationale',
            'prix' => 24500,
        ]);
        TarifService::create([
            'id_service' => $videoprojecteur->id_service,
            'categorie_client' => 'admin_ong',
            'prix' => 19500,
        ]);
        TarifService::create([
            'id_service' => $videoprojecteur->id_service,
            'categorie_client' => 'association_base',
            'prix' => 14500,
        ]);

        // ------------------------------------------------------------
        // Sonorisation (Salle Multimédia & Amphithéâtre) — tarif UNIQUE,
        // identique quelle que soit la catégorie client (categorie_client
        // = null dans tarif_service).
        // ------------------------------------------------------------
        $sonorisation = Service::create([
            'nom' => 'Sonorisation',
            'description' => 'Sonorisation de la Salle Multimédia ou de l\'Amphithéâtre.',
            'unite' => 'jour',
        ]);

        TarifService::create([
            'id_service' => $sonorisation->id_service,
            'categorie_client' => null,
            'prix' => 10000,
        ]);

        // ------------------------------------------------------------
        // Restauration — tarifs par personne, identiques pour toutes les
        // catégories sur les 3 fiches.
        // ------------------------------------------------------------
        $pauseCafeMatin = Service::create([
            'nom' => 'Pause-café matin',
            'description' => 'Service de pause-café en matinée, par personne.',
            'unite' => 'personne',
        ]);
        TarifService::create([
            'id_service' => $pauseCafeMatin->id_service,
            'categorie_client' => null,
            'prix' => 2500,
        ]);

        $pauseCafeApresMidi = Service::create([
            'nom' => 'Pause-café après-midi',
            'description' => 'Service de pause-café en après-midi, par personne.',
            'unite' => 'personne',
        ]);
        TarifService::create([
            'id_service' => $pauseCafeApresMidi->id_service,
            'categorie_client' => null,
            'prix' => 2500,
        ]);

        $pauseDejeuner = Service::create([
            'nom' => 'Pause-déjeuner',
            'description' => 'Service de déjeuner, par personne.',
            'unite' => 'personne',
        ]);
        TarifService::create([
            'id_service' => $pauseDejeuner->id_service,
            'categorie_client' => null,
            'prix' => 5000,
        ]);

        // ------------------------------------------------------------
        // Retransmission radio — tarif UNIQUE à l'heure, identique pour
        // toutes les catégories. Ce service n'est PAS proposé dans une
        // liste à cocher : il est créé automatiquement par
        // BookingController::store() quand le client répond "oui" à la
        // question retransmission_radio de la fiche (option C actée en
        // conception — une seule saisie, traduite automatiquement en
        // ligne facturable, pas de désynchronisation possible).
        // ------------------------------------------------------------
        $retransmissionRadio = Service::create([
            'nom' => 'Retransmission radio',
            'description' => 'Retransmission en direct de l\'activité sur la Radio CEFOD.',
            'unite' => 'heure',
        ]);
        TarifService::create([
            'id_service' => $retransmissionRadio->id_service,
            'categorie_client' => null,
            'prix' => 50000,
        ]);
    }
}