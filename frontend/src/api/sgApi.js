import api from "./client";
import { ENDPOINTS } from "./endpoints";

/** Consultation des clients — réservé au SG (SgController). Lecture seule,
 * même donnée que ENDPOINTS.receptionist.clients mais chemin dédié (le SG
 * a besoin du même niveau d'information au moment de valider une demande). */
export const fetchSgClients = (params) => api.get(ENDPOINTS.sg.clients, { params });