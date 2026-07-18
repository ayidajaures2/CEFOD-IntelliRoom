/** Persistance de session (token Sanctum + utilisateur courant). */
const TOKEN_KEY = "cefod_token";
const USER_KEY = "cefod_user";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
export const setStoredUser = (user) =>
  localStorage.setItem(USER_KEY, JSON.stringify(user));

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
