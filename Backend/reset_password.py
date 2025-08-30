#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edynx_backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Find or create superuser
try:
    admin = User.objects.filter(is_superuser=True).first()
    if admin:
        admin.set_password('admin123')
        admin.save()
        print(f"Password reset for superuser: {admin.username}")
        print("New password: admin123")
    else:
        # Create new superuser
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@edynx.com',
            password='admin123',
            first_name='Admin',
            last_name='User',
            role='superadmin'
        )
        print("New superuser created:")
        print(f"Username: {admin.username}")
        print("Password: admin123")
        print(f"Email: {admin.email}")
        
except Exception as e:
    print(f"Error: {e}")
