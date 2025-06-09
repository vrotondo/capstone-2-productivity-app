import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
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
                        <p>Start by adding your first expense!</p>
                        <Link to="/expenses">
                            <Button variant="primary">Add Expense</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;