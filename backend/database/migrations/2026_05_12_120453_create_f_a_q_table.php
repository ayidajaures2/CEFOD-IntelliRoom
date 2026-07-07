<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('FAQ', function (Blueprint $table) {
            $table->id('id_faq');
            $table->text('question');
            $table->text('reponse');
            $table->enum('categorie', ['orientation', 'reservation', 'salle', 'general']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('FAQ');
    }
};