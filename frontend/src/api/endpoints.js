/**
 * ============================================================
 * POINT DE CONFIGURATION UNIQUE des routes API.
 * Aligné au caractère près sur `backend/routes/api.php` (v21).
 *
 * Beaucoup de routes sont préfixées par le rôle connecté
 * (/client, /receptionist, /sg, /cashier, /accounting, /admin) : le
 * helper `rolePrefix()` lit le rôle en session et construit le bon
 * chemin automatiquement — les pages n'ont pas à s'en soucier.
 * ============================================================
 */
import { getStoredUser } from "../utils/storage";

const PREFIX_BY_ROLE = {
  client: "/client",
  receptionniste: "/receptionist",
  sg: "/sg",
  caissier: "/cashier",
  comptabilite: "/accounting",
  admin: "/admin",
};

export const rolePrefix = () => PREFIX_BY_ROLE[getStoredUser()?.role] ?? "/client";

export const ENDPOINTS = {
  auth: {
    register: "/register",
    login: "/login",
    logout: "/logout",
    me: "/me",
  },
  profile: {
    update: "/profile",            // PUT AuthController::updateProfile (email jamais accepté, immuable)
    password: "/profile/password", // PUT AuthController::changePassword
    photo: "/profile/photo",       // POST (upload) / DELETE (avatar)
  },

  rooms: {
    list: "/rooms",                            // public
    detail: (id) => `/rooms/${id}`,
    occupation: "/rooms/occupation",           // affichage temps réel (⚠ voir note ordre des routes)
    // Gestion (role:admin)
    adminList: "/admin/rooms",
    store: "/admin/rooms",
    update: (id) => `/admin/rooms/${id}`,
    destroy: (id) => `/admin/rooms/${id}`,
    prices: (id) => `/admin/rooms/${id}/prices`, // GET / PUT grille TarifSalle
    image: (id) => `/admin/rooms/${id}/image`,   // POST (upload) / DELETE
  },

  /** Catalogue des services annexes (vidéoprojecteur, sonorisation,
   * restauration...) — gestion réservée à l'admin. La retransmission radio
   * y apparaît normalement mais n'est JAMAIS proposée dans le formulaire de
   * réservation (voir bookings.store) : une seule saisie côté client
   * (oui/non + heures), traduite automatiquement en ligne facturable par
   * le backend. */
  services: {
    list: "/services", // public — catalogue avec tarifs, pour le formulaire de réservation
    adminList: "/admin/services",
    store: "/admin/services",
    detail: (id) => `/admin/services/${id}`,
    update: (id) => `/admin/services/${id}`,
    destroy: (id) => `/admin/services/${id}`,
    prices: (id) => `/admin/services/${id}/prices`, // GET / PUT
  },

  bookings: {
    // Le même chemin relatif existe pour chaque rôle : /{prefix}/bookings
    list: () => `${rolePrefix()}/bookings`,
    detail: (id) => `${rolePrefix()}/bookings/${id}`,
    store: () => `${rolePrefix()}/bookings`, // client / sg / admin uniquement
    update: (id) => `${rolePrefix()}/bookings/${id}`,
    cancel: (id) => `${rolePrefix()}/bookings/${id}`,      // DELETE
    // Validation — SG uniquement (plus la réceptionniste)
    validate: (id) => `/sg/bookings/${id}/validate`, // PUT
    // Confirmation manuelle — ADMIN uniquement, filet de rattrapage
    // exceptionnel (le chemin normal passe par la validation du paiement)
    confirm: (id) => `/admin/bookings/${id}/confirm`, // PUT
  },

  payments: {
    // Caisse — espèces UNIQUEMENT (référence obligatoire et unique, saisie
    // par l'agent, plus d'auto-génération)
    list: "/cashier/payments",
    store: "/cashier/payments",
    cancel: (id) => `/cashier/payments/${id}/cancel`,
    history: "/cashier/payments/history",
    // Comptabilité — chèque/virement (enregistrement ET validation), plus
    // la validation de TOUS les paiements manuels (y compris les espèces
    // encaissées par le caissier)
    storeManual: "/accounting/payments/manual",           // chèque/virement
    validate: (id) => `/accounting/payments/${id}/validate`,
    accountingCancel: (id) => `/accounting/payments/${id}/cancel`,
    accountingList: "/accounting/payments",
    accountingHistory: "/accounting/payments/history",
    // Client — paiement en ligne (Moov / Airtel), automatique de bout en bout
    initiate: "/client/payments/initiate",
    simulate: "/client/payments/simulate",
    status: (tx) => `/client/payments/status/${tx}`,
  },

  invoices: {
    // Consultation : admin/comptabilite/caissier/receptionniste (staff) +
    // client (les siennes). Téléchargement : admin/comptabilite + client
    // (les siennes) UNIQUEMENT — caissier/réceptionniste n'ont pas de route
    // de téléchargement (403 systématique côté backend, inutile de l'exposer).
    list: () => `${rolePrefix()}/invoices`,
    detail: (id) => `${rolePrefix()}/invoices/${id}`,
    adminDetail: (id) => `/admin/invoices/${id}`,
    download: (id) => `${rolePrefix()}/invoices/${id}/download`, // PDF DomPDF — client/admin/comptabilite uniquement
    sendEmail: (id) => `/accounting/invoices/${id}/send-email`,
    // Comptabilité / admin — outil de réparation exceptionnel (jamais le
    // chemin normal, qui génère automatiquement à la validation du paiement)
    generateManually: "/accounting/invoices/generate-manually",
    adminGenerateManually: "/admin/invoices/generate-manually",
    adminDelete: (id) => `/admin/invoices/${id}`, // DELETE
  },

  chatbot: {
    faq: "/chatbot/faq",   // public
    ask: "/chatbot/ask",   // public
    // Messagerie (auth:sanctum)
    start: "/chatbot/conversation/start",
    startForClient: "/chatbot/conversation/start-for-client", // staff uniquement
    send: "/chatbot/message",
    conversations: "/chatbot/conversations",
    messages: (id) => `/chatbot/conversations/${id}/messages`,
    destroy: (id) => `/chatbot/conversations/${id}`,
  },

  notifications: {
    // Routes communes à tous les rôles connectés.
    list: () => "/notifications",
    read: (id) => `/notifications/${id}/read`,
  },

  charts: {
    adminChart: "/admin/chart-data",
    adminOccupancy: "/admin/occupancy-data",
    adminRevenue: "/admin/revenue-data",
    adminRevenueMonthly: "/admin/revenue-monthly",
    receptionChart: "/receptionist/chart-data",
    receptionOccupancy: "/receptionist/occupancy-chart",
    sgChart: "/sg/chart-data",
    cashierByMode: "/cashier/chart-by-mode",
    cashierRevenue: "/cashier/revenue-chart",
    accountingByMode: "/accounting/chart-by-mode",
    accountingRevenue: "/accounting/revenue-chart",
    accountingInvoicesByYear: "/accounting/invoices-by-year",
  },

  /** Consultation seule (lecture) — orientation et contact client, pas de
   * CRUD (réservé admin). Même endpoint pour réception ET SG (deux pages
   * frontend distinctes, même besoin d'information). */
  receptionist: {
    clients: "/receptionist/clients",
    dashboard: "/receptionist/dashboard",
    stats: "/receptionist/stats",
    recentBookings: "/receptionist/bookings/recent",
  },

  sg: {
    clients: "/sg/clients",
    dashboard: "/sg/dashboard",
    stats: "/sg/stats",
    recentBookings: "/sg/bookings/recent",
  },

  cashier: {
    dashboard: "/cashier/dashboard",
    stats: "/cashier/stats",
  },

  accounting: {
    dashboard: "/accounting/dashboard",
    stats: "/accounting/stats",
    recentPayments: "/accounting/payments/recent",
  },

  admin: {
    users: "/admin/users",
    user: (id) => `/admin/users/${id}`,
    userRole: (id) => `/admin/users/${id}/role`,
    stats: "/admin/stats",
    chartData: "/admin/chart-data",
    occupancy: "/admin/occupancy-data",
    revenue: "/admin/revenue-data",
    recentBookings: "/admin/bookings/recent",
    recentUsers: "/admin/users/recent",
    settings: "/admin/settings",
    notifications: "/admin/notifications",
    notificationsBroadcast: "/admin/notifications/broadcast",
    faq: "/admin/faq",
    faqItem: (id) => `/admin/faq/${id}`,
    paymentValidate: (id) => `/admin/payments/${id}/validate`, // filet de rattrapage
    paymentCancel: (id) => `/admin/payments/${id}/cancel`,
  },
};