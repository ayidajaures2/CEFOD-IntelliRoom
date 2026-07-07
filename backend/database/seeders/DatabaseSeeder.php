<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin
        DB::table('Utilisateur')->insert([
            'nom' => 'Admin',
            'prenom' => 'System',
            'email' => 'admin@cefod.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'date_creation' => now(),
        ]);

        // Salles
        $salles = [
            ['nom_salle' => 'SALLE 3', 'type_salle' => 'Réunion', 'capacite' => 35, 'description' => 'Salle de réunion standard', 'equipements' => 'Vidéoprojecteur, climatisation'],
            ['nom_salle' => 'SALLE 10', 'type_salle' => 'Réunion', 'capacite' => 50, 'description' => 'Grande salle de réunion', 'equipements' => 'Vidéoprojecteur, climatisation, sonorisation'],
            ['nom_salle' => 'SALLE 66', 'type_salle' => 'Réunion', 'capacite' => 35, 'description' => 'Salle équipée', 'equipements' => 'Vidéoprojecteur, climatisation'],
            ['nom_salle' => 'SALLE 16', 'type_salle' => 'Réunion', 'capacite' => 40, 'description' => 'Salle premium à l’heure', 'equipements' => 'Vidéoprojecteur, climatisation, tableau interactif'],
            ['nom_salle' => 'SALLE AMPHITHEATRE SOUMAINE', 'type_salle' => 'Amphithéâtre', 'capacite' => 150, 'description' => 'Grand amphithéâtre', 'equipements' => 'Sonorisation, scène, écran géant, climatisation'],
            ['nom_salle' => 'SALLE MULTIMEDIA', 'type_salle' => 'Multimédia', 'capacite' => 300, 'description' => 'Grande salle multimédia', 'equipements' => 'Équipements audiovisuels, sonorisation, vidéoprojecteur'],
        ];
        foreach ($salles as $salle) {
            DB::table('Salle')->insert($salle);
        }

        // Tarifs (les id_salle seront attribués dans l’ordre des insertions ci-dessus)
        $tarifs = [
            [1, 'org_internationale', 50000, 'jour'],
            [1, 'admin_ong', 40000, 'jour'],
            [1, 'association_base', 25000, 'jour'],
            [2, 'org_internationale', 55000, 'jour'],
            [2, 'admin_ong', 40000, 'jour'],
            [2, 'association_base', 30000, 'jour'],
            [3, 'org_internationale', 55000, 'jour'],
            [3, 'admin_ong', 40000, 'jour'],
            [3, 'association_base', 30000, 'jour'],
            [4, 'org_internationale', 55000, 'heure'],
            [4, 'admin_ong', 40000, 'heure'],
            [4, 'association_base', 30000, 'heure'],
            [5, 'org_internationale', 55000, 'heure'],
            [5, 'admin_ong', 40000, 'heure'],
            [5, 'association_base', 30000, 'heure'],
            [6, 'org_internationale', 50000, 'heure'],
            [6, 'admin_ong', 30000, 'heure'],
            [6, 'association_base', 25000, 'heure'],
        ];
        foreach ($tarifs as $tarif) {
            DB::table('TarifSalle')->insert([
                'id_salle' => $tarif[0],
                'categorie_client' => $tarif[1],
                'prix' => $tarif[2],
                'unite' => $tarif[3],
            ]);
        }

        // FAQ
        DB::table('FAQ')->insert([
            ['question' => 'Comment réserver une salle ?', 'reponse' => 'Connectez-vous, allez dans le catalogue, choisissez une salle libre, sélectionnez date et horaire, puis validez.', 'categorie' => 'reservation'],
            ['question' => 'Quelles salles sont libres ?', 'reponse' => 'Consultez le tableau d’affichage en temps réel. Les salles vertes sont libres.', 'categorie' => 'orientation'],
            ['question' => 'Quels sont les tarifs ?', 'reponse' => 'Les prix dépendent de la salle et du type d’organisation. Consultez la fiche de la salle.', 'categorie' => 'general'],
        ]);
    }
}