import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';
import './Header.css';

function Header() {
    const { user, logout, isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return null; // Don't show header on login/register pages
    }

    return (
        <header className="header">
            <div className="header__container">
                <div className="header__left">
                    <Link to="/dashboard" className="header__logo">
                        💰 Finance Tracker
                    </Link>

                    <nav className="header__nav">
                        <Link
                            to="/dashboard"
                            className={`header__nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/expenses"
                            className={`header__nav-link ${location.pathname === '/expenses' ? 'active' : ''}`}
                        >
                            Expenses
                        </Link>
                    </nav>
                </div>

                <div className="header__right">
                    <span className="header__welcome">
                        Welcome, {user?.first_name}!
                    </span>
                    <Button variant="secondary" size="small" onClick={logout}>
                        Logout
                    </Button>
                </div>
            </div>
        </header>
    );
}

export default Header;