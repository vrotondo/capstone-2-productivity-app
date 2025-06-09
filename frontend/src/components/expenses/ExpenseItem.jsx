import Button from '../common/Button';
import './ExpenseItem.css';

function ExpenseItem({ expense, categories, onEdit, onDelete }) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getCategoryInfo = (categoryId) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category || { name: 'Unknown', color: '#6B7280' };
    };

    const categoryInfo = getCategoryInfo(expense.category_id);

    return (
        <div className="expense-item">
            <div className="expense-item__main">
                <div className="expense-item__category">
                    <div
                        className="expense-item__category-color"
                        style={{ backgroundColor: categoryInfo.color }}
                    ></div>
                    <span className="expense-item__category-name">
                        {categoryInfo.name}
                    </span>
                </div>

                <div className="expense-item__details">
                    <h4 className="expense-item__description">
                        {expense.description}
                    </h4>
                    <div className="expense-item__meta">
                        <span className="expense-item__date">
                            {formatDate(expense.date)}
                        </span>
                        {expense.currency !== 'USD' && (
                            <span className="expense-item__currency">
                                {expense.currency}
                            </span>
                        )}
                    </div>
                </div>

                <div className="expense-item__amount">
                    <span className="expense-item__amount-value">
                        ${expense.amount.toFixed(2)}
                    </span>
                </div>
            </div>

            <div className="expense-item__actions">
                <Button
                    variant="ghost"
                    size="small"
                    onClick={() => onEdit(expense)}
                >
                    Edit
                </Button>
                <Button
                    variant="danger"
                    size="small"
                    onClick={() => onDelete(expense.id)}
                >
                    Delete
                </Button>
            </div>
        </div>
    );
}

export default ExpenseItem;