import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edynx_backend.settings')
django.setup()

from attendance.models import AttendanceSession
from django.contrib.auth import get_user_model

User = get_user_model()

print("=== QUICK SESSION TEST ===")
sessions = AttendanceSession.objects.all()
print(f"Total sessions: {sessions.count()}")

for session in sessions:
    print(f"Session: {session.class_obj.name} - {session.date} - {session.session_type} - Active: {session.is_active}")

print("\n=== USER TEST ===")
users = User.objects.all()[:3]
for user in users:
    print(f"User: {user.username} - Role: {user.role} - Class: {getattr(user, 'class_name', 'None')}")
