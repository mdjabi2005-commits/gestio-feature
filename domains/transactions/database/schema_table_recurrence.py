"""
Database schema initialization for Recurrences table.
"""

import logging
import sqlite3

from shared.database.connection import get_db_connection, close_connection

logger = logging.getLogger(__name__)


def init_recurrence_table(db_path: str = None) -> None:
    """
    Initialize or update the SQLite database with the 'recurrences' table.

    Args:
        db_path: Optional custom database path (for testing).
    """
    conn = None
    try:
        conn = get_db_connection(db_path=db_path)
        cursor = conn.cursor()

        # Create the table with the correct schema
        cursor.execute("""
                       CREATE TABLE IF NOT EXISTS recurrences
                       (
                           id
                           INTEGER
                           PRIMARY
                           KEY
                           AUTOINCREMENT,
                           type
                           TEXT
                           NOT
                           NULL,
                           categorie
                           TEXT
                           NOT
                           NULL,
                           sous_categorie
                           TEXT,
                           montant
                           REAL
                           NOT
                           NULL,
                           date_debut
                           TEXT
                           NOT
                           NULL,
                           date_fin
                           TEXT,
                           frequence
                           TEXT
                           NOT
                           NULL,
                           description
                           TEXT,
                           statut
                           TEXT
                           DEFAULT
                           'active',
                           date_creation
                           TEXT,
                           date_modification
                           TEXT
                       )
                       """)

        # Verify columns exist (for backward compatibility / evolution)
        # Add 'sous_categorie' if missing
        try:
            cursor.execute("SELECT sous_categorie FROM recurrences LIMIT 1")
        except sqlite3.OperationalError:
            cursor.execute("ALTER TABLE recurrences ADD COLUMN sous_categorie TEXT")
            logger.info("Added 'sous_categorie' column to recurrences table")

        conn.commit()
        logger.info("Recurrence table initialized successfully")

    except sqlite3.Error as e:
        from config.logging_config import log_error
        log_error(e, "Recurrence table initialization failed")
        if conn:
            conn.rollback()
        raise
    finally:
        close_connection(conn)
