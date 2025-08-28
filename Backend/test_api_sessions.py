#!/usr/bin/env python
import os
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edynx_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from attendance.models import AttendanceSession, Class
from attendance.serializers import AttendanceSessionSerializer

User = get_user_model()

print("=== TESTING SESSION API ===")

# Check database directly
print("\n1. Database Check:")
sessions = AttendanceSession.objects.all()
print(f"Total sessions in DB: {sessions.count()}")

for session in sessions:
    print(f"  - ID: {session.id}")
    print(f"    Class: {session.class_obj.name}")
    print(f"    Date: {session.date}")
    print(f"    Type: {session.session_type}")
    print(f"    Active: {session.is_active}")
    print(f"    Created by: {session.created_by.username if session.created_by else 'None'}")
    print()

# Test serializer
print("\n2. Serializer Test:")
serializer = AttendanceSessionSerializer(sessions, many=True)
serialized_data = serializer.data
print(f"Serialized sessions count: {len(serialized_data)}")
print("Serialized data:")
print(json.dumps(serialized_data, indent=2, default=str))

# Test API endpoint with different users
print("\n3. API Endpoint Test:")
users = User.objects.all()[:3]  # Test with first 3 users

for user in users:
    print(f"\nTesting with user: {user.username} (role: {user.role})")
    
    # Simulate the view logic
    from attendance.views import AttendanceSessionListView
    
    # Create a mock request
    class MockRequest:
        def __init__(self, user):
            self.user = user
    
    view = AttendanceSessionListView()
    view.request = MockRequest(user)
    
    queryset = view.get_queryset()
    print(f"  Queryset count: {queryset.count()}")
    
    for session in queryset:
        print(f"    - {session.class_obj.name} - {session.date} - {session.session_type}")

print("\n=== TEST COMPLETE ===")
