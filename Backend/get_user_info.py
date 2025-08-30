#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edynx_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Check for sirvan@metor.conm user
try:
    user = User.objects.filter(email='sirvan@metor.conm').first()
    if user:
        print(f"User found:")
        print(f"Username: {user.username}")
        print(f"Email: {user.email}")
        print(f"Role: {user.role}")
        print(f"First Name: {user.first_name}")
        print(f"Last Name: {user.last_name}")
        
        # Reset password
        user.set_password('sirvan123')
        user.save()
        print(f"Password reset to: sirvan123")
    else:
        # Create user if not exists
        user = User.objects.create_user(
            username='sirvan',
            email='sirvan@metor.conm',
            password='sirvan123',
            first_name='Sirvan',
            last_name='Mentor',
            role='mentor'
        )
        print("New user created:")
        print(f"Username: {user.username}")
        print(f"Email: {user.email}")
        print(f"Password: sirvan123")
        print(f"Role: {user.role}")
        
except Exception as e:
    print(f"Error: {e}")
