#!/usr/bin/env python
import os
import django
import sqlite3

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edynx_backend.settings')
django.setup()

from django.conf import settings

def create_admin_table():
    # Get database path from Django settings
    db_path = settings.DATABASES['default']['NAME']
    print(f"Database path: {db_path}")
    
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='edynx_admin_adminaction';")
        result = cursor.fetchone()
        
        if not result:
            print('Creating edynx_admin_adminaction table...')
            
            # Create the table
            cursor.execute('''
                CREATE TABLE "edynx_admin_adminaction" (
                    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
                    "action_type" varchar(50) NOT NULL,
                    "description" text NOT NULL,
                    "timestamp" datetime NOT NULL,
                    "admin_user_id" char(32) NOT NULL,
                    "target_user_id" char(32)
                );
            ''')
            
            # Create indexes
            cursor.execute('CREATE INDEX "edynx_admin_adminaction_admin_user_id_8c5f1e5c" ON "edynx_admin_adminaction" ("admin_user_id");')
            cursor.execute('CREATE INDEX "edynx_admin_adminaction_target_user_id_7c8b9d4e" ON "edynx_admin_adminaction" ("target_user_id");')
            
            # Mark migration as applied in django_migrations table
            cursor.execute('''
                INSERT OR IGNORE INTO django_migrations (app, name, applied) 
                VALUES ('edynx_admin', '0001_initial', datetime('now'));
            ''')
            
            conn.commit()
            print('✅ Table created successfully!')
        else:
            print('✅ Table already exists')
        
        # Verify table structure
        cursor.execute("PRAGMA table_info(edynx_admin_adminaction);")
        columns = cursor.fetchall()
        print(f"\nTable structure ({len(columns)} columns):")
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
            
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    create_admin_table()
