<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TarifSalle extends Model
{
    protected $table = 'tarifsalle';
    protected $primaryKey = 'id_tarif';
    public $timestamps = false;

    protected $fillable = [
        'id_salle',
        'categorie_client',
        'prix',
        'unite'
    ];

    public function salle()
    {
        return $this->belongsTo(Salle::class, 'id_salle');
    }
}