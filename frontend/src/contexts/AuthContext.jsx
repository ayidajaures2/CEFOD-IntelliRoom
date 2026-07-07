// src/contexts/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/me')
        .then(res => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    console.log('🟢 [AuthContext] login appelé avec:', { email, password });
    
    try {
      const response = await axios.post('/api/login', { email, password });
      console.log('🟢 [AuthContext] Réponse reçue:', response.status, response.data);
      
      // ✅ CORRECTION: Récupère les données correctement
      const data = response.data;
      
      // ✅ Vérifie que data contient bien user et token
      if (!data.user || !data.token) {
        console.error('🔴 [AuthContext] Données manquantes:', data);
        return { success: false, error: 'Données de connexion incomplètes' };
      }
      
      const { token, user } = data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      console.log('🟢 [AuthContext] Connexion réussie, user:', user);
      
      return { success: true, user };
    } catch (error) {
      console.error('🔴 [AuthContext] Erreur:', error.response?.status, error.response?.data);
      return { success: false, error: error.response?.data?.message || 'Erreur de connexion' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/register', userData);
      const data = response.data;
      
      if (!data.user || !data.token) {
        console.error('🔴 [AuthContext] Données d\'inscription manquantes:', data);
        return { success: false, error: "Données d'inscription incomplètes" };
      }
      
      const { token, user } = data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      console.error('🔴 [AuthContext] Erreur inscription:', error);
      return { success: false, error: error.response?.data?.message || "Erreur d'inscription" };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/logout');
    } catch (e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = { 
    user, 
    loading, 
    login, 
    register,
    logout, 
    updateUser 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};