#!/usr/bin/env python
import os
import sys
import os
import django
import requests

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edynx_backend.settings')
django.setup()

from attendance.models import Class
from users.models import User

def populate_classes():
    print("=== Creating Classes ===")
    
    # Create teacher
    teacher, created = User.objects.get_or_create(
        username='teacher1',
        defaults={
            'email': 'teacher@test.com',
            'role': 'teacher',
            'first_name': 'Test',
            'last_name': 'Teacher'
        }
    )
    
    if created:
        teacher.set_password('password123')
        teacher.save()
        print(f"Created teacher: {teacher.username}")
    else:
        print(f"Using existing teacher: {teacher.username}")

    # Create classes
    classes = ['BA1A', 'BA1B', 'BA1C', 'BA1D', 'BA2A', 'BA2B']
    for name in classes:
        level = 1 if name.startswith('BA1') else 2
        cls, created = Class.objects.get_or_create(
            name=name,
            defaults={'level': level, 'teacher': teacher}
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
            print(f"Created: {class_obj.name} (Level {class_obj.level})")
        else:
            print(f"Exists: {class_obj.name} (Level {class_obj.level})")
    
    print(f"\nTotal classes in DB: {Class.objects.count()}")
    print("All classes:")
    for c in Class.objects.all():
        print(f"  - {c.name} (Level {c.level}, Teacher: {c.teacher.username if c.teacher else 'None'})")

def test_api():
    print("\nTesting predefined classes API...")
    from attendance.views import PredefinedClassesView
    from django.test import RequestFactory
    from django.contrib.auth.models import AnonymousUser
    
    factory = RequestFactory()
    request = factory.get('/api/attendance/predefined-classes/')
    request.user = AnonymousUser()
    
    view = PredefinedClassesView()
    response = view.get(request)
    print(f"API Response status: {response.status_code}")
    print(f"API Response data: {response.data}")

if __name__ == '__main__':
    populate_classes()
    test_api()
