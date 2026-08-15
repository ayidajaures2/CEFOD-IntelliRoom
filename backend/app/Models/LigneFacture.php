<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LigneFacture extends Model
{
    protected $table = 'ligne_facture';
    protected $primaryKey = 'id_ligne';
    public $timestamps = false;

    protected $fillable = [
        'id_facture',
        'reference',
        'quantite',
        'description',
        'code_tva',
        'prix_unitaire',
        'montant',
    ];

    protected $casts = [
        'quantite' => 'decimal:2',
        'prix_unitaire' => 'decimal:2',
        'montant' => 'decimal:2',
    ];

    public function facture()
    {
        return $this->belongsTo(Facture::class, 'id_facture');
    }
}
