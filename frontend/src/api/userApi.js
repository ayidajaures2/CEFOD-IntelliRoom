import api from "./client";
import { ENDPOINTS } from "./endpoints";

/** Gestion des comptes — réservé au rôle admin (AdminController). */
export const fetchUsers = (params) => api.get(ENDPOINTS.admin.users, { params });
export const createUser = (payload) => api.post(ENDPOINTS.admin.users, payload);
export const updateUser = (id, payload) => api.put(ENDPOINTS.admin.user(id), payload);
export const deleteUser = (id) => api.delete(ENDPOINTS.admin.user(id));
export const updateUserRole = (id, role) => api.put(ENDPOINTS.admin.userRole(id), { role });
export const suspendUser = (id) => api.put(ENDPOINTS.admin.userSuspend(id));
export const reactivateUser = (id) => api.put(ENDPOINTS.admin.userReactivate(id));