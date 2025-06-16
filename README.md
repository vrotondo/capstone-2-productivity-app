# Personal Finance Tracker with AI Assistant

A comprehensive full-stack web application for managing personal finances, featuring AI-powered expense categorization and an intelligent financial assistant chatbot.

## Features

### Core Financial Management
- **Secure User Authentication**: JWT-based registration and login system
- **Comprehensive Expense Tracking**: Create, edit, delete, and view expenses with detailed categorization
- **Smart Category Management**: Organize expenses with customizable categories and color coding
- **Advanced Data Filtering**: Filter expenses by category, date range, and custom time periods
- **Analytics Dashboard**: Real-time spending summaries, category breakdowns, and financial insights

### AI-Powered Intelligence
- **Smart Expense Categorization**: AI automatically suggests appropriate categories based on expense descriptions
- **Real-time Category Suggestions**: Get instant, accurate category recommendations as you type
- **Conversational Financial Assistant**: Interactive chatbot that answers questions about your spending patterns
- **Personalized Financial Insights**: AI analyzes your data to provide customized advice and observations
- **Natural Language Queries**: Ask questions like "How much did I spend on food this month?" in plain English

### User Experience
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile devices
- **Real-time Feedback**: Instant loading states, success notifications, and error handling
- **Intuitive Interface**: Clean, modern design with smooth animations and transitions
- **Accessibility**: Proper contrast ratios, keyboard navigation, and screen reader support

## Technology Stack

### Frontend
- **React 18** with Vite - Modern, fast development and optimized builds
- **React Router** - Client-side routing with protected routes
- **Tailwind CSS** - Utility-first styling with custom design system
- **React Hot Toast** - Elegant notification system
- **Custom Hooks** - Reusable logic for API calls and state management

### Backend
- **Flask** - Lightweight, flexible Python web framework
- **SQLAlchemy** - Powerful ORM with relationship management
- **Flask-JWT-Extended** - Secure token-based authentication
- **Flask-CORS** - Cross-origin resource sharing configuration
- **SQLite** - Reliable database for development and deployment

### AI & External Services
- **Google Gemini 1.5 Flash** - Advanced language model for natural language processing
- **Google Generative AI SDK** - Official Python client for Gemini API
- **Real-time AI Integration** - Debounced requests with graceful error handling

## Project Architecture

```
finance-tracker/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/              # Authentication components
│   │   │   ├── common/            # Reusable UI components
│   │   │   ├── dashboard/         # Dashboard-specific components
│   │   │   ├── expenses/          # Expense management components
│   │   │   └── FinancialAssistant.jsx  # AI chatbot component
│   │   ├── pages/                 # Main page components
│   │   ├── services/              # API service functions
│   │   ├── context/               # React context providers
│   │   ├── utils/                 # Utility functions and helpers
│   │   └── styles/                # Global CSS files
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app.py                     # Main Flask application with all routes
│   ├── models.py                  # SQLAlchemy database models
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # Environment variables (not in repo)
│   └── finance_tracker.db         # SQLite database file
└── README.md
```

## Installation and Setup

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+ and pip
- Google Cloud Platform account with Generative AI API enabled

