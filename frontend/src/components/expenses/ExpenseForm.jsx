import { useState, useEffect } from 'react';
import Button from '../common/Button';
import './ExpenseForm.css';

function ExpenseForm({ categories, expense, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0], // Today's date
        category_id: '',
        currency: 'USD'
    });
    const [loading, setLoading] = useState(false);

    // Populate form if editing existing expense
    useEffect(() => {
        if (expense) {
            setFormData({
                amount: expense.amount.toString(),
                description: expense.description,
                date: expense.date,
                category_id: expense.category_id.toString(),
                currency: expense.currency || 'USD'
            });
        }
    }, [expense]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onSubmit({
                ...formData,
                amount: parseFloat(formData.amount),
                category_id: parseInt(formData.category_id)
            });
        } catch (error) {
            console.error('Error submitting expense:', error);
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = () => {
        return formData.amount &&
            formData.description &&
            formData.date &&
            formData.category_id;
    };

    return (
        <div className="expense-form">
            <form onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="amount">Amount *</label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            required
                            placeholder="0.00"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="currency">Currency</label>
                        <select
                            id="currency"
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                        >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="CAD">CAD (C$)</option>
                            <option value="AUD">AUD (A$)</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description *</label>
                    <input
                        type="text"
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        placeholder="What did you spend on?"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="category_id">Category *</label>
                        <select
                            id="category_id"
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleChange}
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

                    <div className="form-group">
                        <label htmlFor="date">Date *</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                        />
                    </div>
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
                        disabled={!isFormValid()}
                    >
                        {expense ? 'Update Expense' : 'Add Expense'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default ExpenseForm;