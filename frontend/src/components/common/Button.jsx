import './Button.css';

function Button({
    children,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    onClick,
    type = 'button',
    ...props
}) {
    const className = `btn btn--${variant} btn--${size} ${disabled || loading ? 'btn--disabled' : ''}`;

    return (
        <button
            type={type}
            className={className}
            onClick={onClick}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span className="btn__spinner">⏳</span>
            ) : (
                children
            )}
        </button>
    );
}

export default Button;