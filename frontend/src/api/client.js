import axios from "axios";
import { getToken, clearSession } from "../utils/storage";

/**
 * Client HTTP unique de l'application.
 * - Base URL configurable via .env (VITE_API_URL)
 * - Injection automatique du token Sanctum (Bearer)
 * - Déconnexion propre sur 401
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
