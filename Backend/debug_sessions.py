#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edynx_backend.settings')
django.setup()

from attendance.models import AttendanceSession, Class
from users.models import User

def debug_sessions():
    print("=== DEBUG: All Sessions in Database ===")
    sessions = AttendanceSession.objects.all()
    print(f"Total sessions: {sessions.count()}")
    
    for session in sessions:
        print(f"Session {session.id}:")
        print(f"  Class: {session.class_obj.name}")
        print(f"  Date: {session.date}")
        print(f"  Created by: {session.created_by.username} (role: {session.created_by.role})")
        print(f"  Active: {session.is_active}")
        print()
    
    print("=== DEBUG: All Users ===")
    users = User.objects.all()
    for user in users:
        class_name = getattr(user, 'class_name', 'None')
        print(f"User: {user.username} (role: {user.role}, class: {class_name})")
    
    print("\n=== DEBUG: All Classes ===")
    classes = Class.objects.all()
    for cls in classes:
        student_count = cls.students.count()
        print(f"Class: {cls.name} (students: {student_count})")
        for student in cls.students.all():
            print(f"  - {student.username}")
    
    print("\n=== DEBUG: Student Session Filtering Test ===")
    student = User.objects.filter(role='student').first()
    if student:
        print(f"Testing with student: {student.username} (class: {getattr(student, 'class_name', 'None')})")
        
        # Test class name filtering
        if hasattr(student, 'class_name') and student.class_name:
            matching_sessions = AttendanceSession.objects.filter(class_obj__name=student.class_name)
            print(f"Sessions matching class name '{student.class_name}': {matching_sessions.count()}")
            for session in matching_sessions:
                print(f"  - {session.class_obj.name} on {session.date}")
        
        # Test ManyToMany filtering
        enrolled_sessions = AttendanceSession.objects.filter(class_obj__students=student)
        print(f"Sessions via ManyToMany enrollment: {enrolled_sessions.count()}")

if __name__ == '__main__':
    debug_sessions()
