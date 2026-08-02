import api from "./client";
import { ENDPOINTS } from "./endpoints";

/** Consultation des clients — réservé à la réception (ReceptionistController). Lecture seule. */
export const fetchClients = (params) => api.get(ENDPOINTS.receptionist.clients, { params });