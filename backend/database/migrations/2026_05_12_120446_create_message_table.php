<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message', function (Blueprint $table) {
            $table->id('id_message');
            $table->foreignId('id_conversation')->constrained('conversation', 'id_conversation');
            $table->enum('expediteur', ['client', 'receptionniste', 'sg', 'caissier', 'comptabilite', 'admin', 'chatbot']);
            $table->text('contenu');
            $table->timestamp('date_envoi')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message');
    }
};
