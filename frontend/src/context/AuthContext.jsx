import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check if user is logged in on app start
    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            setLoading(true);
            const response = await authAPI.login({ email, password });
            const { access_token, user: userData } = response.data;

            // Save to localStorage
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(userData));

            // Update state
            setUser(userData);
            setIsAuthenticated(true);

            toast.success('Login successful!');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.error || 'Login failed';
            toast.error(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            setLoading(true);
            const response = await authAPI.register(userData);
            const { access_token, user: newUser } = response.data;

            // Save to localStorage
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(newUser));

            // Update state
            setUser(newUser);
            setIsAuthenticated(true);

            toast.success('Registration successful!');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.error || 'Registration failed';
            toast.error(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
        toast.success('Logged out successfully');
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}