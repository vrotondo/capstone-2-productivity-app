# Finance Tracker

A full-stack web application for personal expense tracking and budget management. Built with React frontend and Flask backend.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Expense Management**: Add, edit, and delete personal expenses
- **Category Organization**: Organize expenses into customizable categories
- **Dashboard Overview**: View expense summaries and recent activity
- **Data Persistence**: All data stored securely in SQLite database
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

### Frontend
- React 18
- React Router for navigation
- CSS3 for styling
- Fetch API for HTTP requests

### Backend
- Flask web framework
- SQLAlchemy ORM for database operations
- Flask-JWT-Extended for authentication
- Flask-CORS for cross-origin requests
- SQLite database

## Project Structure

```
finance-tracker/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── styles/        # CSS stylesheets
│   │   └── App.js         # Main React component
│   ├── public/
│   └── package.json
├── backend/
│   ├── app.py            # Flask application entry point
│   ├── models.py         # Database models
│   └── requirements.txt  # Python dependencies
└── README.md
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8+
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Start the Flask server:
```bash
python app.py
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The frontend application will run on `http://localhost:3000`

## Usage

### Getting Started

1. **Register an Account**: Create a new user account with your email and password
2. **Login**: Access your personal dashboard with your credentials
3. **Create Categories**: Set up expense categories (Food, Transportation, etc.)
4. **Add Expenses**: Record your daily expenses with amounts, descriptions, and categories
5. **View Dashboard**: Monitor your spending patterns and recent activity

### API Endpoints

#### Authentication
- `POST /api/register` - Create new user account
- `POST /api/login` - Authenticate user and receive JWT token
- `GET /api/profile` - Get current user profile (requires authentication)

#### Categories
- `GET /api/categories` - Get all user categories
- `POST /api/categories` - Create new category
- `POST /api/categories/create-defaults` - Create default expense categories

#### Expenses
- `GET /api/expenses` - Get all user expenses
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update existing expense
- `DELETE /api/expenses/:id` - Delete expense

#### Dashboard
- `GET /api/dashboard` - Get dashboard summary data

## Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique user email
- `password_hash` - Encrypted password
- `first_name` - User's first name
- `last_name` - User's last name
- `default_currency` - Preferred currency (default: USD)
- `created_at` - Account creation timestamp

### Categories Table
- `id` - Primary key
- `name` - Category name
- `color` - Display color (hex code)
- `user_id` - Foreign key to users table
- `created_at` - Creation timestamp

### Expenses Table
- `id` - Primary key
- `amount` - Expense amount
- `description` - Expense description
- `date` - Expense date
- `currency` - Currency code
- `user_id` - Foreign key to users table
- `category_id` - Foreign key to categories table
- `created_at` - Creation timestamp

## Configuration

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=sqlite:///finance_tracker.db
```

### Default Categories

The application automatically creates these default categories for new users:
- Food & Dining
- Transportation
- Entertainment
- Shopping
- Bills & Utilities
- Healthcare
- Other

## Security Features

- Password hashing using Werkzeug security
- JWT token-based authentication
- CORS protection for API endpoints
- Input validation and sanitization
- User-specific data isolation

## Development

### Running Tests

Currently, the application does not include automated tests. This would be a good area for future development.

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Troubleshooting

### Common Issues

**Backend won't start**
- Ensure Python virtual environment is activated
- Verify all dependencies are installed with `pip install -r requirements.txt`
- Check that port 5000 is not already in use

**Frontend won't connect to backend**
- Verify backend is running on `http://localhost:5000`
- Check that CORS is properly configured
- Ensure no firewall is blocking the connection

**Login issues**
- Clear browser local storage and cookies
- Verify email and password are correct
- Check backend logs for authentication errors

**Database errors**
- Delete `finance_tracker.db` to reset the database
- Restart the backend server to recreate tables
- Ensure SQLite is properly installed

## License

This project is open source and available under the MIT License.

## Support

For questions or issues, please check the troubleshooting section above or review the application logs for specific error messages.