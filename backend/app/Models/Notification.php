<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $table = 'notification';
    protected $primaryKey = 'id_notification';
    public $timestamps = false;

    protected $fillable = [
        'id_utilisateur',
        'titre',
        'contenu',
        'type',
        'est_lu',
        'date_creation'
    ];

    protected $casts = [
        'est_lu' => 'boolean',
        'date_creation' => 'datetime',
    ];

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }
}
