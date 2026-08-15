<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    protected $table = 'reservation';
    protected $primaryKey = 'id_reservation';
    public $timestamps = false;

    protected $fillable = [
        'id_salle',
        'id_client',
        'id_sg',
        'date_creation',
        'date_debut',
        'date_fin',
        'motif',
        'statut',
        'note_interne',
        'type_activite',
        'type_activite_autre',
        'sujet_principal',
        'sujet_principal_autre',
        'public_cible',
        'medias_invites',
        'retransmission_radio',
        'duree_retransmission_heures',
        'nombre_participants',
        'nombre_femmes',
        'titre_groupe_utilisateur',
        'adresse_groupe_utilisateur',
        'nom_responsable_reunion',
        'adresse_responsable_reunion',
    ];

    // note_interne masquée par défaut (réservée réception en lecture/SG/admin),
    // révélée explicitement via ->makeVisible('note_interne') dans les
    // endpoints concernés du BookingController.
    protected $hidden = ['note_interne'];

    protected $casts = [
        'date_creation' => 'datetime',
        'date_debut' => 'datetime',
        'date_fin' => 'datetime',
        'retransmission_radio' => 'boolean',
        'duree_retransmission_heures' => 'decimal:2',
        'nombre_participants' => 'integer',
    ];

    protected $appends = ['statut_effectif'];

    public function salle()
    {
        return $this->belongsTo(Salle::class, 'id_salle');
    }

    public function client()
    {
        return $this->belongsTo(Utilisateur::class, 'id_client');
    }

    public function sg()
    {
        return $this->belongsTo(Utilisateur::class, 'id_sg');
    }

    public function paiement()
    {
        return $this->hasOne(Paiement::class, 'id_reservation');
    }

    public function services()
    {
        return $this->hasMany(ReservationService::class, 'id_reservation');
    }

    /**
     * Statut stocké en base : en_attente, validee, confirmee, terminee, annulee.
     *
     * "terminee" est un statut réel en base (à faire basculer par une tâche
     * planifiée quand date_fin est dépassée sur une réservation confirmee) ;
     * "en_cours" reste purement calculé, il n'existe jamais en base : c'est
     * un état transitoire entre confirmee et terminee.
     */
    public function getStatutEffectifAttribute()
    {
        if (!in_array($this->statut, ['confirmee', 'terminee'])) {
            return $this->statut;
        }

        $now = now();

        if ($now->lt($this->date_debut)) {
            return 'confirmee';
        }

        if ($now->between($this->date_debut, $this->date_fin)) {
            return 'en_cours';
        }

        return 'terminee';
    }
}