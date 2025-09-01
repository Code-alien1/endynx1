#!/usr/bin/env python
import os
import sqlite3
import time

def fix_database_lock():
    db_path = 'db.sqlite3'
    
    # Check if database file exists
    if not os.path.exists(db_path):
        print(f"❌ Database file {db_path} not found")
        return
    
    try:
        # Try to connect and check if database is accessible
        conn = sqlite3.connect(db_path, timeout=10.0)
        cursor = conn.cursor()
        
        # Test basic query
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1;")
        result = cursor.fetchone()
        
        # Create the missing admin table if needed
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='edynx_admin_adminaction';")
        admin_table = cursor.fetchone()
        
        if not admin_table:
            print("Creating missing edynx_admin_adminaction table...")
            cursor.execute('''
                CREATE TABLE edynx_admin_adminaction (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    action_type VARCHAR(50) NOT NULL,
                    description TEXT NOT NULL,
                    timestamp DATETIME NOT NULL,
                    admin_user_id CHAR(32) NOT NULL,
                    target_user_id CHAR(32)
                )
            ''')
            
            cursor.execute('CREATE INDEX edynx_admin_adminaction_admin_user_id_8c5f1e5c ON edynx_admin_adminaction (admin_user_id)')
            cursor.execute('CREATE INDEX edynx_admin_adminaction_target_user_id_7c8b9d4e ON edynx_admin_adminaction (target_user_id)')
            
            # Mark migration as applied
            cursor.execute('''
                INSERT OR IGNORE INTO django_migrations (app, name, applied) 
                VALUES ('edynx_admin', '0001_initial', datetime('now'))
            ''')
            
            conn.commit()
            print("✅ Admin table created successfully")
        else:
            print("✅ Admin table already exists")
        
        # Run VACUUM to optimize database and release locks
        cursor.execute("VACUUM;")
        
        conn.close()
        print("✅ Database is accessible and optimized")
        
    except sqlite3.OperationalError as e:
        if "database is locked" in str(e):
            print("❌ Database is locked. Attempting to fix...")
            
            # Try to identify and remove lock files
            lock_files = [f"{db_path}-wal", f"{db_path}-shm", f"{db_path}-journal"]
            for lock_file in lock_files:
                if os.path.exists(lock_file):
                    try:
                        os.remove(lock_file)
                        print(f"Removed lock file: {lock_file}")
                    except Exception as ex:
                        print(f"Could not remove {lock_file}: {ex}")
            
            # Wait a moment and try again
            time.sleep(2)
            try:
                conn = sqlite3.connect(db_path, timeout=10.0)
                cursor = conn.cursor()
                cursor.execute("SELECT 1;")
                conn.close()
                print("✅ Database lock resolved")
            except Exception as ex:
                print(f"❌ Database still locked: {ex}")
        else:
            print(f"❌ Database error: {e}")
    
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    fix_database_lock()
