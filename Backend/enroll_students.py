#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edynx_backend.settings')
django.setup()

from attendance.models import Class
from users.models import User

def enroll_students():
    print("=== Enrolling Students in Classes ===")
    
    # Get all students with class_name
    students = User.objects.filter(role='student', class_name__isnull=False)
    print(f"Found {students.count()} students with class assignments")
    
    enrolled_count = 0
    for student in students:
        if student.class_name:
            try:
                # Find the class by name
                class_obj = Class.objects.get(name=student.class_name)
                
                # Add student to class if not already enrolled
                if not class_obj.students.filter(id=student.id).exists():
                    class_obj.students.add(student)
                    enrolled_count += 1
                    print(f"Enrolled {student.get_full_name()} in {class_obj.name}")
                else:
                    print(f"{student.get_full_name()} already enrolled in {class_obj.name}")
                    
            except Class.DoesNotExist:
                print(f"Warning: Class '{student.class_name}' not found for student {student.get_full_name()}")
    
    print(f"\nEnrolled {enrolled_count} new students")
    
    # Show enrollment summary
    print("\n=== Enrollment Summary ===")
    for class_obj in Class.objects.all():
        student_count = class_obj.students.count()
        print(f"{class_obj.name}: {student_count} students")
        for student in class_obj.students.all():
            print(f"  - {student.get_full_name()}")

if __name__ == '__main__':
    enroll_students()
