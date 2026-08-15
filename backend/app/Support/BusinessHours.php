<?php

namespace App\Support;

use Carbon\Carbon;
use Carbon\CarbonPeriod;

class BusinessHours
{
    /**
     * Plages ouvertes indexées par jour ISO (1 = lundi … 7 = dimanche).
     * Chaque entrée : [heure_ouverture, heure_fermeture] en "H:i".
     * Un jour absent = fermé.
     *
     * Le CEFOD physique est fermé le dimanche (règlement papier), mais les
     * réservations via l'application sont désormais acceptées 7j/7, mêmes
     * horaires — décision explicite prise pour l'app (§ conception).
     */
    public const HOURS = [
        1 => ['08:00', '18:00'], // lundi
        2 => ['08:00', '18:00'], // mardi
        3 => ['08:00', '18:00'], // mercredi
        4 => ['08:00', '18:00'], // jeudi
        5 => ['08:00', '18:00'], // vendredi
        6 => ['08:00', '18:00'], // samedi
        7 => ['08:00', '18:00'], // dimanche
    ];

    // -----------------------------------------------------------------
    //  API publique
    // -----------------------------------------------------------------

    /**
     * Le CEFOD est-il ouvert à cet instant ?
     */
    public static function isOpen(Carbon $dt): bool
    {
        $day = $dt->dayOfWeekIso; // 1 = lundi … 7 = dimanche
        if (!isset(self::HOURS[$day])) {
            return false;
        }

        [$open, $close] = self::HOURS[$day];

        $time = $dt->format('H:i');

        return $time >= $open && $time < $close;
    }

    /**
     * Nombre de minutes ouvrées entre $start et $end.
     *
     * Algorithme : on avance jour par jour ; pour chaque jour ouvré on
     * intersecte la plage ouvrée avec l'intervalle [$start, $end] et on
     * cumule les minutes.
     */
    public static function computeOpenMinutes(Carbon $start, Carbon $end): int
    {
        if ($end->lte($start)) {
            return 0;
        }

        $minutes = 0;
        $cursor  = $start->copy()->startOfDay();
        $lastDay = $end->copy()->startOfDay();

        while ($cursor->lte($lastDay)) {
            $dow = $cursor->dayOfWeekIso;

            if (isset(self::HOURS[$dow])) {
                [$oh, $oc] = self::HOURS[$dow];

                // Début et fin de la plage ouvrée CE jour
                $dayOpen  = $cursor->copy()->setTimeFromTimeString($oh);
                $dayClose = $cursor->copy()->setTimeFromTimeString($oc);

                // Intersection avec [$start, $end]
                $effStart = $start->gt($dayOpen)  ? $start : $dayOpen;
                $effEnd   = $end->lt($dayClose)   ? $end   : $dayClose;

                if ($effEnd->gt($effStart)) {
                    $minutes += $effStart->diffInMinutes($effEnd);
                }
            }

            $cursor->addDay();
        }

        return $minutes;
    }

    /**
     * Prochain instant d'ouverture à partir de $dt.
     * Si $dt est déjà dans une plage ouvrée, renvoie $dt tel quel.
     */
    public static function nextOpening(Carbon $dt): Carbon
    {
        // Si déjà ouvert → on renvoie l'instant tel quel
        if (self::isOpen($dt)) {
            return $dt->copy();
        }

        $cursor = $dt->copy();

        // On cherche sur 8 jours max (couvre une semaine entière)
        for ($i = 0; $i < 8; $i++) {
            $dow = $cursor->dayOfWeekIso;

            if (isset(self::HOURS[$dow])) {
                [$oh] = self::HOURS[$dow];
                $opening = $cursor->copy()->setTimeFromTimeString($oh);

                // Si on est le même jour mais avant l'ouverture
                if ($opening->gte($dt)) {
                    return $opening;
                }
            }

            // Passer au jour suivant à minuit
            $cursor->addDay()->startOfDay();
        }

        // Fallback (ne devrait jamais arriver)
        return $dt->copy();
    }

    /**
     * Valide qu'un créneau [$start, $end] respecte les horaires.
     *
     * Retourne null si OK, ou un tableau d'erreurs sinon.
     * Vérifications :
     *   1) date_debut ET date_fin tombent en période ouvrée
     *   2) la réservation dure au moins 60 minutes ouvrées
     */
    public static function validateSlot(Carbon $start, Carbon $end): ?array
    {
        $errors = [];

        if (!self::isOpen($start)) {
            $next = self::nextOpening($start);
            $errors['date_debut'] = "Le début de la réservation tombe hors des horaires d'ouverture. "
                . "Prochaine ouverture : " . $next->format('d/m/Y à H\hi') . ".";
        }

        if (!self::isOpen($end)) {
            // On tolère $end pile sur l'heure de fermeture (18:00:00)
            $dow = $end->dayOfWeekIso;
            $atClose = isset(self::HOURS[$dow])
                && $end->format('H:i') === self::HOURS[$dow][1]
                && (int) $end->format('s') === 0;

            if (!$atClose) {
                $errors['date_fin'] = "La fin de la réservation tombe hors des horaires d'ouverture.";
            }
        }

        $openMin = self::computeOpenMinutes($start, $end);

        if ($openMin < 60) {
            $errors['duree'] = "La réservation doit couvrir au moins 1 heure ouvrée (actuellement {$openMin} min).";
        }

        return empty($errors) ? null : $errors;
    }

    /**
     * Formatte les horaires pour l'affichage humain.
     */
    public static function humanSchedule(): string
    {
        return "Tous les jours (Lundi–Dimanche) : 08 h – 18 h";
    }
}