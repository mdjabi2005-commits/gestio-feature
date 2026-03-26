import sqlite3
import os
from pathlib import Path

# Path to DB
DATA_DIR = Path.home() / "analyse"
DB_PATH = DATA_DIR / "finances.db"

def migrate():
    print(f"Migrating database at {DB_PATH}")
    if not DB_PATH.exists():
        print("Database not found!")
        return

    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()

    try:
        # Check if echeance_id exists in transaction_attachments
        cursor.execute("PRAGMA table_info(transaction_attachments)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if "echeance_id" not in columns:
            print("Adding echeance_id column to transaction_attachments...")
            cursor.execute("ALTER TABLE transaction_attachments ADD COLUMN echeance_id INTEGER")
            print("Column added successfully.")
        else:
            print("Column echeance_id already exists.")

        # Optional: Rename table to 'attachments' if desired, but let's stick to what's used
        
        conn.commit()
        print("Migration complete.")
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
