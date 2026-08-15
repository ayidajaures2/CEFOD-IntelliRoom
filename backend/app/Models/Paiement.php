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
        'id_comptable',
        'montant',
        'frais',        // frais Mobile Money (0 pour espèces/chèque/virement)
        // 'total' est une colonne GÉNÉRÉE (VIRTUAL/STORED) : NE JAMAIS la
        // mettre dans $fillable, sinon Eloquent tente de l'écrire et MySQL
        // lève « The value specified for generated column 'total' is not allowed ».
        'mode_paiement', // especes, cheque, virement, moov_money, airtel_money
        'date_paiement',
        'statut',        // en_attente, encaisse, valide, annule
        'reference',
    ];

    protected $casts = [
        'date_paiement' => 'datetime',
        'montant' => 'decimal:2',
        'frais'   => 'decimal:2',
        'total'   => 'decimal:2',
    ];

    /**
     * Accessor : total formaté en FCFA (ex. "50 800,00 FCFA").
     * $this->total est fourni automatiquement par la colonne générée MySQL.
     */
    public function getTotalFormattedAttribute()
    {
        return number_format($this->total ?? 0, 2, ',', ' ') . ' FCFA';
    }

    public function reservation()
    {
        return $this->belongsTo(Reservation::class, 'id_reservation');
    }

    public function caissier()
    {
        return $this->belongsTo(Utilisateur::class, 'id_caissier');
    }

    public function comptable()
    {
        return $this->belongsTo(Utilisateur::class, 'id_comptable');
    }

    public function facture()
    {
        return $this->hasOne(Facture::class, 'id_paiement');
    }
}