<?php
// routes/api.php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ChatbotController;
use App\Http\Controllers\Api\ReceptionistController; // ← AJOUTE CETTE LIGNE
use Illuminate\Support\Facades\Route;

// ============================================
// ROUTES PUBLIQUES
// ============================================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Catalogue public
Route::get('/rooms', [RoomController::class, 'index']);
Route::get('/rooms/{id}', [RoomController::class, 'show']);
Route::get('/rooms/occupation', [RoomController::class, 'getOccupation']);

// Chatbot public
Route::get('/chatbot/faq', [ChatbotController::class, 'getFaq']);
Route::post('/chatbot/ask', [ChatbotController::class, 'ask']);

// ============================================
// ROUTES PROTÉGÉES (auth:sanctum)
// ============================================
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/profile/password', [AuthController::class, 'changePassword']);
    Route::delete('/profile', [AuthController::class, 'deleteAccount']);

    // ============================================
    // CLIENT
    // ============================================
    Route::middleware('role:client')->prefix('client')->group(function () {
        Route::get('/bookings', [BookingController::class, 'clientBookings']);
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::get('/bookings/{id}', [BookingController::class, 'show']);
        Route::put('/bookings/{id}', [BookingController::class, 'update']);
        Route::delete('/bookings/{id}', [BookingController::class, 'cancel']);
        Route::get('/notifications', [BookingController::class, 'getNotifications']);
        Route::put('/notifications/{id}/read', [BookingController::class, 'markNotificationAsRead']);
    });

    // ============================================
    // RÉCEPTIONNISTE
    // ============================================
    Route::middleware('role:receptionniste')->prefix('receptionist')->group(function () {
        Route::get('/stats', [ReceptionistController::class, 'getStats']); // ← AJOUTÉ
        Route::get('/bookings', [BookingController::class, 'receptionistBookings']);
        Route::get('/chart-data', [ReceptionistController::class, 'getChartData']); // ← AJOUTÉ
        Route::put('/bookings/{id}/validate', [BookingController::class, 'validateBooking']);
        Route::delete('/bookings/{id}', [BookingController::class, 'cancel']);
    });

    // ============================================
    // ADMIN
    // ============================================
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/stats', [AdminController::class, 'getStats']);
        Route::get('/chart-data', [AdminController::class, 'getChartData']);
        Route::get('/occupancy-data', [AdminController::class, 'getOccupancyData']);
        Route::get('/revenue-data', [AdminController::class, 'getRevenueData']);
        Route::get('/bookings/recent', [AdminController::class, 'getRecentBookings']);
        Route::get('/users/recent', [AdminController::class, 'getRecentUsers']);

        // Salles
        Route::get('/rooms', [RoomController::class, 'adminIndex']);
        Route::post('/rooms', [RoomController::class, 'store']);
        Route::put('/rooms/{id}', [RoomController::class, 'update']);
        Route::delete('/rooms/{id}', [RoomController::class, 'destroy']);
        Route::get('/rooms/{id}/prices', [RoomController::class, 'getPrices']);
        Route::put('/rooms/{id}/prices', [RoomController::class, 'updatePrices']);

        // Utilisateurs
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::post('/users', [AdminController::class, 'storeUser']);
        Route::get('/users/{id}', [AdminController::class, 'getUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        Route::put('/users/{id}/role', [AdminController::class, 'updateUserRole']);

        // Réservations (supervision)
        Route::get('/bookings', [BookingController::class, 'adminIndex']);
        Route::delete('/bookings/{id}', [BookingController::class, 'adminCancel']);

        // FAQ
        Route::get('/faq', [ChatbotController::class, 'adminGetFaq']);
        Route::post('/faq', [ChatbotController::class, 'storeFaq']);
        Route::put('/faq/{id}', [ChatbotController::class, 'updateFaq']);
        Route::delete('/faq/{id}', [ChatbotController::class, 'deleteFaq']);
    });
});