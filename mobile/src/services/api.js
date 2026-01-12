import axios from 'axios';
import storage from '../utils/storage';
import { Platform } from 'react-native';

// Use environment variable if available, otherwise default to local development URL
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;

// Local development URL
const LOCAL_API_URL = 'http://localhost:3002/api';

// Use local URL for development (change to production URL for builds)
const API_URL = ENV_API_URL || LOCAL_API_URL;

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

    createTask: (data) =>
        api.post('/tasks', data),

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

    deleteTask: (id) =>
        api.delete(`/tasks/${id}`),
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

export const adminAPI = {
    getCompanyStats: (companyId) =>
        api.get(`/companies/${companyId}/stats`),

    getCompanies: () =>
        api.get('/companies'),

    getWeeklyReport: (startDate, endDate) =>
        api.get('/reports/weekly', { params: { startDate, endDate } }),
};

export const timeoffAPI = {
    getRequests: (params) =>
        api.get('/timeoff', { params }),

    createRequest: (requestDate, reason) =>
        api.post('/timeoff', { requestDate, reason }),

    cancelRequest: (id) =>
        api.delete(`/timeoff/${id}`),

    updateRequest: (id, data) =>
        api.put(`/timeoff/${id}`, data),

    approveRequest: (id) =>
        api.put(`/timeoff/${id}/approve`),

    rejectRequest: (id) =>
        api.put(`/timeoff/${id}/reject`),
};

export const deductionsAPI = {
    getDeductions: () =>
        api.get('/deductions'),

    createDeduction: (data) =>
        api.post('/deductions', data),

    updateDeduction: (id, data) =>
        api.put(`/deductions/${id}`, data),

    deleteDeduction: (id) =>
        api.delete(`/deductions/${id}`),
};

export const vehiclesAPI = {
    getVehicles: () =>
        api.get('/vehicles'),

    getVehicle: (id) =>
        api.get(`/vehicles/${id}`),

    assignDriver: (vehicleId, driverId) =>
        api.put(`/vehicles/${vehicleId}/assign`, { driverId }),

    updateMileage: (vehicleId, mileage) =>
        api.put(`/vehicles/${vehicleId}/mileage`, { mileage }),
};

export const reportsAPI = {
    getWeeklyReport: (startDate, endDate) =>
        api.get('/reports/weekly', { params: { startDate, endDate } }),

    exportCSV: (startDate, endDate) =>
        api.get('/reports/weekly/csv', { params: { startDate, endDate }, responseType: 'blob' }),
};

export const activityAPI = {
    getActivity: (params) =>
        api.get('/admin/activity', { params }),
};

export default api;

