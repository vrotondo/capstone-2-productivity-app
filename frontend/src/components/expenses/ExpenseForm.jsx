import { useState, useEffect } from 'react';
import Button from '../common/Button';
import './ExpenseForm.css';

const ExpenseForm = ({
    expense,
    categories,
    onSubmit,
    onCancel,
    getCategorySuggestion
}) => {
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        category_id: ''
    });
    const [loading, setLoading] = useState(false);

    // AI suggestion state
    const [suggestedCategory, setSuggestedCategory] = useState('');
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiDebounceTimer, setAiDebounceTimer] = useState(null);

    useEffect(() => {
        if (expense) {
            setFormData({
                amount: expense.amount.toString(),
                description: expense.description,
                date: expense.date,
                category_id: expense.category_id.toString()
            });
        }
    }, [expense]);

    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (aiDebounceTimer) {
                clearTimeout(aiDebounceTimer);
            }
        };
    }, [aiDebounceTimer]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle description changes with AI suggestion
    const handleDescriptionChange = async (e) => {
        const description = e.target.value;
        handleInputChange(e);

        // Don't suggest for existing expenses being edited
        if (expense) return;

        // Clear existing timer
        if (aiDebounceTimer) {
            clearTimeout(aiDebounceTimer);
        }

        // Clear suggestion if description is too short
        if (description.length < 3) {
            setSuggestedCategory('');
            return;
        }

        // Set new timer for AI suggestion
        const newTimer = setTimeout(async () => {
            setIsLoadingAI(true);
            try {
                const suggestion = await getCategorySuggestion(description);
                if (suggestion) {
                    setSuggestedCategory(suggestion);

                    // Auto-select the suggested category
                    const suggestedCat = categories.find(cat => cat.name === suggestion);
                    if (suggestedCat && !formData.category_id) {
                        setFormData(prev => ({
                            ...prev,
                            category_id: suggestedCat.id.toString()
                        }));
                    }
                }
            } catch (error) {
                console.error('AI suggestion error:', error);
            } finally {
                setIsLoadingAI(false);
            }
        }, 1500);

        setAiDebounceTimer(newTimer);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const expenseData = {
                ...formData,
                amount: parseFloat(formData.amount),
                category_id: parseInt(formData.category_id)
            };

            await onSubmit(expenseData);
        } catch (error) {
            console.error('Error submitting expense:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="expense-form">
            <h3>{expense ? 'Edit Expense' : 'Add New Expense'}</h3>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="amount">Amount ($)</label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <input
                        type="text"
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleDescriptionChange}
                        placeholder="Enter expense description..."
                        required
                    />

                    {/* AI Suggestion Display */}
                    {isLoadingAI && (
                        <div className="ai-suggestion loading">
                            <span>🤖 AI is analyzing...</span>
                        </div>
                    )}

                    {suggestedCategory && !isLoadingAI && !expense && (
                        <div className="ai-suggestion success">
                            <span>🎯 AI suggests: <strong>{suggestedCategory}</strong></span>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="date">Date</label>
                    <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="category_id">Category</label>
                    <select
                        id="category_id"
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-actions">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        loading={loading}
                        disabled={loading}
                    >
                        {expense ? 'Update Expense' : 'Add Expense'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ExpenseForm;