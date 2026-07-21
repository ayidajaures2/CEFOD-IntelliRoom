<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    protected $table = 'reservation';
    protected $primaryKey = 'id_reservation';
    public $timestamps = false;

    protected $fillable = [
        'id_salle',
        'id_client',
        'id_receptionniste',
        'date_creation',
        'date_debut',
        'date_fin',
        'motif',
        'statut'
    ];

    protected $casts = [
        'date_creation' => 'datetime',
        'date_debut' => 'datetime',
        'date_fin' => 'datetime',
    ];

    // Ajoute automatiquement statut_effectif dans le JSON renvoyé par l'API
    protected $appends = ['statut_effectif'];

    public function salle()
    {
        return $this->belongsTo(Salle::class, 'id_salle');
    }

    public function client()
    {
        return $this->belongsTo(Utilisateur::class, 'id_client');
    }

    public function receptionniste()
    {
        return $this->belongsTo(Utilisateur::class, 'id_receptionniste');
    }

    public function paiement()
    {
        return $this->hasOne(Paiement::class, 'id_reservation');
    }

    /**
     * Le statut stocké en base (`statut`) ne connaît que :
     * en_attente, validee, confirmee, annulee.
     *
     * "en_cours" et "terminee" ne sont JAMAIS écrits en base : ils sont
     * déduits en comparant date_debut/date_fin à l'heure actuelle, à
     * chaque fois que la réservation est sérialisée en JSON.
     */
    public function getStatutEffectifAttribute()
    {
        if ($this->statut !== 'confirmee') {
            return $this->statut;
        }

        $now = now();

        if ($now->lt($this->date_debut)) {
            return 'confirmee';
        }

        if ($now->between($this->date_debut, $this->date_fin)) {
            return 'en_cours';
        }

        return 'terminee';
    }
}
