// frontend/src/api/authApi.js
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

export const register = async (userData) => {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
};

export const login = async (credentials) => {
    const response = await axios.post(`${API_URL}/login`, credentials);
    return response.data;
};

export const logout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
        await axios.post(`${API_URL}/logout`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }
};

export const getMe = async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token');
    const response = await axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};