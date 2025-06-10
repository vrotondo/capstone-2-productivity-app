import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
        return config;
    },
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Handle responses and errors
api.interceptors.response.use(
    (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`, response.data);
        return response;
    },
    (error) => {
        console.error('API Response Error:', error);
        console.error('Error Details:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            url: error.config?.url
        });

        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// API Functions
export const authAPI = {
    register: (userData) => api.post('/register', userData),
    login: (credentials) => api.post('/login', credentials),
    getProfile: () => api.get('/profile'),
};

export const expensesAPI = {
    getAll: () => api.get('/expenses'),
    create: (expenseData) => api.post('/expenses', expenseData),
    update: (id, expenseData) => api.put(`/expenses/${id}`, expenseData),
    delete: (id) => api.delete(`/expenses/${id}`),
};

export const categoriesAPI = {
    getAll: () => api.get('/categories'),
    create: (categoryData) => api.post('/categories', categoryData),
    createDefaults: () => {
        console.log('API: Calling create-defaults endpoint');
        // Send empty JSON object to ensure proper Content-Type
        return api.post('/categories/create-defaults', {});
    },
};

export const dashboardAPI = {
    getData: () => api.get('/dashboard'),
    convertCurrency: (from, to, amount) => api.get(`/convert/${from}/${to}/${amount}`),
};

export const healthCheck = () => api.get('/health');

export default api;