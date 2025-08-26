#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edynx_backend.settings')
django.setup()

from users.models import User

def create_qwertz_user():
    try:
        # Check if user already exists
        if User.objects.filter(email='test@qwertz.com').exists():
            print("User test@qwertz.com already exists!")
            user = User.objects.get(email='test@qwertz.com')
            print(f"Email: {user.email}")
            print(f"Password: 12345678")
            print(f"Role: {user.role}")
            return
        
        # Create the user you're trying to login with
        user = User.objects.create_user(
            email='test@qwertz.com',
            username='qwertzuser',
            password='12345678',
            first_name='Qwertz',
            last_name='Test',
            role='student',
            student_id='STU002',
            level=1,
            class_name='Class B'
        )
        
        print("User test@qwertz.com created successfully!")
        print(f"Email: {user.email}")
        print(f"Password: 12345678")
        print(f"Role: {user.role}")
        
    except Exception as e:
        print(f"Error creating user: {e}")

if __name__ == '__main__':
    create_qwertz_user()