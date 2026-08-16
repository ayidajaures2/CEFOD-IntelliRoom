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
use App\Http\Controllers\Api\SgController;
use App\Http\Controllers\Api\ComptabiliteController;
use App\Http\Controllers\Api\ServiceController;
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

// Catalogue public des services annexes (vidéoprojecteur, sonorisation,
// restauration, retransmission radio...) — nécessaire pour que le formulaire
// de réservation propose les services et leurs tarifs.
Route::get('/services', [ServiceController::class, 'index']);


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

        // Réservations (les champs fiche papier + services annexes passent
        // dans le même payload que store(), gérés par BookingController)
        Route::get('/bookings', [BookingController::class, 'clientBookings']);
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::get('/bookings/{id}', [BookingController::class, 'show']);
        Route::put('/bookings/{id}', [BookingController::class, 'update']);
        Route::delete('/bookings/{id}', [BookingController::class, 'cancel']);

        // Factures — consultation + téléchargement (les siennes uniquement,
        // vérifié dans le contrôleur par appartenance)
        Route::get('/invoices', [InvoiceController::class, 'clientInvoices']);
        Route::get('/invoices/{id}', [InvoiceController::class, 'showClientInvoice']);
        Route::get('/invoices/{id}/download', [InvoiceController::class, 'download']);

        // Notifications (dupliquées sous /client pour compat frontend)
        Route::get('/notifications', [BookingController::class, 'getNotifications']);
        Route::put('/notifications/{id}/read', [BookingController::class, 'markNotificationAsRead']);

        // Paiement en ligne (Moov / Airtel) — automatique de bout en bout
        Route::post('/payments/initiate', [PaymentController::class, 'initiateOnlinePayment']);
        Route::get('/payments/status/{transaction_id}', [PaymentController::class, 'checkPaymentStatus']);
        Route::post('/payments/simulate', [PaymentController::class, 'simulateOnlinePayment']);
    });


    // ============================================
    // RÉCEPTIONNISTE — rôle réduit : orientation, messagerie, lecture seule
    // ============================================
    Route::middleware('role:receptionniste')->prefix('receptionist')->group(function () {
        Route::get('/dashboard', [ReceptionistController::class, 'dashboard']);
        Route::get('/stats', [ReceptionistController::class, 'getStats']);
        Route::get('/chart-data', [ReceptionistController::class, 'getChartData']);
        Route::get('/occupancy-chart', [ReceptionistController::class, 'getOccupancyChart']);

        // Réservations : LECTURE SEULE. Plus de store/update/validate/confirm —
        // c'est le SG qui valide désormais (voir groupe sg ci-dessous).
        Route::get('/bookings', [BookingController::class, 'receptionistBookings']);
        Route::get('/bookings/{id}', [BookingController::class, 'show']);

        // Factures : consultation seule, jamais de téléchargement
        // (InvoiceController::canDownload() exclut receptionniste — pas la
        // peine d'exposer une route qui renverrait systématiquement 403).
        Route::get('/invoices', [InvoiceController::class, 'receptionistInvoices']);
        Route::get('/invoices/{id}', [InvoiceController::class, 'showClientInvoice']);

        // Clients — liste + détail, pour orientation et contact
        // (messagerie interne + lien WhatsApp câblés côté frontend à partir
        // du téléphone déjà renvoyé ici, pas de route supplémentaire requise)
        Route::get('/clients', [ClientController::class, 'index']);
        Route::get('/clients/{id}', [ClientController::class, 'show']);
    });


    // ============================================
    // SG — valide/refuse les demandes de réservation
    // ============================================
    Route::middleware('role:sg')->prefix('sg')->group(function () {
        // Dashboard & stats
        Route::get('/dashboard', [SgController::class, 'dashboard']);
        Route::get('/stats', [SgController::class, 'getStats']);
        Route::get('/chart-data', [SgController::class, 'getChartData']);
        Route::get('/bookings/recent', [SgController::class, 'getRecentBookings']);

        // Réservations
        Route::get('/bookings', [BookingController::class, 'sgBookings']);
        Route::get('/bookings/{id}', [BookingController::class, 'show']);
        Route::put('/bookings/{id}', [BookingController::class, 'update']);
        Route::delete('/bookings/{id}', [BookingController::class, 'cancel']);
        Route::put('/bookings/{id}/validate', [BookingController::class, 'validateBooking']);

        // Clients — même page que la réception (dupliquée côté frontend),
        // pour que le SG ait le même niveau d'information au moment de valider
        Route::get('/clients', [ClientController::class, 'index']);
        Route::get('/clients/{id}', [ClientController::class, 'show']);

        // Pas de route factures : le SG n'a ni consultation ni téléchargement
        // (InvoiceController::canView() l'exclut explicitement).
    });


    // ============================================
    // CAISSIER — encaisse le cash uniquement, ne valide rien
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
        // Espèces uniquement — référence obligatoire et unique (voir store())
        Route::post('/payments', [PaymentController::class, 'store']);
        // ⚠ CORRIGÉ : pointait vers PaymentController::cancel, qui n'existe
        // pas (la méthode réelle s'appelle cancelPayment) — 500 garanti au
        // premier appel. Le caissier peut annuler SON encaissement tant
        // qu'il n'est pas encore validé par la comptabilité.
        Route::put('/payments/{id}/cancel', [PaymentController::class, 'cancelPayment']);
        // ⚠ RETIRÉ : /payments/{id}/validate — la validation est une action
        // de la comptabilité, jamais du caissier (voir groupe comptabilite).

        // Factures : consultation seule (jamais de génération manuelle ni de
        // téléchargement — réservés à la comptabilité/admin désormais).
        Route::get('/invoices', [InvoiceController::class, 'receptionistInvoices']);
        Route::get('/invoices/{id}', [InvoiceController::class, 'showClientInvoice']);

        Route::get('/bookings', [BookingController::class, 'cashierBookings']);
        Route::get('/bookings/{id}', [BookingController::class, 'show']);
    });


    // ============================================
    // COMPTABILITÉ — valide tous les paiements manuels, gère chèque/virement,
    // seule habilitée (avec l'admin) à télécharger les factures
    // ============================================
    Route::middleware('role:comptabilite')->prefix('accounting')->group(function () {
        // Dashboard & stats
        Route::get('/dashboard', [ComptabiliteController::class, 'dashboard']);
        Route::get('/stats', [ComptabiliteController::class, 'getStats']);
        Route::get('/chart-by-mode', [ComptabiliteController::class, 'getChartByMode']);
        Route::get('/revenue-chart', [ComptabiliteController::class, 'getRevenueChart']);
        Route::get('/invoices-by-year', [ComptabiliteController::class, 'getInvoicesByYear']);
        Route::get('/payments/recent', [ComptabiliteController::class, 'getRecentPayments']);

        // Paiements — /history AVANT /{id}
        Route::get('/payments', [PaymentController::class, 'cashierPayments']);
        Route::get('/payments/history', [PaymentController::class, 'history']);
        Route::get('/payments/{id}', [PaymentController::class, 'show']);
        // Chèque / virement — la comptabilité enregistre elle-même, jamais le
        // caissier ; référence obligatoire et unique (voir storeManual())
        Route::post('/payments/manual', [PaymentController::class, 'storeManual']);
        // Validation — exige le statut encaisse (espèces/chèque/virement),
        // confirme la réservation et génère la facture automatiquement
        Route::put('/payments/{id}/validate', [PaymentController::class, 'validatePayment']);
        Route::put('/payments/{id}/cancel', [PaymentController::class, 'cancelPayment']);

        // Factures — consultation ET téléchargement
        Route::get('/invoices', [InvoiceController::class, 'receptionistInvoices']);
        Route::get('/invoices/{id}', [InvoiceController::class, 'showClientInvoice']);
        Route::get('/invoices/{id}/download', [InvoiceController::class, 'download']);
        Route::post('/invoices/{id}/send-email', [InvoiceController::class, 'sendByEmail']);
        // Outil de réparation exceptionnel (paiement valide sans facture) —
        // jamais le chemin normal, qui génère automatiquement à la validation
        Route::post('/invoices/generate-manually', [InvoiceController::class, 'generateManually']);

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
        Route::get('/revenue-monthly', [AdminController::class, 'getRevenueMonthly']);
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
        Route::post('/rooms/{id}/image', [RoomPhotoController::class, 'update']);
        Route::delete('/rooms/{id}/image', [RoomPhotoController::class, 'destroy']);

        // Services annexes (CRUD + tarifs) — vidéoprojecteur, sonorisation,
        // restauration, retransmission radio...
        Route::get('/services', [ServiceController::class, 'adminIndex']);
        Route::post('/services', [ServiceController::class, 'store']);
        Route::get('/services/{id}', [ServiceController::class, 'show']);
        Route::put('/services/{id}', [ServiceController::class, 'update']);
        Route::delete('/services/{id}', [ServiceController::class, 'destroy']);
        Route::get('/services/{id}/prices', [ServiceController::class, 'getPrices']);
        Route::put('/services/{id}/prices', [ServiceController::class, 'updatePrices']);

        // Utilisateurs (storeUser/updateUser attendent désormais
        // sous_categorie_client, plus categorie_client)
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::post('/users', [AdminController::class, 'storeUser']);
        Route::get('/users/{id}', [AdminController::class, 'getUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        Route::put('/users/{id}/role', [AdminController::class, 'updateUserRole']);

        // Réservations (supervision complète)
        Route::get('/bookings', [BookingController::class, 'adminIndex']);
        Route::get('/bookings/{id}', [BookingController::class, 'show']);
        Route::put('/bookings/{id}', [BookingController::class, 'update']);
        Route::delete('/bookings/{id}', [BookingController::class, 'adminCancel']);
        // ✅ DÉPLACÉ depuis /receptionist : confirmation manuelle, filet de
        // rattrapage exceptionnel — le chemin normal passe par la validation
        // du paiement (PaymentController::validatePayment()).
        Route::put('/bookings/{id}/confirm', [BookingController::class, 'confirm']);

        // Paiements (supervision + capacité de validation en dernier recours)
        Route::get('/payments', [PaymentController::class, 'adminIndex']);
        Route::get('/payments/{id}', [PaymentController::class, 'show']);
        Route::put('/payments/{id}/validate', [PaymentController::class, 'validatePayment']);
        Route::put('/payments/{id}/cancel', [PaymentController::class, 'cancelPayment']);

        // Factures (supervision complète, consultation ET téléchargement)
        Route::get('/invoices', [InvoiceController::class, 'adminIndex']);
        Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
        Route::get('/invoices/{id}/download', [InvoiceController::class, 'download']);
        Route::delete('/invoices/{id}', [InvoiceController::class, 'deleteInvoice']);
        Route::post('/invoices/generate-manually', [InvoiceController::class, 'generateManually']);

        // FAQ
        Route::get('/faq', [ChatbotController::class, 'adminGetFaq']);
        Route::post('/faq', [ChatbotController::class, 'storeFaq']);
        Route::put('/faq/{id}', [ChatbotController::class, 'updateFaq']);
        Route::delete('/faq/{id}', [ChatbotController::class, 'deleteFaq']);

        // Configuration
        Route::get('/settings', [AdminController::class, 'getSettings']);
        Route::put('/settings', [AdminController::class, 'updateSettings']);

        // Notifications (supervision + diffusion — accepte désormais
        // role=sg et role=comptabilite dans le corps de la requête)
        Route::get('/notifications', [NotificationController::class, 'adminIndex']);
        Route::post('/notifications/broadcast', [NotificationController::class, 'broadcast']);
    });


    // ============================================
    // CHATBOT (protégé — clients connectés & personnel)
    // ============================================
    Route::post('/chatbot/conversation/start', [ChatbotController::class, 'startConversation']);
    Route::post('/chatbot/conversation/start-for-client', [ChatbotController::class, 'startConversationForClient']);
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