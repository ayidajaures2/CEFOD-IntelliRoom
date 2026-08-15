import api from "./client";
import { ENDPOINTS } from "./endpoints";

/** Catalogue public (avec tarifs) — pour le formulaire de réservation. */
export const fetchServices = () => api.get(ENDPOINTS.services.list);

// Admin — gestion du catalogue
export const fetchAdminServices = (params) => api.get(ENDPOINTS.services.adminList, { params });
export const createService = (payload) => api.post(ENDPOINTS.services.store, payload);
export const updateService = (id, payload) => api.put(ENDPOINTS.services.update(id), payload);
export const deleteService = (id) => api.delete(ENDPOINTS.services.destroy(id));
export const updateServicePrices = (id, tarifs) => api.put(ENDPOINTS.services.prices(id), { tarifs });