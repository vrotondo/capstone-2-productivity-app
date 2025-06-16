from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from datetime import datetime, date, timezone
from sqlalchemy import text
from werkzeug.security import check_password_hash
import requests
import traceback
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Import db and models from models.py
from models import db, User, Category, Expense, Budget

load_dotenv() # Load environment variables from .env file

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///finance_tracker.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-string')
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# Initialize extensions
db.init_app(app)
jwt = JWTManager(app)
CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])

# JWT Error handlers
@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token'}), 422

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Missing authorization token'}), 401

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
        db.session.flush()
        
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
        
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'User created successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Check password using Werkzeug (works with scrypt, pbkdf2, etc.)
        if check_password_hash(user.password_hash, password):
            access_token = create_access_token(identity=str(user.id))
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
        categories = Category.query.filter_by(user_id=user_id).all()
        return jsonify([cat.to_dict() for cat in categories]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories/create-defaults', methods=['POST'])
@jwt_required()
def create_default_categories():
    try:
        user_id = int(get_jwt_identity())
        
        # Check if user already has categories
        existing_categories = Category.query.filter_by(user_id=user_id).count()
        
        if existing_categories > 0:
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
            category = Category(
                name=cat_data['name'],
                color=cat_data['color'],
                user_id=user_id
            )
            db.session.add(category)
            created_categories.append(category)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Default categories created successfully',
            'categories': [cat.to_dict() for cat in created_categories]
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

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
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ============== DASHBOARD DATA ==============

@app.route('/api/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    try:
        user_id = int(get_jwt_identity())
        
        # Get recent expenses
        recent_expenses = Expense.query.filter_by(user_id=user_id).order_by(Expense.date.desc()).limit(5).all()
        
        # Get total expenses this month
        current_month = datetime.now().month
        current_year = datetime.now().year
        monthly_expenses = Expense.query.filter(
            Expense.user_id == user_id,
            db.extract('month', Expense.date) == current_month,
            db.extract('year', Expense.date) == current_year
        ).all()
        
        total_this_month = sum(expense.amount for expense in monthly_expenses)
        
        # Get expenses by category this month
        category_totals = {}
        for expense in monthly_expenses:
            if expense.category:
                cat_name = expense.category.name
                if cat_name in category_totals:
                    category_totals[cat_name] += expense.amount
                else:
                    category_totals[cat_name] = expense.amount
        
        return jsonify({
            'recent_expenses': [expense.to_dict() for expense in recent_expenses],
            'total_this_month': total_this_month,
            'category_breakdown': category_totals,
            'expense_count': len(monthly_expenses)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============== AI ASSISTANT ==============
@app.route('/api/expenses/categorize', methods=['POST'])
@jwt_required()
def categorize_expense():
    try:
        data = request.get_json()
        description = data.get('description', '').strip()
        user_id = int(get_jwt_identity())
        
        print(f"AI categorization request: '{description}' for user {user_id}")
        
        # Require minimum description length
        if len(description) < 3:
            return jsonify({'suggested_category': None}), 200
        
        # Get user's categories
        categories = Category.query.filter_by(user_id=user_id).all()
        category_names = [cat.name for cat in categories]
        print(f"User categories: {category_names}")
        
        if not category_names:
            return jsonify({'suggested_category': 'Other'}), 200
        
        # Check if Gemini is configured
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            print("ERROR: GEMINI_API_KEY not found in environment variables")
            return jsonify({
                'suggested_category': None,
                'error': 'AI configuration missing'
            }), 200
        
        print(f"Using Gemini API key: {api_key[:10]}..." if api_key else "No API key")
        
        # Use Gemini to categorize
        try:
            # Use the current model name (gemini-pro is deprecated)
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            Categorize this expense description: "{description}"
            
            Choose the BEST match from these exact categories: {', '.join(category_names)}
            
            Rules:
            - Respond with ONLY the category name, exactly as written
            - If uncertain, choose the closest match
            - For groceries/food purchases, use "Food" if available
            - For gas/car expenses, use "Transportation" if available
            - For movies/games, use "Entertainment" if available
            
            Response: """
            
            print("Sending request to Gemini...")
            response = model.generate_content(prompt)
            print(f"Gemini response: {response.text}")
            
            suggested_category = response.text.strip()
            
            # Validate the response is actually one of our categories
            if suggested_category not in category_names:
                print(f"'{suggested_category}' not in categories, finding partial match...")
                # Try to find a partial match
                suggested_category = next(
                    (cat for cat in category_names if cat.lower() in suggested_category.lower()),
                    'Other' if 'Other' in category_names else category_names[0]
                )
                print(f"Using fallback category: {suggested_category}")
            
            return jsonify({
                'suggested_category': suggested_category,
                'confidence': 'high',
                'description_analyzed': description
            }), 200
            
        except Exception as gemini_error:
            print(f"Gemini API error: {gemini_error}")
            print(f"Error type: {type(gemini_error)}")
            import traceback
            traceback.print_exc()
            
            return jsonify({
                'suggested_category': None,
                'error': f'Gemini API error: {str(gemini_error)}'
            }), 200
        
    except Exception as e:
        print(f"General AI categorization error: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        
        # Gracefully fail - don't break the expense creation
        return jsonify({
            'suggested_category': None,
            'error': f'AI suggestion error: {str(e)}'
        }), 200

@app.route('/api/test-ai', methods=['GET'])
def test_ai():
    return jsonify({'message': 'AI endpoint working'}), 200

@app.route('/api/chat', methods=['POST'])
@jwt_required()
def chat_with_ai():
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        user_id = int(get_jwt_identity())
        
        print(f"Chat request from user {user_id}: {user_message}")
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Get user's financial data
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user's expenses and categories
        expenses = Expense.query.filter_by(user_id=user_id).order_by(Expense.date.desc()).all()
        categories = Category.query.filter_by(user_id=user_id).all()
        
        # Calculate financial insights
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        # This month's expenses
        monthly_expenses = [exp for exp in expenses if exp.date.month == current_month and exp.date.year == current_year]
        total_this_month = sum(exp.amount for exp in monthly_expenses)
        
        # Category breakdown this month
        category_totals = {}
        for expense in monthly_expenses:
            if expense.category:
                cat_name = expense.category.name
                category_totals[cat_name] = category_totals.get(cat_name, 0) + expense.amount
        
        # Recent expenses (last 10)
        recent_expenses = expenses[:10]
        
        # Top spending categories (overall)
        all_category_totals = {}
        for expense in expenses:
            if expense.category:
                cat_name = expense.category.name
                all_category_totals[cat_name] = all_category_totals.get(cat_name, 0) + expense.amount
        
        # Total expenses overall
        total_expenses = sum(exp.amount for exp in expenses)
        
        # Prepare context for AI
        financial_context = {
            'total_expenses_all_time': total_expenses,
            'total_this_month': total_this_month,
            'monthly_expense_count': len(monthly_expenses),
            'category_breakdown_this_month': category_totals,
            'top_categories_overall': dict(sorted(all_category_totals.items(), key=lambda x: x[1], reverse=True)[:5]),
            'recent_expenses': [
                {
                    'amount': exp.amount,
                    'description': exp.description,
                    'category': exp.category.name if exp.category else 'Uncategorized',
                    'date': exp.date.strftime('%Y-%m-%d')
                } for exp in recent_expenses[:5]
            ],
            'available_categories': [cat.name for cat in categories],
            'user_name': user.first_name
        }
        
        # Generate AI response
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = f"""
You are a helpful personal finance assistant for {financial_context['user_name']}. Answer their question using their actual financial data.

USER QUESTION: "{user_message}"

FINANCIAL DATA:
- Total expenses (all time): ${financial_context['total_expenses_all_time']:.2f}
- Total spent this month: ${financial_context['total_this_month']:.2f}
- Number of transactions this month: {financial_context['monthly_expense_count']}

THIS MONTH'S SPENDING BY CATEGORY:
{chr(10).join([f"- {cat}: ${amount:.2f}" for cat, amount in financial_context['category_breakdown_this_month'].items()])}

TOP SPENDING CATEGORIES (OVERALL):
{chr(10).join([f"- {cat}: ${amount:.2f}" for cat, amount in financial_context['top_categories_overall'].items()])}

RECENT TRANSACTIONS:
{chr(10).join([f"- ${exp['amount']:.2f} - {exp['description']} ({exp['category']}) on {exp['date']}" for exp in financial_context['recent_expenses']])}

AVAILABLE CATEGORIES: {', '.join(financial_context['available_categories'])}

Instructions:
1. Use the actual financial data provided above to answer their question
2. Be conversational and helpful, like a friendly financial advisor
3. Provide specific numbers and insights from their data
4. If they ask about spending patterns, give actionable advice
5. If the question isn't about finances, politely redirect to financial topics
6. Keep responses concise but informative (2-4 sentences max)
7. Use a warm, encouraging tone

Response:"""
            
            print("Sending chat request to Gemini...")
            response = model.generate_content(prompt)
            ai_response = response.text.strip()
            
            print(f"AI response: {ai_response}")
            
            return jsonify({
                'response': ai_response,
                'context_used': {
                    'total_this_month': financial_context['total_this_month'],
                    'expense_count': financial_context['monthly_expense_count'],
                    'top_category_this_month': max(financial_context['category_breakdown_this_month'], key=financial_context['category_breakdown_this_month'].get) if financial_context['category_breakdown_this_month'] else None
                }
            }), 200
            
        except Exception as ai_error:
            print(f"AI chat error: {ai_error}")
            import traceback
            traceback.print_exc()
            
            # Fallback response using actual data
            if 'spend' in user_message.lower() and 'month' in user_message.lower():
                fallback_response = f"You've spent ${financial_context['total_this_month']:.2f} this month across {financial_context['monthly_expense_count']} transactions."
            elif 'category' in user_message.lower() or 'categories' in user_message.lower():
                if financial_context['category_breakdown_this_month']:
                    top_cat = max(financial_context['category_breakdown_this_month'], key=financial_context['category_breakdown_this_month'].get)
                    fallback_response = f"Your top spending category this month is {top_cat} with ${financial_context['category_breakdown_this_month'][top_cat]:.2f}."
                else:
                    fallback_response = "You haven't recorded any expenses this month yet."
            elif 'recent' in user_message.lower() or 'latest' in user_message.lower():
                if financial_context['recent_expenses']:
                    latest = financial_context['recent_expenses'][0]
                    fallback_response = f"Your most recent expense was ${latest['amount']:.2f} for {latest['description']} in the {latest['category']} category."
                else:
                    fallback_response = "You haven't recorded any expenses yet."
            else:
                fallback_response = f"I can help you analyze your spending! You've spent ${financial_context['total_this_month']:.2f} this month. Try asking about your categories, recent transactions, or spending patterns."
            
            return jsonify({
                'response': fallback_response,
                'ai_available': False
            }), 200
        
    except Exception as e:
        print(f"Chat endpoint error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to process chat message'}), 500

# Test endpoint for chat functionality
@app.route('/api/chat/test', methods=['GET'])
@jwt_required()
def test_chat():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        expense_count = Expense.query.filter_by(user_id=user_id).count()
        category_count = Category.query.filter_by(user_id=user_id).count()
        
        return jsonify({
            'message': 'Chat system ready!',
            'user': user.first_name,
            'expenses_count': expense_count,
            'categories_count': category_count
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============== HEALTH CHECK ==============

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Finance Tracker API is running'
    }), 200

if __name__ == '__main__':
    print("🚀 Starting Finance Tracker API...")
    app.run(debug=True, port=5000)