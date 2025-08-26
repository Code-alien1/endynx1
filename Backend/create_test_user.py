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

def create_test_user():
    try:
        # Check if test user already exists
        if User.objects.filter(email='test@edynx.com').exists():
            print("Test user already exists!")
            user = User.objects.get(email='test@edynx.com')
            print(f"Email: {user.email}")
            print(f"Password: testpass123")
            print(f"Role: {user.role}")
            return
        
        # Create test user
        user = User.objects.create_user(
            email='test@edynx.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User',
            role='student',
            student_id='STU001',
            level=1,
            class_name='Class A'
        )
        
        print("Test user created successfully!")
        print(f"Email: {user.email}")
        print(f"Password: testpass123")
        print(f"Role: {user.role}")
        
    except Exception as e:
        print(f"Error creating test user: {e}")

if __name__ == '__main__':
    create_test_user()
