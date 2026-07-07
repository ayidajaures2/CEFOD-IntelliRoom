<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $table = 'message';
    protected $primaryKey = 'id_message';
    public $timestamps = false;

    protected $fillable = [
        'id_conversation',
        'contenu',
        'expediteur',
        'date_envoi'
    ];

    protected $casts = [
        'date_envoi' => 'datetime',
    ];

    public function conversation()
    {
        return $this->belongsTo(Conversation::class, 'id_conversation');
    }
}