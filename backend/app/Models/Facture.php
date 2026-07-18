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
        'date_emission',
        // ⚠ AJOUT : InvoiceController::generateManually() passe
        // mode_generation ('manuelle'/'automatique') mais le champ était
        // absent du fillable → silencieusement ignoré par Eloquent, la
        // colonne restait NULL et les stats automatic/manual de
        // l'adminIndex étaient fausses. (Si la colonne n'existe pas
        // encore en base, ajoute-la : ALTER TABLE facture ADD
        // mode_generation ENUM('automatique','manuelle') DEFAULT 'automatique';)
        'mode_generation',
    ];

    protected $casts = [
        'date_emission' => 'datetime',
    ];

    public function paiement()
    {
        return $this->belongsTo(Paiement::class, 'id_paiement');
    }
}
