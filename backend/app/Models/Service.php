<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $table = 'service';
    protected $primaryKey = 'id_service';
    public $timestamps = false;

    protected $fillable = [
        'nom',
        'description',
        'unite', // jour, heure, personne
    ];

    public function tarifs()
    {
        return $this->hasMany(TarifService::class, 'id_service');
    }

    public function reservationServices()
    {
        return $this->hasMany(ReservationService::class, 'id_service');
    }
}
