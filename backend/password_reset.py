#!/usr/bin/env python3
"""
Simple script to reset a user's password in the Finance Tracker app
Run this from the backend directory: python password_reset.py
"""

import sys
import os
from werkzeug.security import generate_password_hash

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import db, User

def reset_password(email, new_password):
    """Reset a user's password"""
    with app.app_context():
        try:
            # Find the user
            user = User.query.filter_by(email=email).first()
            
            if not user:
                print(f"❌ User not found: {email}")
                return False
            
            print(f"✅ User found: {user.email} (ID: {user.id})")
            print(f"📝 Old password hash: {user.password_hash[:30]}...")
            
            # Set new password hash
            user.password_hash = generate_password_hash(new_password)
            
            # Save to database
            db.session.commit()
            
            print(f"🔑 New password hash: {user.password_hash[:30]}...")
            print(f"✅ Password reset successful for {email}")
            print(f"🔐 You can now log in with the new password")
            
            return True
            
        except Exception as e:
            print(f"❌ Error resetting password: {e}")
            db.session.rollback()
            return False

if __name__ == "__main__":
    print("🔧 Finance Tracker Password Reset Tool")
    print("=" * 40)
    
    # Get user input
    email = input("Enter email address: ").strip()
    if not email:
        print("❌ Email is required")
        sys.exit(1)
    
    password = input("Enter new password: ").strip()
    if not password:
        print("❌ Password is required")
        sys.exit(1)
    
    # Reset the password
    success = reset_password(email, password)
    
    if success:
        print("\n🎉 Password reset complete!")
        print("💡 You can now log in to the app with your new password.")
    else:
        print("\n💥 Password reset failed!")
        print("💡 Check the error messages above.")