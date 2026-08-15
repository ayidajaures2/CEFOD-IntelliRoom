<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Bascule les réservations confirmee dont la date_fin est dépassée vers
// terminee. Voir app/Console/Commands/MarkReservationsTerminee.php.
Schedule::command('reservations:mark-terminee')->everyFifteenMinutes();