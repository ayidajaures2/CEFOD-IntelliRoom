<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReservationService extends Model
{
    protected $table = 'reservation_service';
    protected $primaryKey = 'id_reservation_service';
    public $timestamps = false;

    protected $fillable = [
        'id_reservation',
        'id_service',
        'quantite',
        'prix_unitaire_applique', // copié depuis tarif_service au moment du choix
        'montant',
    ];

    protected $casts = [
        'quantite' => 'decimal:2',
        'prix_unitaire_applique' => 'decimal:2',
        'montant' => 'decimal:2',
    ];

    public function reservation()
    {
        return $this->belongsTo(Reservation::class, 'id_reservation');
    }

    public function service()
    {
        return $this->belongsTo(Service::class, 'id_service');
    }
}
