<?php

namespace App\Console\Commands;

use App\Models\Reservation;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Bascule les réservations `confirmee` dont la date_fin est dépassée vers
 * `terminee`. Stocké en base (pas seulement calculé) pour la traçabilité :
 * l'historique doit refléter fidèlement qu'une réservation a bien eu lieu et
 * s'est terminée, indépendamment de l'instant où quelqu'un consulte la fiche.
 *
 * N'affecte QUE les réservations confirmee (donc payées). Une réservation
 * restée validee sans paiement, même après sa date_fin, n'est jamais
 * automatiquement basculée par cette commande — elle reste en l'état pour
 * qu'un humain (SG/admin) décide quoi en faire.
 */
class MarkReservationsTerminee extends Command
{
    protected $signature = 'reservations:mark-terminee';

    protected $description = 'Bascule vers "terminee" les réservations confirmées dont le créneau est passé';

    public function handle(): int
    {
        $count = Reservation::where('statut', 'confirmee')
            ->where('date_fin', '<', now())
            ->update(['statut' => 'terminee']);

        if ($count > 0) {
            Log::info("reservations:mark-terminee — {$count} réservation(s) basculée(s) vers terminee.");
        }

        $this->info("{$count} réservation(s) basculée(s) vers terminee.");

        return self::SUCCESS;
    }
}