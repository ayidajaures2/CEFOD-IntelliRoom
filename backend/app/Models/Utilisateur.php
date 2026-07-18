<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Utilisateur extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'utilisateur';
    protected $primaryKey = 'id_utilisateur';
    public $timestamps = false;

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'telephone',
        'password',
        'role',
        'categorie_client', // AJOUTÉ — org_internationale / admin_ong / association_base (clients uniquement)
        'date_creation'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'date_creation' => 'datetime',
    ];

    public function reservations()
    {
        return $this->hasMany(Reservation::class, 'id_client');
    }

    public function reservationsValidees()
    {
        return $this->hasMany(Reservation::class, 'id_receptionniste');
    }

    public function paiements()
    {
        return $this->hasMany(Paiement::class, 'id_caissier');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'id_utilisateur');
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class, 'id_utilisateur');
    }
}