<?php

use Illuminate\Support\Facades\Route;
use App\Models\Salle;

Route::get('/test-db', function () {
    $salles = Salle::take(5)->get();
    return response()->json($salles);
});
Route::get('/', function () {
    return view('welcome');
});
