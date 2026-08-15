import api from "./client";
import { ENDPOINTS } from "./endpoints";

/**
 * Les routes /notifications sont communes à TOUS les rôles connectés
 * (déclarées hors des groupes préfixés par rôle dans api.php) — donc
 * toujours un vrai appel réseau, y compris pour sg/comptabilite.
 */
export const fetchNotifications = () => api.get(ENDPOINTS.notifications.list());

export const markNotificationRead = (id) => api.put(ENDPOINTS.notifications.read(id));

/** Pas de route "tout marquer lu" côté backend : on boucle sur les ids. */
export const markAllNotificationsRead = (ids = []) =>
  Promise.allSettled(ids.map((id) => markNotificationRead(id)));