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

    public function tarifs()
    {
        return $this->hasMany(TarifSalle::class, 'id_salle');
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class, 'id_salle');
    }
}