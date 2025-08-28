#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edynx_backend.settings')
django.setup()

from attendance.models import Class
from users.models import User

def main():
    print("Creating classes...")
    
    # Get or create a teacher
    teacher, created = User.objects.get_or_create(
        username='default_teacher',
        defaults={
            'email': 'teacher@edynx.com',
            'role': 'teacher',
            'first_name': 'Default',
            'last_name': 'Teacher',
            'is_active': True
        }
    )
    
    if created:
        teacher.set_password('password123')
        teacher.save()
        print(f"Created teacher: {teacher.username}")
    else:
        print(f"Using existing teacher: {teacher.username}")
    
    # Create classes
    classes_data = [
        {'name': 'BA1A', 'level': 1},
        {'name': 'BA1B', 'level': 1},
        {'name': 'BA1C', 'level': 1},
        {'name': 'BA1D', 'level': 1},
        {'name': 'BA2A', 'level': 2},
        {'name': 'BA2B', 'level': 2},
    ]
    
    for class_info in classes_data:
        class_obj, created = Class.objects.get_or_create(
            name=class_info['name'],
            defaults={
                'level': class_info['level'],
                'teacher': teacher
            }
        )
        status = "created" if created else "exists"
        print(f"{class_info['name']}: {class_obj.id} ({status})")
    
    print(f"\nTotal classes in database: {Class.objects.count()}")
    
    # List all classes with UUIDs
    print("\nAll classes with UUIDs:")
    for cls in Class.objects.all():
        print(f"  {cls.name}: {cls.id}")

if __name__ == '__main__':
    main()