### Environment Configuration

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-secure-flask-secret-key-here
JWT_SECRET_KEY=your-secure-jwt-secret-key-here
GEMINI_API_KEY=your-google-gemini-api-key
DATABASE_URL=sqlite:///finance_tracker.db
```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the Flask development server:
   ```bash
   python app.py
   ```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## API Documentation

### Authentication Endpoints
- `POST /api/register` - Create new user account
- `POST /api/login` - Authenticate user and return JWT token
- `GET /api/profile` - Get authenticated user profile information

### Category Management
- `GET /api/categories` - Retrieve all user categories
- `POST /api/categories` - Create new expense category
- `POST /api/categories/create-defaults` - Generate default category set

### Expense Operations
- `GET /api/expenses` - Get all user expenses (sorted by date)
- `POST /api/expenses` - Create new expense entry
- `PUT /api/expenses/<id>` - Update existing expense
- `DELETE /api/expenses/<id>` - Remove expense entry

### AI-Powered Features
- `POST /api/expenses/categorize` - Get AI category suggestion for expense description
- `POST /api/chat` - Send message to financial assistant and receive AI response
- `GET /api/chat/test` - Test chat system connectivity

### Analytics & Insights
- `GET /api/dashboard` - Get comprehensive dashboard data and analytics

### System Health
- `GET /api/health` - Check API health and status

## AI Features Deep Dive

### Smart Expense Categorization
The application leverages Google's Gemini AI to automatically categorize expenses:

1. **Real-time Analysis**: As users type expense descriptions, the system analyzes the text
2. **Context-Aware Matching**: AI considers user's existing categories for personalized suggestions
3. **Confidence-Based Auto-Selection**: High-confidence suggestions are automatically applied
4. **Graceful Fallback**: System remains fully functional even when AI services are unavailable

### Conversational Financial Assistant
The AI chatbot provides personalized financial insights through natural language:

**Supported Query Types:**
- Spending summaries: "How much did I spend this month?"
- Category analysis: "What's my biggest expense category?"
- Transaction history: "Show me my recent purchases"
- Pattern recognition: "What are my spending trends?"
- Budget insights: "Am I staying within my budget?"

**Technical Implementation:**
- Real-time data analysis from user's expense database
- Context-aware prompting with user's actual financial data
- Conversational responses with specific dollar amounts and actionable insights
- Error handling with intelligent fallback responses using cached data

## Database Schema

### Users Table
```sql
- id (INTEGER, Primary Key, Auto-increment)
- email (VARCHAR, Unique, Not Null)
- password_hash (VARCHAR, Not Null)
- first_name (VARCHAR, Not Null)
- last_name (VARCHAR, Not Null)
- created_at (DATETIME, Default: CURRENT_TIMESTAMP)
```

### Categories Table
```sql
- id (INTEGER, Primary Key, Auto-increment)
- name (VARCHAR, Not Null)
- color (VARCHAR, Default: '#3B82F6')
- user_id (INTEGER, Foreign Key → Users.id)
- created_at (DATETIME, Default: CURRENT_TIMESTAMP)
```

### Expenses Table
```sql
- id (INTEGER, Primary Key, Auto-increment)
- amount (DECIMAL, Not Null)
- description (TEXT, Not Null)
- date (DATE, Not Null)
- currency (VARCHAR, Default: 'USD')
- user_id (INTEGER, Foreign Key → Users.id)
- category_id (INTEGER, Foreign Key → Categories.id)
- created_at (DATETIME, Default: CURRENT_TIMESTAMP)
```

## Security Implementation

### Authentication & Authorization
- **Password Security**: Werkzeug password hashing with salt
- **JWT Tokens**: Stateless authentication with configurable expiration
- **Protected Routes**: All sensitive endpoints require valid JWT tokens
- **CORS Configuration**: Restricted to specific frontend origins

### Data Protection
- **Input Validation**: Server-side validation for all user inputs
- **SQL Injection Prevention**: Parameterized queries through SQLAlchemy ORM
- **XSS Protection**: React's built-in XSS prevention
- **Environment Variables**: Sensitive configuration stored securely

## Performance Optimizations

### Frontend Performance
- **Debounced AI Requests**: Prevents excessive API calls during user typing
- **Optimized Re-renders**: Strategic use of React hooks to minimize unnecessary updates
- **Lazy Loading**: Dynamic imports for code splitting
- **Caching Strategy**: Intelligent caching of category and user data

### Backend Efficiency
- **Database Indexing**: Optimized queries with proper indexing on foreign keys
- **Connection Pooling**: Efficient database connection management
- **Error Boundaries**: Comprehensive error handling without service interruption
- **Graceful Degradation**: AI features fail gracefully without affecting core functionality

## Development Methodology

### Component Architecture
- **Modular Design**: Components organized by feature with clear separation of concerns
- **Reusable Components**: Shared UI components for consistent design system
- **Custom Hooks**: Extracted logic for API calls, authentication, and state management
- **Context Providers**: Global state management for authentication and user data

### Error Handling Strategy
- **User-Friendly Messages**: Clear error communication without technical jargon
- **Fallback Mechanisms**: Alternative flows when external services are unavailable
- **Logging System**: Comprehensive logging for debugging and monitoring
- **Graceful Recovery**: Automatic retry mechanisms for transient failures

### Testing Considerations
- **API Testing**: All endpoints tested with various input scenarios
- **Authentication Flow**: Complete user journey testing from registration to data access
- **AI Integration**: Fallback testing when AI services are unavailable
- **Cross-browser Compatibility**: Testing across modern browsers and devices

## Future Enhancements

### Advanced AI Features
- **Receipt Scanning**: OCR integration for automatic expense entry from photos
- **Predictive Analytics**: AI-powered spending forecasts and budget recommendations
- **Goal Tracking**: Intelligent savings goal monitoring with personalized advice
- **Anomaly Detection**: Automatic alerts for unusual spending patterns

### Enhanced User Experience
- **Mobile App**: React Native implementation for iOS and Android
- **Offline Support**: Progressive Web App with offline data synchronization
- **Advanced Visualizations**: Interactive charts and spending trend analysis
- **Export Functionality**: PDF reports and CSV data export

### Integration Capabilities
- **Bank Account Sync**: Direct integration with financial institutions
- **Bill Reminders**: Automated recurring bill tracking and notifications
- **Multi-currency Support**: International expense tracking with real-time conversion
- **Team/Family Features**: Shared expense tracking for households or groups

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/enhancement-name`)
3. Implement your changes with proper testing
4. Commit with descriptive messages (`git commit -am 'Add new feature: description'`)
5. Push to your branch (`git push origin feature/enhancement-name`)
6. Submit a Pull Request with detailed description

## License

This project is licensed under the MIT License - see the LICENSE file for complete details.

## Acknowledgments

- **Google Gemini AI** for providing advanced natural language processing capabilities
- **React and Flask Communities** for excellent documentation and community support
- **Open Source Contributors** for the libraries and tools that made this project possible
- **Modern Web Development Practices** for inspiration on architecture and user experience design

---

*Built with modern web technologies and AI integration for the future of personal finance management.*