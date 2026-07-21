<?php
// routes/api.php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ChatbotController;
use App\Http\Controllers\Api\ReceptionistController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\CashierController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfilePhotoController;
use App\Http\Controllers\Api\RoomPhotoController;
use Illuminate\Support\Facades\Route;

// ============================================
// ROUTES PUBLIQUES
// ============================================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Catalogue public
// ⚠ /rooms/occupation DOIT être déclarée AVANT /rooms/{id}
Route::get('/rooms', [RoomController::class, 'index']);
Route::get('/rooms/occupation', [RoomController::class, 'getOccupation']);
Route::get('/rooms/{id}', [RoomController::class, 'show']);

// Chatbot public
Route::get('/chatbot/faq', [ChatbotController::class, 'getFaq']);
Route::post('/chatbot/ask', [ChatbotController::class, 'ask']);


// ============================================
// ROUTES PROTÉGÉES (auth:sanctum)
// ============================================
Route::middleware('auth:sanctum')->group(function () {

    // ---- AUTH & PROFIL (tous les rôles) ----
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/profile/password', [AuthController::class, 'changePassword']);
    Route::delete('/profile', [AuthController::class, 'deleteAccount']);

    // Photo de profil (avatar) — self-service, tous rôles
    Route::post('/profile/photo', [ProfilePhotoController::class, 'update']);
    Route::delete('/profile/photo', [ProfilePhotoController::class, 'destroy']);

    // Notifications — communes à TOUS les rôles connectés
    Route::get('/notifications', [BookingController::class, 'getNotifications']);
    Route::put('/notifications/{id}/read', [BookingController::class, 'markNotificationAsRead']);


    // ============================================
    // CLIENT
    // ============================================
    Route::middleware('role:client')->prefix('client')->group(function () {
        Route::get('/dashboard', [ClientController::class, 'dashboard']);
        Route::get('/stats', [ClientController::class, 'getStats']);

        // Réservations
        Route::get('/bookings', [BookingController::class, 'clientBookings']);
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::get('/bookings/{id}', [BookingController::class, 'show']);
        Route::put('/bookings/{id}', [BookingController::class, 'update']);
        Route::delete('/bookings/{id}', [BookingController::class, 'cancel']);

        // Factures
        Route::get('/invoices', [InvoiceController::class, 'clientInvoices']);
        Route::get('/invoices/{id}/download', [InvoiceController::class, 'download']);

        // Notifications (dupliquées sous /client pour compat frontend)
        Route::get('/notifications', [BookingController::class, 'getNotifications']);
        Route::put('/notifications/{id}/read', [BookingController::class, 'markNotificationAsRead']);

        // Paiement en ligne
        Route::post('/payments/initiate', [PaymentController::class, 'initiateOnlinePayment']);
        Route::get('/payments/status/{transaction_id}', [PaymentController::class, 'checkPaymentStatus']);
        // ⚠ simulate DANS le groupe client (Auth::id() fiable → pas de faux 403)
        Route::post('/payments/simulate', [PaymentController::class, 'simulateOnlinePayment']);
    });


    // ============================================
    // RÉCEPTIONNISTE
    // ============================================
    Route::middleware('role:receptionniste')->prefix('receptionist')->group(function () {
        Route::get('/dashboard', [ReceptionistController::class, 'dashboard']);
        Route::get('/stats', [ReceptionistController::class, 'getStats']);
        Route::get('/chart-data', [ReceptionistController::class, 'getChartData']);
        Route::get('/occupancy-chart', [ReceptionistController::class, 'getOccupancyChart']);

        // Réservations
        Route::get('/bookings', [BookingController::class, 'receptionistBookings']);
        Route::get('/bookings/{id}', [BookingController::class, 'show']);
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::put('/bookings/{id}', [BookingController::class, 'update']);
        Route::delete('/bookings/{id}', [BookingController::class, 'cancel']);
        Route::put('/bookings/{id}/validate', [BookingController::class, 'validateBooking']);
        Route::put('/bookings/{id}/confirm', [BookingController::class, 'confirm']);

        // Factures
        Route::get('/invoices', [InvoiceController::class, 'receptionistInvoices']);
        Route::get('/invoices/{id}/download', [InvoiceController::class, 'download']);
        Route::post('/invoices/{id}/send-email', [InvoiceController::class, 'sendByEmail']);

        // Clients (créer une réservation au nom d'un client)
        Route::get('/clients', [ClientController::class, 'index']);
        Route::get('/clients/{id}', [ClientController::class, 'show']);
    });


    // ============================================
    // CAISSIER
    // ============================================
    Route::middleware('role:caissier')->prefix('cashier')->group(function () {
        Route::get('/dashboard', [CashierController::class, 'dashboard']);
        Route::get('/stats', [CashierController::class, 'getStats']);
        Route::get('/chart-by-mode', [CashierController::class, 'getChartByMode']);
        Route::get('/revenue-chart', [CashierController::class, 'getRevenueChart']);

        // Paiements — /history AVANT /{id}
        Route::get('/payments', [PaymentController::class, 'cashierPayments']);
        Route::get('/payments/history', [PaymentController::class, 'history']);
        Route::get('/payments/{id}', [PaymentController::class, 'show']);
        Route::post('/payments', [PaymentController::class, 'store']);
        Route::put('/payments/{id}/validate', [PaymentController::class, 'validatePayment']);
        Route::put('/payments/{id}/cancel', [PaymentController::class, 'cancel']);

        Route::post('/invoices', [InvoiceController::class, 'generateManually']);

        Route::get('/bookings', [BookingController::class, 'cashierBookings']);
        Route::get('/bookings/{id}', [BookingController::class, 'show']);
    });


    // ============================================
    // ADMIN
    // ============================================
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        // Dashboard & stats
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/dashboard-full', [AdminController::class, 'dashboardFull']);
        Route::get('/stats', [AdminController::class, 'getStats']);
        Route::get('/chart-data', [AdminController::class, 'getChartData']);
        Route::get('/occupancy-data', [AdminController::class, 'getOccupancyData']);
        Route::get('/revenue-data', [AdminController::class, 'getRevenueData']);
        Route::get('/bookings/recent', [AdminController::class, 'getRecentBookings']);
        Route::get('/users/recent', [AdminController::class, 'getRecentUsers']);

        // Salles (CRUD + tarifs + image)
        Route::get('/rooms', [RoomController::class, 'adminIndex']);
        Route::post('/rooms', [RoomController::class, 'store']);
        Route::get('/rooms/{id}', [RoomController::class, 'show']);
        Route::put('/rooms/{id}', [RoomController::class, 'update']);
        Route::delete('/rooms/{id}', [RoomController::class, 'destroy']);
        Route::get('/rooms/{id}/prices', [RoomController::class, 'getPrices']);
        Route::put('/rooms/{id}/prices', [RoomController::class, 'updatePrices']);
        // Photo de salle
        Route::post('/rooms/{id}/image', [RoomPhotoController::class, 'update']);
        Route::delete('/rooms/{id}/image', [RoomPhotoController::class, 'destroy']);

        // Utilisateurs
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::post('/users', [AdminController::class, 'storeUser']);
        Route::get('/users/{id}', [AdminController::class, 'getUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        Route::put('/users/{id}/role', [AdminController::class, 'updateUserRole']);

        // Réservations (supervision)
        Route::get('/bookings', [BookingController::class, 'adminIndex']);
        Route::get('/bookings/{id}', [BookingController::class, 'show']);
        Route::put('/bookings/{id}', [BookingController::class, 'update']);
        Route::delete('/bookings/{id}', [BookingController::class, 'adminCancel']);

        // Paiements (supervision)
        Route::get('/payments', [PaymentController::class, 'adminIndex']);
        Route::get('/payments/{id}', [PaymentController::class, 'show']);

        // Factures (supervision)
        Route::get('/invoices', [InvoiceController::class, 'adminIndex']);
        Route::get('/invoices/{id}', [InvoiceController::class, 'show']);

        // FAQ
        Route::get('/faq', [ChatbotController::class, 'adminGetFaq']);
        Route::post('/faq', [ChatbotController::class, 'storeFaq']);
        Route::put('/faq/{id}', [ChatbotController::class, 'updateFaq']);
        Route::delete('/faq/{id}', [ChatbotController::class, 'deleteFaq']);

        // Configuration
        Route::get('/settings', [AdminController::class, 'getSettings']);
        Route::put('/settings', [AdminController::class, 'updateSettings']);

        // Notifications (supervision + diffusion)
        Route::get('/notifications', [NotificationController::class, 'adminIndex']);
        Route::post('/notifications/broadcast', [NotificationController::class, 'broadcast']);
    });


    // ============================================
    // CHATBOT (protégé — clients connectés & personnel)
    // ============================================
    Route::post('/chatbot/conversation/start', [ChatbotController::class, 'startConversation']);
    Route::post('/chatbot/message', [ChatbotController::class, 'sendMessage']);
    Route::get('/chatbot/conversations', [ChatbotController::class, 'getConversations']);
    Route::get('/chatbot/conversations/{id}/messages', [ChatbotController::class, 'getMessages']);
    Route::delete('/chatbot/conversations/{id}', [ChatbotController::class, 'deleteConversation']);
});


// ============================================
// WEBHOOK (paiement en ligne — sans auth)
// ============================================
Route::post('/webhook/payment', [PaymentController::class, 'handleWebhook'])
    ->withoutMiddleware(['auth:sanctum']);


// ============================================
// ROUTE DE TEST
// ============================================
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});
