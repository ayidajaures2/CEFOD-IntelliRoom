<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Facture extends Model
{
    protected $table = 'facture';
    protected $primaryKey = 'id_facture';
    public $timestamps = false;

    protected $fillable = [
        'numero_facture',  // ← numero_facture (pas num_facture)
        'id_paiement',
        'date_emission'
    ];

    protected $casts = [
        'date_emission' => 'datetime',
    ];

    public function paiement()
    {
        return $this->belongsTo(Paiement::class, 'id_paiement');
    }
}