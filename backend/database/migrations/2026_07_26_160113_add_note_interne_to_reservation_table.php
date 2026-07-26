<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservation', function (Blueprint $table) {
            $table->text('note_interne')->nullable()->after('statut');
        });
    }

    public function down(): void
    {
        Schema::table('reservation', function (Blueprint $table) {
            $table->dropColumn('note_interne');
        });
    }
};