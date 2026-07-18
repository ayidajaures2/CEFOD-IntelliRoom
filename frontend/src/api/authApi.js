import api from "./client";
import { ENDPOINTS } from "./endpoints";

/**
 * Le rôle n'est JAMAIS envoyé à l'inscription : il est forcé à `client`
 * côté serveur (faille corrigée — CLAUDE.md §5).
 * `categorie_client` est obligatoire (grille tarifaire).
 */
export const register = (payload) => {
  const { nom, prenom, email, telephone, password, password_confirmation, categorie_client } = payload;
  return api.post(ENDPOINTS.auth.register, {
    nom, prenom, email, telephone, password, password_confirmation, categorie_client,
  });
};

export const login = (credentials) => api.post(ENDPOINTS.auth.login, credentials);
export const logout = () => api.post(ENDPOINTS.auth.logout);
export const fetchMe = () => api.get(ENDPOINTS.auth.me);
export const updateProfile = (payload) => api.put(ENDPOINTS.profile.update, payload);
/**
 * AuthController::changePassword attend oldPassword / newPassword /
 * newPassword_confirmation — on mappe ici depuis les noms du formulaire.
 */
export const updatePassword = ({ current_password, password, password_confirmation }) =>
  api.put(ENDPOINTS.profile.password, {
    oldPassword: current_password,
    newPassword: password,
    newPassword_confirmation: password_confirmation,
  });
