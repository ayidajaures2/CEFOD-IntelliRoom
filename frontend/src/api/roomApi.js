import api from "./client";
import { ENDPOINTS } from "./endpoints";

export const fetchRooms = (params) => api.get(ENDPOINTS.rooms.list, { params });
export const fetchRoom = (id) => api.get(ENDPOINTS.rooms.detail(id));
export const fetchOccupation = () => api.get(ENDPOINTS.rooms.occupation);

// Administration
export const fetchAdminRooms = () => api.get(ENDPOINTS.rooms.adminList);
export const createRoom = (payload) => api.post(ENDPOINTS.rooms.store, payload);
export const updateRoom = (id, payload) => api.put(ENDPOINTS.rooms.update(id), payload);
export const deleteRoom = (id) => api.delete(ENDPOINTS.rooms.destroy(id));
export const fetchRoomPrices = (id) => api.get(ENDPOINTS.rooms.prices(id));
export const updateRoomPrices = (id, tarifs) => api.put(ENDPOINTS.rooms.prices(id), { tarifs });
