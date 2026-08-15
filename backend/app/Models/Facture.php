<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Facture extends Model
{
    protected $table = 'facture';
    protected $primaryKey = 'id_facture';
    public $timestamps = false;

    protected $fillable = [
        'numero_facture',
        'id_paiement',
        'id_comptable',
        'ref_commande',
        'responsable_client',
        'date_emission',
        'mode_generation', // automatique (API) ou manuelle (comptabilité)
        'net_a_payer',
        'frais_livraison',
        'taux_remise',
        'total_ttc',
    ];

    protected $casts = [
        'date_emission' => 'datetime',
        'net_a_payer' => 'decimal:2',
        'frais_livraison' => 'decimal:2',
        'taux_remise' => 'decimal:2',
        'total_ttc' => 'decimal:2',
    ];

    public function paiement()
    {
        return $this->belongsTo(Paiement::class, 'id_paiement');
    }

    public function comptable()
    {
        return $this->belongsTo(Utilisateur::class, 'id_comptable');
    }

    public function lignes()
    {
        return $this->hasMany(LigneFacture::class, 'id_facture');
    }
}