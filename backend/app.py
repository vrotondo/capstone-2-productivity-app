from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from datetime import datetime, date
import requests
import os

# Import db and models from models.py (no circular import now)
from models import db, User, Category, Expense, Budget

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///finance_tracker.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'jwt-secret-string'

# Initialize extensions with app
db.init_app(app)
jwt = JWTManager(app)
CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])

# Your API key for currency conversion
EXCHANGE_API_KEY = 'wCoOoTtNOghmt2oqx792'
EXCHANGE_API_KEY = os.getenv('EXCHANGE_API_KEY', 'your-default-key')

# Create tables
with app.app_context():
    try:
        db.create_all()
        print("Database tables created successfully!")
    except Exception as e:
        print(f"Database creation error: {e}")

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
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'User created successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        print(f"Registration error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = User.query.filter_by(email=data['email']).first()
        
        if user and user.check_password(data['password']):
            access_token = create_access_token(identity=user.id)
            return jsonify({
                'message': 'Login successful',
                'access_token': access_token,
                'user': user.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
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
        user_id = get_jwt_identity()
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
        user_id = get_jwt_identity()
        print(f"Creating default categories for user ID: {user_id}")
        
        # Check if user already has categories
        existing_categories = Category.query.filter_by(user_id=user_id).count()
        if existing_categories > 0:
            return jsonify({'message': f'User already has {existing_categories} categories'}), 200
        
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
            category = Category(
                name=cat_data['name'],
                color=cat_data['color'],
                user_id=user_id
            )
            db.session.add(category)
            created_categories.append(cat_data['name'])
        
        db.session.commit()
        print(f"Created categories: {created_categories}")
        
        return jsonify({
            'message': 'Default categories created successfully',
            'categories': created_categories
        }), 201
        
    except Exception as e:
        print(f"Create default categories error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories', methods=['POST'])
@jwt_required()
def create_category():
    try:
        user_id = get_jwt_identity()
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
        return jsonify({'error': str(e)}), 500

# ============== EXPENSE ROUTES ==============

@app.route('/api/expenses', methods=['GET'])
@jwt_required()
def get_expenses():
    try:
        user_id = get_jwt_identity()
        expenses = Expense.query.filter_by(user_id=user_id).order_by(Expense.date.desc()).all()
        return jsonify([expense.to_dict() for expense in expenses]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/expenses', methods=['POST'])
@jwt_required()
def create_expense():
    try:
        user_id = get_jwt_identity()
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
        return jsonify({'error': str(e)}), 500

@app.route('/api/expenses/<int:expense_id>', methods=['PUT'])
@jwt_required()
def update_expense(expense_id):
    try:
        user_id = get_jwt_identity()
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
        return jsonify({'error': str(e)}), 500

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    try:
        user_id = get_jwt_identity()
        expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()
        
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        db.session.delete(expense)
        db.session.commit()
        
        return jsonify({'message': 'Expense deleted successfully'}), 200
        
    except Exception as e:
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
        return jsonify({'error': str(e)}), 500

# ============== DASHBOARD DATA ==============

@app.route('/api/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    try:
        user_id = get_jwt_identity()
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

@app.route('/api/debug/user', methods=['GET'])
@jwt_required()
def debug_user():
    try:
        user_id = get_jwt_identity()
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

if __name__ == '__main__':
    print("🚀 Starting Finance Tracker API...")
    print("📊 Database: SQLite (finance_tracker.db)")
    print("🔑 Your API Key loaded successfully")
    print("🌐 Server running on: http://localhost:5000")
    app.run(debug=True, port=5000)