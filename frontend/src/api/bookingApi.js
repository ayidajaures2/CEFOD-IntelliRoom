import api from "./client";
import { ENDPOINTS } from "./endpoints";

/* Le chemin est résolu selon le rôle connecté (rolePrefix). */
export const fetchMyBookings = () => api.get(ENDPOINTS.bookings.list());
export const fetchAllBookings = (params) => api.get(ENDPOINTS.bookings.list(), { params });
export const fetchBooking = (id) => api.get(ENDPOINTS.bookings.detail(id));
export const createBooking = (payload) => api.post(ENDPOINTS.bookings.store(), payload);
export const updateBooking = (id, payload) => api.put(ENDPOINTS.bookings.update(id), payload);
export const cancelBooking = (id) => api.delete(ENDPOINTS.bookings.cancel(id));

// Réceptionniste
export const validateBooking = (id) => api.put(ENDPOINTS.bookings.validate(id));
export const confirmBooking = (id) => api.put(ENDPOINTS.bookings.confirm(id));
export const rejectBooking = (id) => api.delete(ENDPOINTS.bookings.cancel(id));
