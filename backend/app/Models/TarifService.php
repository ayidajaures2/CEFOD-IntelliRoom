<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TarifService extends Model
{
    protected $table = 'tarif_service';
    protected $primaryKey = 'id_tarif_service';
    public $timestamps = false;

    protected $fillable = [
        'id_service',
        'categorie_client', // null = tarif unique pour toutes les catégories
        'prix',
    ];

    protected $casts = [
        'prix' => 'decimal:2',
    ];

    public function service()
    {
        return $this->belongsTo(Service::class, 'id_service');
    }
}
