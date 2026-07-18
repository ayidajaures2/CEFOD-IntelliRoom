import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/authApi";
import {
  getToken, setToken, getStoredUser, setStoredUser, clearSession,
} from "../utils/storage";

export const AuthContext = createContext(null);

/** Tolère les deux formes de réponse Laravel : { utilisateur } ou { user }. */
const extractUser = (data) => data?.utilisateur ?? data?.user ?? data;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [initializing, setInitializing] = useState(Boolean(getToken()));

  // Revalide la session au chargement si un token existe déjà.
  useEffect(() => {
    if (!getToken()) return;
    let active = true;
    authApi
      .fetchMe()
      .then(({ data }) => {
        if (!active) return;
        const me = extractUser(data);
        setUser(me);
        setStoredUser(me);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => active && setInitializing(false));
    return () => { active = false; };
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    setToken(data.token ?? data.access_token);
    const me = extractUser(data);
    setUser(me);
    setStoredUser(me);
    return me;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload);
    setToken(data.token ?? data.access_token);
    const me = extractUser(data);
    setUser(me);
    setStoredUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* le token peut déjà être expiré */ }
    clearSession();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await authApi.fetchMe();
    const me = extractUser(data);
    setUser(me);
    setStoredUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({ user, role: user?.role ?? null, isAuthenticated: Boolean(user), initializing, login, register, logout, refreshUser, setUser }),
    [user, initializing, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
