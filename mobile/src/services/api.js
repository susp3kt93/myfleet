import axios from 'axios';
import storage from '../utils/storage';
import { Platform } from 'react-native';

// Use localhost for web, network IP for mobile devices
const API_URL = Platform.OS === 'web'
    ? 'http://localhost:3002/api'
    : 'http://192.168.1.243:3002/api';

console.log('[API] Using API URL:', API_URL);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const token = await storage.getItemAsync('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid, clear storage
            await storage.deleteItemAsync('authToken');
            await storage.deleteItemAsync('user');
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (personalId, password) =>
        api.post('/auth/login', { personalId, password }),

    getMe: () =>
        api.get('/auth/me'),

    logout: () =>
        api.post('/auth/logout'),
};

export const tasksAPI = {
    getTasks: (params) =>
        api.get('/tasks', { params }),

    getTask: (id) =>
        api.get(`/tasks/${id}`),

    acceptTask: (id) =>
        api.post(`/tasks/${id}/accept`),

    rejectTask: (id) =>
        api.post(`/tasks/${id}/reject`),

    completeTask: (id) =>
        api.post(`/tasks/${id}/complete`),

    cancelTask: (id) =>
        api.post(`/tasks/${id}/cancel`),

    updateTask: (id, data) =>
        api.put(`/tasks/${id}`, data),
};

export const usersAPI = {
    getUsers: () =>
        api.get('/users'),

    getUser: (id) =>
        api.get(`/users/${id}`),

    createUser: (data) =>
        api.post('/users', data),

    updateUser: (id, data) =>
        api.put(`/users/${id}`, data),

    deleteUser: (id) =>
        api.delete(`/users/${id}`),
};

export default api;
