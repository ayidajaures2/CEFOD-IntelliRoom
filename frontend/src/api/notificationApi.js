import api from "./client";
import { ENDPOINTS } from "./endpoints";

/**
 * Seuls les rôles client et admin ont des routes de notifications
 * dans api.php : pour les autres on renvoie une liste vide sans
 * appel réseau (la cloche reste simplement vide).
 */
export const fetchNotifications = () => {
  const path = ENDPOINTS.notifications.list();
  return path ? api.get(path) : Promise.resolve({ data: [] });
};

export const markNotificationRead = (id) => api.put(ENDPOINTS.notifications.read(id));

/** Pas de route "tout marquer lu" côté backend : on boucle sur les ids. */
export const markAllNotificationsRead = (ids = []) =>
  Promise.allSettled(ids.map((id) => markNotificationRead(id)));
