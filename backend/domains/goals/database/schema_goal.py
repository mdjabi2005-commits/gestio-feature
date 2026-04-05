"""
Database schema initialization for Goals table.
"""

import logging

from sqlcipher3 import dbapi2 as sqlcipher

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
                date_fin TEXT,
                categorie TEXT NOT NULL,
                description TEXT,
                statut TEXT DEFAULT 'active',
                poids_allocation REAL DEFAULT 1.0,
                date_creation TEXT,
                date_modification TEXT,
                montant_mensuel REAL
            )
        """)

        cursor.execute("PRAGMA table_info(goals)")
        columns = [col[1] for col in cursor.fetchall()]

        if "date_debut" not in columns:
            cursor.execute("ALTER TABLE goals ADD COLUMN date_debut TEXT")

        if "poids_allocation" not in columns:
            cursor.execute(
                "ALTER TABLE goals ADD COLUMN poids_allocation REAL DEFAULT 1.0"
            )

        if "montant_mensuel" not in columns:
            cursor.execute("ALTER TABLE goals ADD COLUMN montant_mensuel REAL")

        if "date_fin" not in columns and "date_echeance" in columns:
            cursor.execute("ALTER TABLE goals ADD COLUMN date_fin TEXT")
            cursor.execute(
                "UPDATE goals SET date_fin = date_echeance WHERE date_fin IS NULL"
            )

        conn.commit()
        logger.info("Goals table initialized successfully")

    except sqlcipher.Error as e:
        logger.error(f"Goals table initialization failed: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        close_connection(conn)
