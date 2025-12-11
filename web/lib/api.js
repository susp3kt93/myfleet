import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
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
    (error) => {
        if (typeof window !== 'undefined' && error.response?.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = '/';
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

    createTask: (data) =>
        api.post('/tasks', data),

    updateTask: (id, data) =>
        api.put(`/tasks/${id}`, data),

    acceptTask: (id) =>
        api.post(`/tasks/${id}/accept`),

    rejectTask: (id) =>
        api.post(`/tasks/${id}/reject`),

    completeTask: (id) =>
        api.post(`/tasks/${id}/complete`),

    cancelTask: (id) =>
        api.post(`/tasks/${id}/cancel`),

    deleteTask: (id) =>
        api.delete(`/tasks/${id}`),
};

export const usersAPI = {
    getUsers: () => api.get('/users'),

    createUser: (userData) => api.post('/users', userData),

    updateUser: (id, updates) => api.put(`/users/${id}`, updates),

    deleteUser: (id) => api.delete(`/users/${id}`),
};

export default api;
