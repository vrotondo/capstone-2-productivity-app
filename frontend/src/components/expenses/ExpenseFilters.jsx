import { useState } from 'react';
import Button from '../common/Button';
import './ExpenseFilters.css';

function ExpenseFilters({ categories, onFilter }) {
    const [filters, setFilters] = useState({
        category: '',
        dateFrom: '',
        dateTo: '',
        search: ''
    });

    const handleChange = (e) => {
        const newFilters = {
            ...filters,
            [e.target.name]: e.target.value
        };
        setFilters(newFilters);
        onFilter(newFilters);
    };

    const handleClear = () => {
        const clearedFilters = {
            category: '',
            dateFrom: '',
            dateTo: '',
            search: ''
        };
        setFilters(clearedFilters);
        onFilter(clearedFilters);
    };

    const hasActiveFilters = Object.values(filters).some(value => value !== '');

    return (
        <div className="expense-filters">
            <div className="expense-filters__header">
                <h3>Filter Expenses</h3>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="small"
                        onClick={handleClear}
                    >
                        Clear All
                    </Button>
                )}
            </div>

            <div className="expense-filters__controls">
                <div className="filter-group">
                    <label htmlFor="search">Search</label>
                    <input
                        type="text"
                        id="search"
                        name="search"
                        value={filters.search}
                        onChange={handleChange}
                        placeholder="Search descriptions..."
                    />
                </div>

                <div className="filter-group">
                    <label htmlFor="category">Category</label>
                    <select
                        id="category"
                        name="category"
                        value={filters.category}
                        onChange={handleChange}
                    >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="dateFrom">From Date</label>
                    <input
                        type="date"
                        id="dateFrom"
                        name="dateFrom"
                        value={filters.dateFrom}
                        onChange={handleChange}
                    />
                </div>

                <div className="filter-group">
                    <label htmlFor="dateTo">To Date</label>
                    <input
                        type="date"
                        id="dateTo"
                        name="dateTo"
                        value={filters.dateTo}
                        onChange={handleChange}
                    />
                </div>
            </div>

            {hasActiveFilters && (
                <div className="expense-filters__summary">
                    <p>Filters applied:</p>
                    <div className="filter-tags">
                        {filters.search && (
                            <span className="filter-tag">
                                Search: "{filters.search}"
                            </span>
                        )}
                        {filters.category && (
                            <span className="filter-tag">
                                Category: {categories.find(cat => cat.id === parseInt(filters.category))?.name}
                            </span>
                        )}
                        {filters.dateFrom && (
                            <span className="filter-tag">
                                From: {filters.dateFrom}
                            </span>
                        )}
                        {filters.dateTo && (
                            <span className="filter-tag">
                                To: {filters.dateTo}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ExpenseFilters;