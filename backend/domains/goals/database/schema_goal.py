"""
Database schema initialization for Goals table.
"""

import logging
import sqlite3

from backend.shared.database.connection import get_db_connection, close_connection

logger = logging.getLogger(__name__)


def init_goal_table(db_path: str = None) -> None:
    """
    Initialize or update the SQLite database with the 'goals' table.
    """
    conn = None
    try:
        conn = get_db_connection(db_path=db_path)
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nom TEXT NOT NULL,
                montant_cible REAL NOT NULL,
                date_echeance TEXT,
                categorie TEXT NOT NULL,
                description TEXT,
                statut TEXT DEFAULT 'active',
                date_creation TEXT,
                date_modification TEXT
            )
        """)

        conn.commit()
        logger.info("Goals table initialized successfully")

    except sqlite3.Error as e:
        logger.error(f"Goals table initialization failed: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        close_connection(conn)
