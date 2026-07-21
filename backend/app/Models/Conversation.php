<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $table = 'conversation';
    protected $primaryKey = 'id_conversation';
    public $timestamps = false;

    protected $fillable = [
        'id_utilisateur',
        'debut_conversation',
        'fin_conversation'
    ];

    protected $casts = [
        'debut_conversation' => 'datetime',
        'fin_conversation' => 'datetime',
    ];

    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'id_conversation');
    }
}
