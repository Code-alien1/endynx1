#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edynx_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Create/update test users
users_to_create = [
    {
        'email': 'test@example.com',
        'username': 'testuser',
        'password': 'test123',
        'first_name': 'Test',
        'last_name': 'User',
        'role': 'student'
    },
    {
        'email': 'sirvan@metor.conm',
        'username': 'sirvan',
        'password': 'sirvan123',
        'first_name': 'Sirvan',
        'last_name': 'Mentor',
        'role': 'mentor'
    },
    {
        'email': 'admin@edynx.com',
        'username': 'admin',
        'password': 'admin123',
        'first_name': 'Admin',
        'last_name': 'User',
        'role': 'superadmin'
    }
]

for user_data in users_to_create:
    user, created = User.objects.get_or_create(
        email=user_data['email'],
        defaults={
            'username': user_data['username'],
            'first_name': user_data['first_name'],
            'last_name': user_data['last_name'],
            'role': user_data['role']
        }
    )
    user.set_password(user_data['password'])
    user.is_active = True
    if user_data['role'] == 'superadmin':
        user.is_superuser = True
        user.is_staff = True
    user.save()
    
    print(f"User: {user.email} / {user_data['password']} ({'created' if created else 'updated'})")

print("\nAll users created successfully!")
print("Available login credentials:")
print("- test@example.com / test123 (student)")
print("- sirvan@metor.conm / sirvan123 (mentor)")  
print("- admin@edynx.com / admin123 (superadmin)")
