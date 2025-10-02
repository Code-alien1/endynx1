import sqlite3
import uuid

def assign_children_to_parent():
    """Assign children to parent user directly via database"""
    
    # Connect to the database
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()
    
    try:
        # Find the parent user
        cursor.execute("SELECT id, email, first_name, last_name FROM users WHERE email = 'mater@parents.com' AND role = 'parent'")
        parent = cursor.fetchone()
        
        if not parent:
            print("Parent user 'mater@parents.com' not found")
            return
        
        parent_id = parent[0]
        print(f"Found parent: {parent[2]} {parent[3]} ({parent[1]}) - ID: {parent_id}")
        
        # Check current children
        cursor.execute("SELECT id, email, first_name, last_name FROM users WHERE role = 'student' AND parent_id = ?", (parent_id,))
        current_children = cursor.fetchall()
        
        print(f"Current children: {len(current_children)}")
        for child in current_children:
            print(f"  - {child[2]} {child[3]} ({child[1]})")
        
        if len(current_children) == 0:
            # Find unassigned students
            cursor.execute("SELECT id, email, first_name, last_name FROM users WHERE role = 'student' AND parent_id IS NULL LIMIT 2")
            students = cursor.fetchall()
            
            print(f"Found {len(students)} unassigned students to assign:")
            
            for student in students:
                student_id = student[0]
                cursor.execute("UPDATE users SET parent_id = ? WHERE id = ?", (parent_id, student_id))
                print(f"  - Assigned {student[2]} {student[3]} ({student[1]}) to parent")
            
            conn.commit()
            print("Children assigned successfully!")
        else:
            print("Parent already has children assigned")
            
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    assign_children_to_parent()
