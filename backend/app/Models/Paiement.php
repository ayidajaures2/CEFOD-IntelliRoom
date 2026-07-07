<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    protected $table = 'paiement';
    protected $primaryKey = 'id_paiement';
    public $timestamps = false;

    protected $fillable = [
        'id_reservation',
        'id_caissier',
        'montant',
        'mode_paiement',
        'date_paiement',
        'statut',        // ← statut (pas statut_paiement)
        'reference'
    ];

    protected $casts = [
        'date_paiement' => 'datetime',
    ];

    public function reservation()
    {
        return $this->belongsTo(Reservation::class, 'id_reservation');
    }

    public function caissier()
    {
        return $this->belongsTo(Utilisateur::class, 'id_caissier');
    }

    public function facture()
    {
        return $this->hasOne(Facture::class, 'id_paiement');
    }
}