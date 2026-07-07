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
}