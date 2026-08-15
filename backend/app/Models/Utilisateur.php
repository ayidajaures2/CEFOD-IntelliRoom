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

    /**
     * categorie_client est VOLONTAIREMENT absent de $fillable : c'est une
     * colonne dérivée, jamais saisie directement. Elle est renseignée par
     * le mutateur setSousCategorieClientAttribute() ci-dessous dès que
     * sous_categorie_client change (mass assignment ou affectation directe).
     */
    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'telephone',
        'password',
        'role',
        'sous_categorie_client', // les 7 valeurs de la fiche papier (clients uniquement)
        'photo',
        'date_creation',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'date_creation' => 'datetime',
    ];

    protected $appends = ['photo_url'];

    /**
     * Table de correspondance sous_categorie_client -> categorie_client
     * (palier tarifaire). Les 7 sous-catégories de la fiche papier se
     * répartissent dans les 3 paliers de tarif_salle/tarif_service.
     */
    private const SOUS_CATEGORIE_VERS_CATEGORIE = [
        'association' => 'association_base',
        'organisation_feminine' => 'association_base',
        'admin_tchad' => 'admin_ong',
        'ong_tchad' => 'admin_ong',
        'syndicat_tchad' => 'admin_ong',
        'ong_internationale' => 'org_internationale',
        'structure_internationale' => 'org_internationale',
    ];

    /**
     * Mutateur : à chaque fois que sous_categorie_client est renseigné
     * (création, mise à jour, fill()), categorie_client est recalculé et
     * écrit automatiquement. Impossible de le désynchroniser depuis l'API,
     * puisque categorie_client n'est jamais mass-assignable directement.
     */
    public function setSousCategorieClientAttribute($value)
    {
        $this->attributes['sous_categorie_client'] = $value;
        $this->attributes['categorie_client'] = self::SOUS_CATEGORIE_VERS_CATEGORIE[$value] ?? null;
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class, 'id_client');
    }

    public function reservationsValideesSg()
    {
        return $this->hasMany(Reservation::class, 'id_sg');
    }

    public function paiementsEncaisses()
    {
        return $this->hasMany(Paiement::class, 'id_caissier');
    }

    public function paiementsValides()
    {
        return $this->hasMany(Paiement::class, 'id_comptable');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'id_utilisateur');
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class, 'id_utilisateur');
    }

    /**
     * URL complète de l'avatar (ou null). Nécessite `php artisan storage:link`.
     */
    public function getPhotoUrlAttribute()
    {
        return $this->photo ? asset('storage/' . $this->photo) : null;
    }
}