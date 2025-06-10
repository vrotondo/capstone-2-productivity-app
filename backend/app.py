from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from datetime import datetime, date, timezone
from sqlalchemy import text
import requests
import traceback
import os

# Import db and models from models.py (no circular import now)
from models import db, User, Category, Expense, Budget

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///finance_tracker.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-string')

# Initialize extensions with app
db.init_app(app)
jwt = JWTManager(app)
CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])

# JWT Error handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print("JWT Error: Token has expired")
    return jsonify({'error': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"JWT Error: Invalid token - {error}")
    return jsonify({'error': 'Invalid token'}), 422

@jwt.unauthorized_loader
def missing_token_callback(error):
    print(f"JWT Error: Missing token - {error}")
    return jsonify({'error': 'Missing authorization token'}), 401

@jwt.additional_claims_loader
def add_claims_to_access_token(identity):
    return {}

# Add request logging for all routes
@app.before_request
def log_request():
    print(f"\n=== Incoming Request ===")
    print(f"Method: {request.method}")
    print(f"Path: {request.path}")
    print(f"Headers: {dict(request.headers)}")
    if request.get_data():
        print(f"Body: {request.get_data()}")
    print("========================\n")

# Your API key for currency conversion
EXCHANGE_API_KEY = os.getenv('EXCHANGE_API_KEY', 'wCoOoTtNOghmt2oqx792')

# Create tables
with app.app_context():
    try:
        print("Creating database tables...")
        db.create_all()
        print("Database tables created successfully!")
        
        # Test database connection
        result = db.session.execute(text('SELECT 1')).fetchone()
        print(f"Database connection test: {result}")
        
    except Exception as e:
        print(f"Database creation error: {e}")
        print(f"Full traceback: {traceback.format_exc()}")

# ============== AUTHENTICATION ROUTES ==============

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        print(f"Registration attempt for: {data.get('email')}")
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        user = User(
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name']
        )
        
        db.session.add(user)
        db.session.flush()  # This assigns the ID to user
        print(f"Created user with ID: {user.id}")
        
        # Create default categories
        default_categories = [
            {'name': 'Food & Dining', 'color': '#EF4444'},
            {'name': 'Transportation', 'color': '#F59E0B'},
            {'name': 'Entertainment', 'color': '#8B5CF6'},
            {'name': 'Shopping', 'color': '#EC4899'},
            {'name': 'Bills & Utilities', 'color': '#6B7280'},
            {'name': 'Healthcare', 'color': '#10B981'},
            {'name': 'Other', 'color': '#3B82F6'}
        ]
        
        for cat_data in default_categories:
            category = Category(
                name=cat_data['name'],
                color=cat_data['color'],
                user_id=user.id
            )
            db.session.add(category)
            print(f"Created category: {cat_data['name']}")
        
        db.session.commit()
        print("All data committed successfully")
        
        # Create access token with string identity
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'User created successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        print(f"Registration error: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = User.query.filter_by(email=data['email']).first()
        
        if user and user.check_password(data['password']):
            access_token = create_access_token(identity=str(user.id))
            return jsonify({
                'message': 'Login successful',
                'access_token': access_token,
                'user': user.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============== CATEGORY ROUTES ==============

@app.route('/api/categories', methods=['GET'])
@jwt_required()
def get_categories():
    try:
        user_id = int(get_jwt_identity())
        print(f"Categories request for user ID: {user_id}")
        categories = Category.query.filter_by(user_id=user_id).all()
        print(f"Found {len(categories)} categories: {[cat.name for cat in categories]}")
        return jsonify([cat.to_dict() for cat in categories]), 200
    except Exception as e:
        print(f"Categories error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories/create-defaults', methods=['POST'])
@jwt_required()
def create_default_categories():
    try:
        user_id = int(get_jwt_identity())  # Convert string back to int
        print(f"=== Creating default categories for user ID: {user_id} ===")
        
        # Log the incoming request
        print(f"Request method: {request.method}")
        print(f"Request headers: {dict(request.headers)}")
        print(f"Request data: {request.get_data()}")
        print(f"Request JSON: {request.get_json()}")
        
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            print(f"ERROR: User {user_id} not found")
            return jsonify({'error': 'User not found'}), 404
        
        print(f"User found: {user.email}")
        
        # Check if user already has categories
        existing_categories = Category.query.filter_by(user_id=user_id).count()
        print(f"User currently has {existing_categories} categories")
        
        if existing_categories > 0:
            print("User already has categories, returning existing ones")
            categories = Category.query.filter_by(user_id=user_id).all()
            return jsonify({
                'message': f'User already has {existing_categories} categories',
                'categories': [cat.to_dict() for cat in categories]
            }), 200
        
        # Create default categories
        default_categories = [
            {'name': 'Food & Dining', 'color': '#EF4444'},
            {'name': 'Transportation', 'color': '#F59E0B'},
            {'name': 'Entertainment', 'color': '#8B5CF6'},
            {'name': 'Shopping', 'color': '#EC4899'},
            {'name': 'Bills & Utilities', 'color': '#6B7280'},
            {'name': 'Healthcare', 'color': '#10B981'},
            {'name': 'Other', 'color': '#3B82F6'}
        ]
        
        created_categories = []
        for cat_data in default_categories:
            print(f"Creating category: {cat_data['name']}")
            
            try:
                category = Category(
                    name=cat_data['name'],
                    color=cat_data['color'],
                    user_id=user_id
                )
                db.session.add(category)
                created_categories.append(category)
                print(f"Added {cat_data['name']} to session")
            except Exception as cat_error:
                print(f"Error creating category {cat_data['name']}: {str(cat_error)}")
                raise cat_error
        
        print("Attempting to commit to database...")
        db.session.commit()
        print(f"Successfully committed {len(created_categories)} categories")
        
        # Get fresh data from database
        final_categories = Category.query.filter_by(user_id=user_id).all()
        print(f"Final category count: {len(final_categories)}")
        
        return jsonify({
            'message': 'Default categories created successfully',
            'categories': [cat.to_dict() for cat in final_categories],
            'count': len(final_categories)
        }), 201
        
    except Exception as e:
        print(f"ERROR in create_default_categories: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        print(f"Full traceback: {traceback.format_exc()}")
        db.session.rollback()
        return jsonify({
            'error': f'Failed to create categories: {str(e)}',
            'error_type': type(e).__name__
        }), 500

@app.route('/api/categories', methods=['POST'])
@jwt_required()
def create_category():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        category = Category(
            name=data['name'],
            color=data.get('color', '#3B82F6'),
            user_id=user_id
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Category created successfully',
            'category': category.to_dict()
        }), 201
        
    except Exception as e:
        print(f"Create category error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ============== EXPENSE ROUTES ==============

@app.route('/api/expenses', methods=['GET'])
@jwt_required()
def get_expenses():
    try:
        user_id = int(get_jwt_identity())
        expenses = Expense.query.filter_by(user_id=user_id).order_by(Expense.date.desc()).all()
        return jsonify([expense.to_dict() for expense in expenses]), 200
    except Exception as e:
        print(f"Get expenses error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/expenses', methods=['POST'])
@jwt_required()
def create_expense():
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        # Parse date
        expense_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        
        expense = Expense(
            amount=float(data['amount']),
            description=data['description'],
            date=expense_date,
            currency=data.get('currency', 'USD'),
            user_id=user_id,
            category_id=int(data['category_id'])
        )
        
        db.session.add(expense)
        db.session.commit()
        
        return jsonify({
            'message': 'Expense created successfully',
            'expense': expense.to_dict()
        }), 201
        
    except Exception as e:
        print(f"Create expense error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/expenses/<int:expense_id>', methods=['PUT'])
@jwt_required()
def update_expense(expense_id):
    try:
        user_id = int(get_jwt_identity())
        expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()
        
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        data = request.get_json()
        
        # Update fields if provided
        if 'amount' in data:
            expense.amount = float(data['amount'])
        if 'description' in data:
            expense.description = data['description']
        if 'date' in data:
            expense.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        if 'category_id' in data:
            expense.category_id = int(data['category_id'])
        if 'currency' in data:
            expense.currency = data['currency']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Expense updated successfully',
            'expense': expense.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Update expense error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    try:
        user_id = int(get_jwt_identity())
        expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()
        
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        db.session.delete(expense)
        db.session.commit()
        
        return jsonify({'message': 'Expense deleted successfully'}), 200
        
    except Exception as e:
        print(f"Delete expense error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ============== CURRENCY CONVERSION ==============

@app.route('/api/convert/<from_currency>/<to_currency>/<amount>', methods=['GET'])
@jwt_required()
def convert_currency(from_currency, to_currency, amount):
    try:
        url = f"https://api.exchangerate-api.com/v4/latest/{from_currency}"
        response = requests.get(url)
        data = response.json()
        
        if to_currency in data['rates']:
            rate = data['rates'][to_currency]
            converted_amount = float(amount) * rate
            return jsonify({
                'from_currency': from_currency,
                'to_currency': to_currency,
                'original_amount': float(amount),
                'converted_amount': converted_amount,
                'exchange_rate': rate
            }), 200
        else:
            return jsonify({'error': 'Currency not supported'}), 400
            
    except Exception as e:
        print(f"Currency conversion error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ============== DASHBOARD DATA ==============

@app.route('/api/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    try:
        user_id = int(get_jwt_identity())
        print(f"Dashboard request for user ID: {user_id}")
        
        # Get recent expenses
        recent_expenses = Expense.query.filter_by(user_id=user_id).order_by(Expense.date.desc()).limit(5).all()
        print(f"Found {len(recent_expenses)} recent expenses")
        
        # Get total expenses this month
        current_month = datetime.now().month
        current_year = datetime.now().year
        monthly_expenses = Expense.query.filter(
            Expense.user_id == user_id,
            db.extract('month', Expense.date) == current_month,
            db.extract('year', Expense.date) == current_year
        ).all()
        
        total_this_month = sum(expense.amount for expense in monthly_expenses)
        print(f"Total this month: ${total_this_month}")
        
        # Get expenses by category this month
        category_totals = {}
        for expense in monthly_expenses:
            if expense.category:  # Check if category exists
                cat_name = expense.category.name
                if cat_name in category_totals:
                    category_totals[cat_name] += expense.amount
                else:
                    category_totals[cat_name] = expense.amount
        
        print(f"Category breakdown: {category_totals}")
        
        return jsonify({
            'recent_expenses': [expense.to_dict() for expense in recent_expenses],
            'total_this_month': total_this_month,
            'category_breakdown': category_totals,
            'expense_count': len(monthly_expenses)
        }), 200
        
    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ============== HEALTH CHECK & DEBUG ==============

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Finance Tracker API is running',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/api/test-db', methods=['GET'])
def test_db():
    try:
        # Test basic database connection
        result = db.session.execute(text('SELECT 1')).fetchone()
        
        # Test table existence
        tables = db.session.execute(
            text("SELECT name FROM sqlite_master WHERE type='table'")
        ).fetchall()
        
        return jsonify({
            'db_connection': 'OK',
            'tables': [table[0] for table in tables],
            'test_query': result[0] if result else None
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'db_connection': 'FAILED'
        }), 500

@app.route('/api/debug/user', methods=['GET'])
@jwt_required()
def debug_user():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        categories = Category.query.filter_by(user_id=user_id).all()
        
        return jsonify({
            'user_id': user_id,
            'user_exists': user is not None,
            'user_email': user.email if user else None,
            'categories_count': len(categories),
            'categories': [cat.name for cat in categories]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/debug/token', methods=['GET'])
@jwt_required()
def debug_token():
    try:
        user_id = int(get_jwt_identity())
        return jsonify({
            'token_valid': True,
            'user_id': user_id,
            'message': 'JWT token is valid'
        }), 200
    except Exception as e:
        return jsonify({
            'token_valid': False,
            'error': str(e)
        }), 500

# Add a simple test endpoint that doesn't require authentication
@app.route('/api/test-simple', methods=['POST'])
def test_simple():
    try:
        print(f"=== Simple test endpoint ===")
        print(f"Request method: {request.method}")
        print(f"Request data: {request.get_data()}")
        print(f"Request JSON: {request.get_json()}")
        
        return jsonify({
            'message': 'Simple test successful',
            'method': request.method,
            'has_data': bool(request.get_data())
        }), 200
    except Exception as e:
        print(f"Simple test error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Test endpoint to create categories without JWT (temporary)
@app.route('/api/test-categories', methods=['POST'])
def test_create_categories():
    try:
        print(f"=== Test create categories (no JWT) ===")
        
        # Hardcode user ID 1 for testing
        user_id = 1
        
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': f'User {user_id} not found'}), 404
        
        print(f"User found: {user.email}")
        
        # Check existing categories
        existing_categories = Category.query.filter_by(user_id=user_id).count()
        print(f"User currently has {existing_categories} categories")
        
        if existing_categories > 0:
            categories = Category.query.filter_by(user_id=user_id).all()
            return jsonify({
                'message': f'User already has {existing_categories} categories',
                'categories': [cat.to_dict() for cat in categories]
            }), 200
        
        # Create one test category
        category = Category(
            name='Test Category',
            color='#FF0000',
            user_id=user_id
        )
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Test category created successfully',
            'category': category.to_dict()
        }), 201
        
    except Exception as e:
        print(f"Test categories error: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Finance Tracker API...")
    print("📊 Database: SQLite (finance_tracker.db)")
    print("🔑 Your API Key loaded successfully")
    print("🌐 Server running on: http://localhost:5000")
    app.run(debug=True, port=5000)