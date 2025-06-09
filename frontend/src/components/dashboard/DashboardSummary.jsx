import './DashboardSummary.css';

function DashboardSummary({ data }) {
    const currentMonth = new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    const summaryCards = [
        {
            title: 'Total Spent This Month',
            value: `$${data.total_this_month.toFixed(2)}`,
            icon: '💳',
            description: `in ${currentMonth}`
        },
        {
            title: 'Number of Transactions',
            value: data.expense_count,
            icon: '📊',
            description: `transactions this month`
        },
        {
            title: 'Categories Used',
            value: Object.keys(data.category_breakdown).length,
            icon: '🏷️',
            description: `active categories`
        },
        {
            title: 'Average per Transaction',
            value: data.expense_count > 0 ?
                `$${(data.total_this_month / data.expense_count).toFixed(2)}` :
                '$0.00',
            icon: '📈',
            description: `average spending`
        }
    ];

    return (
        <div className="dashboard-summary">
            <div className="dashboard-summary__cards">
                {summaryCards.map((card, index) => (
                    <div key={index} className="summary-card">
                        <div className="summary-card__icon">
                            {card.icon}
                        </div>
                        <div className="summary-card__content">
                            <h3 className="summary-card__title">{card.title}</h3>
                            <div className="summary-card__value">{card.value}</div>
                            <p className="summary-card__description">{card.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DashboardSummary;