import { Link } from 'react-router-dom';
import Button from '../common/Button';
import './RecentExpenses.css';

function RecentExpenses({ expenses, onRefresh }) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="recent-expenses">
            <div className="recent-expenses__header">
                <h3>Recent Expenses</h3>
                <div className="recent-expenses__actions">
                    <Button variant="ghost" size="small" onClick={onRefresh}>
                        Refresh
                    </Button>
                    <Link to="/expenses">
                        <Button variant="secondary" size="small">
                            View All
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="recent-expenses__content">
                {expenses && expenses.length > 0 ? (
                    <div className="recent-expenses__list">
                        {expenses.map(expense => (
                            <div key={expense.id} className="recent-expense-item">
                                <div className="recent-expense-item__main">
                                    <div
                                        className="recent-expense-item__category-color"
                                        style={{ backgroundColor: expense.category_color || '#6B7280' }}
                                    ></div>

                                    <div className="recent-expense-item__details">
                                        <h4 className="recent-expense-item__description">
                                            {expense.description}
                                        </h4>
                                        <div className="recent-expense-item__meta">
                                            <span className="recent-expense-item__category">
                                                {expense.category_name}
                                            </span>
                                            <span className="recent-expense-item__date">
                                                {formatDate(expense.date)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="recent-expense-item__amount">
                                    ${expense.amount.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="recent-expenses__empty">
                        <p>No recent expenses</p>
                        <Link to="/expenses">
                            <Button variant="primary" size="small">
                                Add Your First Expense
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RecentExpenses;