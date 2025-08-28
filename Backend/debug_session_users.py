#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edynx_backend.settings')
django.setup()

from attendance.models import AttendanceSession
from django.contrib.auth import get_user_model

User = get_user_model()

print("=== SESSION CREATOR DEBUG ===")

# Check all sessions and their creators
sessions = AttendanceSession.objects.all()
print(f"Total sessions: {sessions.count()}")

for session in sessions:
    print(f"Session {session.id}:")
    print(f"  Class: {session.class_obj.name}")
    print(f"  Date: {session.date}")
    print(f"  Type: {session.session_type}")
    print(f"  Created by: {session.created_by.username if session.created_by else 'NULL'}")
    print(f"  Created by ID: {session.created_by.id if session.created_by else 'NULL'}")
    print()

print("\n=== USERS DEBUG ===")
users = User.objects.filter(role='teacher')
print(f"Teachers: {users.count()}")

for user in users:
    print(f"Teacher: {user.username} (ID: {user.id})")
    user_sessions = AttendanceSession.objects.filter(created_by=user)
    print(f"  Sessions created by this teacher: {user_sessions.count()}")

print("\n=== SESSIONS WITHOUT CREATOR ===")
null_sessions = AttendanceSession.objects.filter(created_by__isnull=True)
print(f"Sessions with NULL created_by: {null_sessions.count()}")

for session in null_sessions:
    print(f"  - {session.class_obj.name} - {session.date} - {session.session_type}")
