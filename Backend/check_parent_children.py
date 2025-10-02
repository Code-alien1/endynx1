#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edynx_backend.settings')
django.setup()

from users.models import User

def check_parent_children():
    """Check parent-child relationships in the database"""
    
    # Find all parents
    parents = User.objects.filter(role='parent')
    print(f"Found {parents.count()} parent users:")
    
    for parent in parents:
        print(f"\nParent: {parent.get_full_name()} ({parent.email}) - ID: {parent.id}")
        
        # Find children for this parent
        children = User.objects.filter(role='student', parent=parent)
        print(f"  Children: {children.count()}")
        
        for child in children:
            print(f"    - {child.get_full_name()} ({child.email}) - Level: {child.level}, Class: {child.class_name}")
    
    # Find students without parents
    orphaned_students = User.objects.filter(role='student', parent__isnull=True)
    print(f"\nStudents without parents: {orphaned_students.count()}")
    
    for student in orphaned_students:
        print(f"  - {student.get_full_name()} ({student.email}) - Level: {student.level}, Class: {student.class_name}")

def assign_children_to_parent():
    """Assign some students to the parent user"""
    
    # Find the parent user that's currently logged in (mater@parents.com)
    try:
        parent = User.objects.get(email='mater@parents.com', role='parent')
        print(f"Found parent: {parent.get_full_name()}")
        
        # Find some students to assign
        students = User.objects.filter(role='student', parent__isnull=True)[:2]  # Get first 2 unassigned students
        
        if students.exists():
            print(f"Assigning {students.count()} students to parent:")
            for student in students:
                student.parent = parent
                student.save()
                print(f"  - Assigned {student.get_full_name()} to {parent.get_full_name()}")
        else:
            print("No unassigned students found to assign to parent")
            
    except User.DoesNotExist:
        print("Parent user 'mater@parents.com' not found")

if __name__ == '__main__':
    print("=== Checking Parent-Child Relationships ===")
    check_parent_children()
    
    print("\n=== Assigning Children to Parent ===")
    assign_children_to_parent()
    
    print("\n=== Updated Parent-Child Relationships ===")
    check_parent_children()
