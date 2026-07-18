<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Salle extends Model
{
    protected $table = 'salle';
    protected $primaryKey = 'id_salle';
    public $timestamps = true;

    protected $fillable = [
        'nom_salle',
        'type_salle',
        'capacite',
        'description',
        'equipements',
        'statut'
    ];

    // Ajoute automatiquement statut_effectif dans le JSON renvoyé par l'API
    protected $appends = ['statut_effectif'];

    public function tarifs()
    {
        return $this->hasMany(TarifSalle::class, 'id_salle');
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class, 'id_salle');
    }

    /**
     * La colonne `statut` en base (libre/reservee/occupee) sert de
     * valeur par défaut à la création, mais l'état RÉEL affiché dans
     * l'app (catalogue, affichage temps réel) est toujours recalculé
     * ici à partir des réservations confirmées — jamais depuis la
     * colonne brute, pour éviter toute désynchronisation.
     */
    public function getStatutEffectifAttribute()
    {
        $now = now();

        $enCours = $this->reservations()
            ->where('statut', 'confirmee')
            ->where('date_debut', '<=', $now)
            ->where('date_fin', '>=', $now)
            ->exists();

        if ($enCours) {
            return 'occupee';
        }

        $reserveeAVenir = $this->reservations()
            ->where('statut', 'confirmee')
            ->where('date_debut', '>', $now)
            ->whereDate('date_debut', $now->toDateString())
            ->exists();

        return $reserveeAVenir ? 'reservee' : 'libre';
    }
}