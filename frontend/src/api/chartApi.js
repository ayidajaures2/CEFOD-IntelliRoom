import api from "./client";
import { ENDPOINTS } from "./endpoints";

// Admin
export const fetchAdminChart = () => api.get(ENDPOINTS.charts.adminChart);
export const fetchAdminOccupancy = () => api.get(ENDPOINTS.charts.adminOccupancy);
export const fetchAdminRevenue = () => api.get(ENDPOINTS.charts.adminRevenue);
export const fetchAdminRevenueMonthly = () => api.get(ENDPOINTS.charts.adminRevenueMonthly);
// Réception
export const fetchReceptionChart = () => api.get(ENDPOINTS.charts.receptionChart);
export const fetchReceptionOccupancy = () => api.get(ENDPOINTS.charts.receptionOccupancy);
// SG
export const fetchSgChart = () => api.get(ENDPOINTS.charts.sgChart);
// Caisse
export const fetchCashierByMode = () => api.get(ENDPOINTS.charts.cashierByMode);
export const fetchCashierRevenue = () => api.get(ENDPOINTS.charts.cashierRevenue);
// Comptabilité
export const fetchAccountingByMode = () => api.get(ENDPOINTS.charts.accountingByMode);
export const fetchAccountingRevenue = () => api.get(ENDPOINTS.charts.accountingRevenue);
export const fetchAccountingInvoicesByYear = () => api.get(ENDPOINTS.charts.accountingInvoicesByYear);