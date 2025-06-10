import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { expensesAPI, categoriesAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import ExpenseFilters from '../components/expenses/ExpenseFilters';
import toast from 'react-hot-toast';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [filters, setFilters] = useState({
        category: '',
        dateRange: 'all',
        startDate: '',
        endDate: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        category_id: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // AI suggestion state
    const [suggestedCategory, setSuggestedCategory] = useState('');
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiDebounceTimer, setAiDebounceTimer] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const expensesResponse = await expensesAPI.getAll();
            const categoriesResponse = await categoriesAPI.getAll();

            setExpenses(expensesResponse.data);
            setCategories(categoriesResponse.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error.message);
            toast.error('Failed to load data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // AI categorization function
    const getCategorySuggestion = async (description) => {
        console.log('getCategorySuggestion called with:', description);

        if (!description || description.length < 3) {
            console.log('Description too short for AI');
            return null;
        }

        try {
            const token = localStorage.getItem('token');
            console.log('Token exists:', !!token);

            console.log('Making AI request to backend...');
            const response = await fetch('http://localhost:5000/api/expenses/categorize', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ description })
            });

            console.log('AI response status:', response.status);
            console.log('AI response ok:', response.ok);

            if (!response.ok) {
                console.error('AI response not ok:', response.status, response.statusText);
                return null;
            }

            const data = await response.json();
            console.log('AI response data:', data);

            return data.suggested_category || null;

        } catch (error) {
            console.error('AI suggestion failed:', error);
            return null;
        }
    };

    // Handle description changes with AI suggestion
    const handleDescriptionChange = async (e) => {
        const description = e.target.value;
        console.log('Description changed:', description);
        setFormData(prev => ({ ...prev, description }));

        // Clear existing timer
        if (aiDebounceTimer) {
            clearTimeout(aiDebounceTimer);
            console.log('Cleared existing timer');
        }

        // Clear suggestion if description is too short
        if (description.length < 3) {
            console.log('Description too short, clearing suggestion');
            setSuggestedCategory('');
            return;
        }

        console.log('Setting up AI timer for:', description);

        // Set new timer for AI suggestion
        const newTimer = setTimeout(async () => {
            console.log('AI timer triggered for:', description);
            setIsLoadingAI(true);
            try {
                const suggestion = await getCategorySuggestion(description);
                console.log('AI suggestion received:', suggestion);
                console.log('Available categories:', categories);

                if (suggestion) {
                    setSuggestedCategory(suggestion);

                    // Auto-select the suggested category if no category is already selected
                    const suggestedCat = categories.find(cat => cat.name === suggestion);
                    console.log('Found matching category:', suggestedCat);
                    console.log('Current category_id:', formData.category_id);

                    if (suggestedCat && !formData.category_id) {
                        console.log('Auto-selecting category:', suggestedCat.id);
                        setFormData(prev => ({
                            ...prev,
                            category_id: suggestedCat.id.toString()
                        }));
                    }
                } else {
                    console.log('No AI suggestion received');
                }
            } catch (error) {
                console.error('AI suggestion error:', error);
            } finally {
                setIsLoadingAI(false);
                console.log('AI loading finished');
            }
        }, 1500);

        setAiDebounceTimer(newTimer);
        console.log('New timer set');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData({
            amount: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
            category_id: ''
        });
        setSuggestedCategory('');
        setIsLoadingAI(false);
        setEditingExpense(null);
        if (aiDebounceTimer) {
            clearTimeout(aiDebounceTimer);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const expenseData = {
                ...formData,
                amount: parseFloat(formData.amount),
                category_id: parseInt(formData.category_id)
            };

            if (editingExpense) {
                await expensesAPI.update(editingExpense.id, expenseData);
                toast.success('Expense updated successfully!');
            } else {
                await expensesAPI.create(expenseData);
                toast.success('Expense created successfully!');
            }

            await fetchData();
            setShowExpenseForm(false);
            resetForm();
        } catch (error) {
            console.error('Error submitting expense:', error);
            toast.error('Failed to save expense');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setFormData({
            amount: expense.amount.toString(),
            description: expense.description,
            date: expense.date,
            category_id: expense.category_id.toString()
        });
        setSuggestedCategory(''); // Clear AI suggestion when editing
        setShowExpenseForm(true);
    };

    const handleDeleteExpense = async (expenseId) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) {
            return;
        }
        try {
            await expensesAPI.delete(expenseId);
            await fetchData();
            toast.success('Expense deleted successfully!');
        } catch (error) {
            console.error('Error deleting expense:', error);
            toast.error('Failed to delete expense');
        }
    };

    const handleCloseForm = () => {
        setShowExpenseForm(false);
        resetForm();
    };

    // Filter expenses based on current filters
    const filteredExpenses = expenses.filter(expense => {
        // Apply category filter
        if (filters.category && expense.category_id !== parseInt(filters.category)) {
            return false;
        }

        // Apply date range filter
        if (filters.dateRange !== 'all') {
            const expenseDate = new Date(expense.date);
            const today = new Date();

            switch (filters.dateRange) {
                case 'week':
                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (expenseDate < weekAgo) return false;
                    break;
                case 'month':
                    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                    if (expenseDate < monthAgo) return false;
                    break;
                case 'custom':
                    if (filters.startDate && expenseDate < new Date(filters.startDate)) return false;
                    if (filters.endDate && expenseDate > new Date(filters.endDate)) return false;
                    break;
                default:
                    break;
            }
        }

        return true;
    });

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Error: {error}</h2>
                <Link to="/dashboard">
                    <Button variant="secondary">Back to Dashboard</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="expenses">
            <div className="expenses__header">
                <h1>My Expenses</h1>
                <div className="expenses__actions">
                    <Link to="/dashboard">
                        <Button variant="secondary">
                            ← Back to Dashboard
                        </Button>
                    </Link>
                    <Button variant="primary" onClick={() => setShowExpenseForm(true)}>
                        + Add Expense
                    </Button>
                </div>
            </div>

            <ExpenseFilters
                filters={filters}
                onFiltersChange={setFilters}
                categories={categories}
            />

            {/* Expense List */}
            <div style={{ marginTop: '20px' }}>
                <h3>Expenses ({filteredExpenses.length})</h3>
                {filteredExpenses.length === 0 ? (
                    <p>No expenses found.</p>
                ) : (
                    <div>
                        {filteredExpenses.map(expense => (
                            <div key={expense.id} style={{
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '15px',
                                marginBottom: '10px',
                                backgroundColor: '#f9f9f9'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong style={{ fontSize: '18px', color: '#2563eb' }}>
                                            ${expense.amount}
                                        </strong>
                                        <span style={{ marginLeft: '10px' }}>{expense.description}</span>
                                    </div>
                                    <div>
                                        <button onClick={() => handleEdit(expense)} style={{ marginRight: '5px' }}>
                                            Edit
                                        </button>
                                        <button onClick={() => handleDeleteExpense(expense.id)}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                                <div style={{ marginTop: '5px', fontSize: '14px', color: '#666' }}>
                                    <span>{expense.date}</span>
                                    {expense.category_name && (
                                        <span style={{
                                            marginLeft: '10px',
                                            backgroundColor: expense.category_color || '#3b82f6',
                                            color: 'white',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px'
                                        }}>
                                            {expense.category_name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Expense Form Modal */}
            {showExpenseForm && (
                <Modal onClose={handleCloseForm}>
                    <div style={{ padding: '20px', maxWidth: '500px' }}>
                        <h3>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h3>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '15px' }}>
                                <label htmlFor="amount" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Amount ($)
                                </label>
                                <input
                                    type="number"
                                    id="amount"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '16px'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label htmlFor="description" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Description
                                </label>
                                <input
                                    type="text"
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleDescriptionChange}
                                    placeholder="Enter expense description..."
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '16px'
                                    }}
                                />

                                {/* AI Suggestion Display */}
                                {isLoadingAI && (
                                    <div style={{
                                        marginTop: '5px',
                                        padding: '8px 12px',
                                        backgroundColor: '#f3f4f6',
                                        color: '#6b7280',
                                        borderLeft: '3px solid #3b82f6',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}>
                                        🤖 AI is analyzing...
                                    </div>
                                )}

                                {suggestedCategory && !isLoadingAI && !editingExpense && (
                                    <div style={{
                                        marginTop: '5px',
                                        padding: '8px 12px',
                                        backgroundColor: '#ecfdf5',
                                        color: '#059669',
                                        borderLeft: '3px solid #10b981',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}>
                                        🎯 AI suggests: <strong>{suggestedCategory}</strong>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label htmlFor="date" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Date
                                </label>
                                <input
                                    type="date"
                                    id="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '16px'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label htmlFor="category_id" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Category
                                </label>
                                <select
                                    id="category_id"
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleInputChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '16px'
                                    }}
                                >
                                    <option value="">Select a category</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleCloseForm}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Add Expense')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Expenses;