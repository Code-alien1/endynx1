import sqlite3
import os

try:
    # Connect to database
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()

    # Create the missing table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS edynx_admin_adminaction (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action_type VARCHAR(50) NOT NULL,
            description TEXT NOT NULL,
            timestamp DATETIME NOT NULL,
            admin_user_id CHAR(32) NOT NULL,
            target_user_id CHAR(32)
        )
    ''')

    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS edynx_admin_adminaction_admin_user_id_8c5f1e5c ON edynx_admin_adminaction (admin_user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS edynx_admin_adminaction_target_user_id_7c8b9d4e ON edynx_admin_adminaction (target_user_id)')

    # Mark migration as applied
    cursor.execute('''
        INSERT OR IGNORE INTO django_migrations (app, name, applied) 
        VALUES ('edynx_admin', '0001_initial', datetime('now'))
    ''')

    conn.commit()

    # Verify table was created
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='edynx_admin_adminaction'")
    result = cursor.fetchone()

    if result:
        print("✅ edynx_admin_adminaction table created successfully")
    else:
        print("❌ Failed to create table")

    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    if 'conn' in locals():
        conn.close()
