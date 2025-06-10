import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, categoriesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import DashboardSummary from '../components/dashboard/DashboardSummary';
import RecentExpenses from '../components/dashboard/RecentExpenses';
import CategoryChart from '../components/dashboard/CategoryChart';
import toast from 'react-hot-toast';

function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creatingCategories, setCreatingCategories] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await dashboardAPI.getData();
            setDashboardData(response.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const createDefaultCategories = async () => {
        try {
            setCreatingCategories(true);
            console.log('=== FRONTEND: Creating default categories ===');

            const response = await categoriesAPI.createDefaults();
            console.log('Categories creation result:', response.data);

            toast.success('Default categories created successfully!');

            // Refresh dashboard to show new data
            await fetchDashboardData();

        } catch (error) {
            console.error('ERROR creating categories:', error);
            console.error('Error response:', error.response?.data);

            let errorMessage = 'Failed to create categories';
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        } finally {
            setCreatingCategories(false);
        }
    };

    const testDatabaseConnection = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/test-db');
            const data = await response.json();
            console.log('Database test result:', data);

            if (data.db_connection === 'OK') {
                toast.success(`Database OK! Tables: ${data.tables.join(', ')}`);
            } else {
                toast.error(`Database Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Database test error:', error);
            toast.error('Failed to test database connection');
        }
    };

    const testJwtToken = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/debug/token', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            console.log('JWT test result:', data);

            if (response.ok) {
                toast.success(`JWT Token Valid! User ID: ${data.user_id}`);
            } else {
                toast.error(`JWT Error: ${data.error}`);
            }
        } catch (error) {
            console.error('JWT test error:', error);
            toast.error('Failed to test JWT token');
        }
    };

    const testCategoriesWithoutJWT = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/test-categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            const data = await response.json();
            console.log('Test categories result:', data);

            if (response.ok) {
                toast.success('Categories test successful!');
                await fetchDashboardData();
            } else {
                toast.error(`Test failed: ${data.error}`);
            }
        } catch (error) {
            console.error('Test categories error:', error);
            toast.error('Test categories failed');
        }
    };

    const forceRelogin = () => {
        // Clear old token and force re-login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success('Logged out! Please log in again to get a fresh token.');
        window.location.href = '/login';
    };

    const debugUsers = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/debug/users');
            const data = await response.json();
            console.log('Users debug result:', data);

            if (response.ok) {
                toast.success(`Found ${data.total_users} users. Check console for details.`);
            } else {
                toast.error(`Debug failed: ${data.error}`);
            }
        } catch (error) {
            console.error('Debug users error:', error);
            toast.error('Failed to debug users');
        }
    };

    const testLogin = async () => {
        try {
            const email = prompt('Enter your email:');
            const password = prompt('Enter your password:');

            if (!email || !password) {
                toast.error('Email and password required');
                return;
            }

            const response = await fetch('http://localhost:5000/api/test-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('Test login result:', data);

            if (response.ok) {
                toast.success(`Login test successful! Password type: ${data.password_hash_type}`);
            } else {
                toast.error(`Login test failed: ${data.error}`);
            }
        } catch (error) {
            console.error('Test login error:', error);
            toast.error('Test login failed');
        }
    };

    const resetPassword = async () => {
        try {
            const email = prompt('Enter your email:');
            const password = prompt('Enter your new password:');

            if (!email || !password) {
                toast.error('Email and password required');
                return;
            }

            const response = await fetch('http://localhost:5000/api/debug/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('Password reset result:', data);

            if (response.ok) {
                toast.success('Password reset successful! You can now log in.');
            } else {
                toast.error(`Password reset failed: ${data.error}`);
            }
        } catch (error) {
            console.error('Password reset error:', error);
            toast.error('Password reset failed');
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading your dashboard..." />;
    }

    return (
        <div className="dashboard">
            <div className="dashboard__header">
                <div className="dashboard__title">
                    <h1>Welcome back, {user?.first_name}! 👋</h1>
                    <p>Here's your financial overview</p>
                </div>
                <div className="dashboard__actions">
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={createDefaultCategories}
                        loading={creatingCategories}
                        disabled={creatingCategories}
                    >
                        🏷️ Create Categories
                    </Button>
                    <Link to="/expenses">
                        <Button variant="primary">
                            📊 View All Expenses
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="dashboard__content">
                {dashboardData ? (
                    <>
                        <DashboardSummary data={dashboardData} />

                        <div className="dashboard__grid">
                            <div className="dashboard__section">
                                <RecentExpenses
                                    expenses={dashboardData.recent_expenses}
                                    onRefresh={fetchDashboardData}
                                />
                            </div>

                            <div className="dashboard__section">
                                <CategoryChart
                                    categoryData={dashboardData.category_breakdown}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="dashboard__empty">
                        <h3>No data available</h3>
                        <p>Start by creating your categories and adding your first expense!</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Button
                                variant="ghost"
                                onClick={testDatabaseConnection}
                            >
                                🔧 Test Database
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={testJwtToken}
                            >
                                🔑 Test JWT
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={testCategoriesWithoutJWT}
                            >
                                🧪 Test Categories
                            </Button>
                            <Button
                                variant="warning"
                                onClick={forceRelogin}
                            >
                                🔄 Force Re-login
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={createDefaultCategories}
                                loading={creatingCategories}
                                disabled={creatingCategories}
                            >
                                🏷️ Create Categories
                            </Button>
                            <Link to="/expenses">
                                <Button variant="primary">Add Expense</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;