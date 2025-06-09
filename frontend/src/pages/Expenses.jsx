import { useState, useEffect } from 'react';
import { expensesAPI, categoriesAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseList from '../components/expenses/ExpenseList';
import ExpenseFilters from '../components/expenses/ExpenseFilters';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    useEffect(() => {
        fetchExpenses();
        fetchCategories();
    }, []);

    useEffect(() => {
        setFilteredExpenses(expenses);
    }, [expenses]);

    const fetchExpenses = async () => {
        try {
            const response = await expensesAPI.getAll();
            setExpenses(response.data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            toast.error('Failed to load expenses');
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await categoriesAPI.getAll();
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (expenseData) => {
        try {
            await expensesAPI.create(expenseData);
            toast.success('Expense added successfully!');
            fetchExpenses();
            setShowExpenseForm(false);
        } catch (error) {
            console.error('Error adding expense:', error);
            toast.error('Failed to add expense');
        }
    };

    const handleUpdateExpense = async (id, expenseData) => {
        try {
            await expensesAPI.update(id, expenseData);
            toast.success('Expense updated successfully!');
            fetchExpenses();
            setEditingExpense(null);
            setShowExpenseForm(false);
        } catch (error) {
            console.error('Error updating expense:', error);
            toast.error('Failed to update expense');
        }
    };

    const handleDeleteExpense = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                await expensesAPI.delete(id);
                toast.success('Expense deleted successfully!');
                fetchExpenses();
            } catch (error) {
                console.error('Error deleting expense:', error);
                toast.error('Failed to delete expense');
            }
        }
    };

    const handleEditExpense = (expense) => {
        setEditingExpense(expense);
        setShowExpenseForm(true);
    };

    const handleCloseForm = () => {
        setShowExpenseForm(false);
        setEditingExpense(null);
    };

    const handleFilter = (filters) => {
        let filtered = expenses;

        if (filters.category) {
            filtered = filtered.filter(expense => expense.category_id === parseInt(filters.category));
        }

        if (filters.dateFrom) {
            filtered = filtered.filter(expense => expense.date >= filters.dateFrom);
        }

        if (filters.dateTo) {
            filtered = filtered.filter(expense => expense.date <= filters.dateTo);
        }

        if (filters.search) {
            filtered = filtered.filter(expense =>
                expense.description.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        setFilteredExpenses(filtered);
    };

    if (loading) {
        return <LoadingSpinner message="Loading expenses..." />;
    }

    return (
        <div className="expenses">
            <div className="expenses__header">
                <div className="expenses__title">
                    <h1>💳 Expense Management</h1>
                    <p>Track and manage your expenses</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => setShowExpenseForm(true)}
                >
                    ➕ Add Expense
                </Button>
            </div>

            <div className="expenses__content">
                <ExpenseFilters
                    categories={categories}
                    onFilter={handleFilter}
                />

                <ExpenseList
                    expenses={filteredExpenses}
                    categories={categories}
                    onEdit={handleEditExpense}
                    onDelete={handleDeleteExpense}
                />
            </div>

            {/* Expense Form Modal */}
            {showExpenseForm && (
                <Modal
                    title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
                    onClose={handleCloseForm}
                >
                    <ExpenseForm
                        categories={categories}
                        expense={editingExpense}
                        onSubmit={editingExpense ?
                            (data) => handleUpdateExpense(editingExpense.id, data) :
                            handleAddExpense
                        }
                        onCancel={handleCloseForm}
                    />
                </Modal>
            )}
        </div>
    );
}

export default Expenses;