import api from "./client";
import { ENDPOINTS } from "./endpoints";

// Admin
export const fetchAdminChart = () => api.get(ENDPOINTS.charts.adminChart);
export const fetchAdminOccupancy = () => api.get(ENDPOINTS.charts.adminOccupancy);
export const fetchAdminRevenue = () => api.get(ENDPOINTS.charts.adminRevenue);
// Réception
export const fetchReceptionChart = () => api.get(ENDPOINTS.charts.receptionChart);
export const fetchReceptionOccupancy = () => api.get(ENDPOINTS.charts.receptionOccupancy);
// Caisse
export const fetchCashierByMode = () => api.get(ENDPOINTS.charts.cashierByMode);
export const fetchCashierRevenue = () => api.get(ENDPOINTS.charts.cashierRevenue);
