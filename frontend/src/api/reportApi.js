import api from "./client";
import { ENDPOINTS } from "./endpoints";

/** Statistiques & rapports (AdminController). */
export const fetchStats = (params) => api.get(ENDPOINTS.admin.stats, { params });
export const fetchChartData = () => api.get(ENDPOINTS.admin.chartData);
export const fetchOccupancyData = () => api.get(ENDPOINTS.admin.occupancy);
export const fetchRevenueData = () => api.get(ENDPOINTS.admin.revenue);
export const fetchRecentBookings = () => api.get(ENDPOINTS.admin.recentBookings);
