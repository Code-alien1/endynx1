#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edynx_backend.settings')
django.setup()

from django.db import connection
from django.core.management import execute_from_command_line

def fix_admin_table():
    cursor = connection.cursor()
    
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='edynx_admin_adminaction';")
    result = cursor.fetchone()
    
    if not result:
        print('❌ edynx_admin_adminaction table missing. Creating...')
        
        # Create the table manually with correct schema
        cursor.execute('''
            CREATE TABLE "edynx_admin_adminaction" (
                "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
                "action_type" varchar(50) NOT NULL,
                "description" text NOT NULL,
                "timestamp" datetime NOT NULL,
                "admin_user_id" char(32) NOT NULL REFERENCES "users_user" ("id") DEFERRABLE INITIALLY DEFERRED,
                "target_user_id" char(32) REFERENCES "users_user" ("id") DEFERRABLE INITIALLY DEFERRED
            );
        ''')
        
        # Create indexes
        cursor.execute('CREATE INDEX "edynx_admin_adminaction_admin_user_id_8c5f1e5c" ON "edynx_admin_adminaction" ("admin_user_id");')
        cursor.execute('CREATE INDEX "edynx_admin_adminaction_target_user_id_7c8b9d4e" ON "edynx_admin_adminaction" ("target_user_id");')
        
        # Mark migration as applied
        cursor.execute('''
            INSERT OR IGNORE INTO django_migrations (app, name, applied) 
            VALUES ('edynx_admin', '0001_initial', datetime('now'));
        ''')
        
        print('✅ Table created successfully!')
    else:
        print('✅ edynx_admin_adminaction table already exists')
    
    # Verify table structure
    cursor.execute("PRAGMA table_info(edynx_admin_adminaction);")
    columns = cursor.fetchall()
    print(f"\nTable structure ({len(columns)} columns):")
    for col in columns:
        print(f"  {col[1]} ({col[2]})")

if __name__ == "__main__":
    fix_admin_table()
