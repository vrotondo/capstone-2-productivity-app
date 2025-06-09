import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
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
};

export const dashboardAPI = {
    getData: () => api.get('/dashboard'),
    convertCurrency: (from, to, amount) => api.get(`/convert/${from}/${to}/${amount}`),
};

export const healthCheck = () => api.get('/health');

export default api;