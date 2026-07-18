/**
 * ============================================================
 * POINT DE CONFIGURATION UNIQUE des routes API.
 * Aligné au caractère près sur `backend/routes/api.php`.
 *
 * Beaucoup de routes sont préfixées par le rôle connecté
 * (/client, /receptionist, /cashier, /admin) : le helper
 * `rolePrefix()` lit le rôle en session et construit le bon
 * chemin automatiquement — les pages n'ont pas à s'en soucier.
 * ============================================================
 */
import { getStoredUser } from "../utils/storage";

const PREFIX_BY_ROLE = {
  client: "/client",
  receptionniste: "/receptionist",
  caissier: "/cashier",
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
    update: "/profile",            // PUT AuthController::updateProfile
    password: "/profile/password", // PUT AuthController::changePassword
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
  },

  bookings: {
    // Le même chemin relatif existe pour chaque rôle : /{prefix}/bookings
    list: () => `${rolePrefix()}/bookings`,
    detail: (id) => `${rolePrefix()}/bookings/${id}`,
    store: () => `${rolePrefix()}/bookings`,
    update: (id) => `${rolePrefix()}/bookings/${id}`,
    cancel: (id) => `${rolePrefix()}/bookings/${id}`,      // DELETE
    // Actions réceptionniste
    validate: (id) => `/receptionist/bookings/${id}/validate`, // PUT
    confirm: (id) => `/receptionist/bookings/${id}/confirm`,   // PUT
  },

  payments: {
    // Caisse
    list: "/cashier/payments",
    store: "/cashier/payments",                      // paiement présentiel (espèces…)
    validate: (id) => `/cashier/payments/${id}/validate`,
    cancel: (id) => `/cashier/payments/${id}/cancel`,
    history: "/cashier/payments/history",
    // Client — paiement en ligne (Moov / Airtel)
    initiate: "/client/payments/initiate",
    status: (tx) => `/client/payments/status/${tx}`,
  },

  invoices: {
    list: () => `${rolePrefix()}/invoices`,               // client / receptionist / admin
    adminDetail: (id) => `/admin/invoices/${id}`,
    download: (id) => `${rolePrefix()}/invoices/${id}/download`, // PDF DomPDF (client & réception)
    sendEmail: (id) => `/receptionist/invoices/${id}/send-email`,
  },

  chatbot: {
    faq: "/chatbot/faq",   // public
    ask: "/chatbot/ask",   // public
    // Messagerie (auth:sanctum)
    start: "/chatbot/conversation/start",
    send: "/chatbot/message",
    conversations: "/chatbot/conversations",
    messages: (id) => `/chatbot/conversations/${id}/messages`,
    destroy: (id) => `/chatbot/conversations/${id}`,
  },

  notifications: {
    // Routes communes à tous les rôles connectés (api.php v3).
    list: () => "/notifications",
    read: (id) => `/notifications/${id}/read`,
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
    settings: "/admin/settings",
    faq: "/admin/faq",
    faqItem: (id) => `/admin/faq/${id}`,
  },
};
