import ExpenseItem from './ExpenseItem';
import './ExpenseList.css';

function ExpenseList({ expenses, categories, onEdit, onDelete }) {
    if (!expenses || expenses.length === 0) {
        return (
            <div className="expense-list expense-list--empty">
                <div className="empty-state">
                    <h3>No expenses found</h3>
                    <p>Start tracking your expenses by adding your first entry!</p>
                </div>
            </div>
        );
    }

    // Calculate total
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return (
        <div className="expense-list">
            <div className="expense-list__header">
                <h3>Expenses ({expenses.length})</h3>
                <div className="expense-list__total">
                    Total: <strong>${totalAmount.toFixed(2)}</strong>
                </div>
            </div>

            <div className="expense-list__items">
                {expenses.map(expense => (
                    <ExpenseItem
                        key={expense.id}
                        expense={expense}
                        categories={categories}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </div>
    );
}

export default ExpenseList;