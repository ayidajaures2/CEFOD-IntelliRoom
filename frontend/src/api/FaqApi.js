import api from "./client";
import { ENDPOINTS } from "./endpoints";

/**
 * API d'administration de la FAQ.
 * - fetchAdminFaq  : GET  /admin/faq         → renvoie un tableau brut Faq::all()
 * - createFaq      : POST /admin/faq         → renvoie la FAQ créée (201)
 * - updateFaq      : PUT  /admin/faq/{id}    → renvoie la FAQ mise à jour
 * - deleteFaq      : DELETE /admin/faq/{id}  → renvoie {message}
 */
export const fetchAdminFaq = () => api.get(ENDPOINTS.admin.faq);
export const createFaq = (payload) => api.post(ENDPOINTS.admin.faq, payload);
export const updateFaqItem = (id, payload) => api.put(ENDPOINTS.admin.faqItem(id), payload);
export const deleteFaqItem = (id) => api.delete(ENDPOINTS.admin.faqItem(id));

/** Diffusion d'une notification à un rôle. */
export const broadcastNotification = (payload) =>
  api.post(ENDPOINTS.admin.notificationsBroadcast, payload);