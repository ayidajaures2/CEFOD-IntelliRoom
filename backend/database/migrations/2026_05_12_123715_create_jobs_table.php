<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('jobs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('queue')->index();
            $table->longText('payload');
            $table->tinyInteger('attempts')->unsigned();
            $table->integer('reserved_at')->nullable();
            $table->integer('available_at');
            $table->integer('created_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('jobs');
    }
};