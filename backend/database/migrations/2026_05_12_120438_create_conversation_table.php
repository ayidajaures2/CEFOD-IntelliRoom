<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversation', function (Blueprint $table) {
            $table->id('id_conversation');
            $table->foreignId('id_utilisateur')->nullable()->constrained('utilisateur', 'id_utilisateur');
            $table->timestamp('debut_conversation')->useCurrent();
            $table->timestamp('fin_conversation')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversation');
    }
};