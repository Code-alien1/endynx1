#!/usr/bin/env python
import os
import sys
import django
import requests

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edynx_backend.settings')
django.setup()

from attendance.models import Class
from users.models import User

def populate_classes():
    print("=== Populating Classes ===")
    
    # Get or create a teacher
    teacher, created = User.objects.get_or_create(
        email='default.teacher@edynx.com',
        defaults={
            'username': 'default_teacher',
            'first_name': 'Default',
            'last_name': 'Teacher',
            'role': 'teacher',
            'is_active': True,
        }
    )
    
    if created:
        teacher.set_password('defaultpassword123')
        teacher.save()
        print(f"Created teacher: {teacher.email}")
    else:
        print(f"Using existing teacher: {teacher.email}")
    
    # Create classes
    classes_data = [
        {'name': 'BA1A', 'level': 1},
        {'name': 'BA1B', 'level': 1},
        {'name': 'BA1C', 'level': 1},
        {'name': 'BA1D', 'level': 1},
        {'name': 'BA2A', 'level': 2},
        {'name': 'BA2B', 'level': 2},
    ]
    
    created_count = 0
    for class_data in classes_data:
        class_obj, created = Class.objects.get_or_create(
            name=class_data['name'],
            defaults={
                'level': class_data['level'],
                'teacher': teacher,
            }
        )
        if created:
            created_count += 1
            print(f"Created: {class_obj.name} (ID: {class_obj.id}, Level {class_obj.level})")
        else:
            print(f"Exists: {class_obj.name} (ID: {class_obj.id}, Level {class_obj.level})")
    
    print(f"\nTotal classes in DB: {Class.objects.count()}")
    return Class.objects.all()

def test_api():
    print("\n=== Testing Predefined Classes API ===")
    try:
        response = requests.get('http://localhost:8000/api/attendance/predefined-classes/')
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            classes = data.get('classes', [])
            print(f"Number of classes returned: {len(classes)}")
            for cls in classes:
                print(f"  - {cls.get('label')} (ID: {cls.get('value')}, Level: {cls.get('level')})")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"API test failed: {e}")

if __name__ == '__main__':
    classes = populate_classes()
    test_api()
