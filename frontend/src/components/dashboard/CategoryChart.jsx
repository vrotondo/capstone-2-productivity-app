import './CategoryChart.css';

function CategoryChart({ categoryData }) {
    const categories = Object.entries(categoryData || {});
    const total = categories.reduce((sum, [, amount]) => sum + amount, 0);

    // Colors for categories
    const colors = [
        '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899',
        '#6B7280', '#10B981', '#3B82F6', '#F97316'
    ];

    return (
        <div className="category-chart">
            <div className="category-chart__header">
                <h3>Spending by Category</h3>
                <p>This month's breakdown</p>
            </div>

            <div className="category-chart__content">
                {categories.length > 0 ? (
                    <>
                        <div className="category-chart__visual">
                            <div className="pie-chart">
                                {categories.map(([categoryName, amount], index) => {
                                    const percentage = ((amount / total) * 100).toFixed(1);
                                    return (
                                        <div
                                            key={categoryName}
                                            className="pie-slice"
                                            style={{
                                                backgroundColor: colors[index % colors.length],
                                                flex: percentage
                                            }}
                                            title={`${categoryName}: ${percentage}%`}
                                        ></div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="category-chart__legend">
                            {categories.map(([categoryName, amount], index) => {
                                const percentage = ((amount / total) * 100).toFixed(1);
                                return (
                                    <div key={categoryName} className="legend-item">
                                        <div
                                            className="legend-item__color"
                                            style={{ backgroundColor: colors[index % colors.length] }}
                                        ></div>
                                        <div className="legend-item__info">
                                            <span className="legend-item__name">{categoryName}</span>
                                            <div className="legend-item__values">
                                                <span className="legend-item__amount">
                                                    ${amount.toFixed(2)}
                                                </span>
                                                <span className="legend-item__percentage">
                                                    ({percentage}%)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="category-chart__total">
                            <strong>Total: ${total.toFixed(2)}</strong>
                        </div>
                    </>
                ) : (
                    <div className="category-chart__empty">
                        <p>No spending data available</p>
                        <small>Add some expenses to see the breakdown</small>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CategoryChart;