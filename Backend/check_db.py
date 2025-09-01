#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edynx_backend.settings')
django.setup()

from django.db import connection

def check_admin_tables():
    cursor = connection.cursor()
    
    # Check for admin-related tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%admin%';")
    admin_tables = cursor.fetchall()
    
    print("Admin-related tables:")
    for table in admin_tables:
        print(f"  {table[0]}")
    
    # Check specifically for edynx_admin_adminaction
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='edynx_admin_adminaction';")
    result = cursor.fetchone()
    
    if result:
        print("\n✅ edynx_admin_adminaction table exists")
    else:
        print("\n❌ edynx_admin_adminaction table is missing")
        
    # Check migration status
    cursor.execute("SELECT app, name FROM django_migrations WHERE app='edynx_admin';")
    migrations = cursor.fetchall()
    
    print(f"\nEdynx_admin migrations applied:")
    for migration in migrations:
        print(f"  {migration[0]}: {migration[1]}")

if __name__ == "__main__":
    check_admin_tables()
