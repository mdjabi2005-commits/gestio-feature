"""
Database schema initialization for Echeances table.
Unified table for both recurring and one-time due dates.
"""

import logging

from sqlcipher3 import dbapi2 as sqlcipher

from backend.shared.database.connection import get_db_connection, close_connection

logger = logging.getLogger(__name__)


def init_echeance_table(db_path: str = None) -> None:
    """
    Initialize or update the SQLite database with the 'echeances' table.
    Adds missing columns if table already exists (backward compatibility).
    """
    conn = None
    try:
        conn = get_db_connection(db_path=db_path)
        cursor = conn.cursor()

        # Create table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS echeances
            (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nom TEXT,
                type TEXT NOT NULL,
                categorie TEXT NOT NULL,
                sous_categorie TEXT,
                montant REAL NOT NULL,
                frequence TEXT,
                date_debut TEXT,
                date_fin TEXT,
                description TEXT,
                statut TEXT DEFAULT 'active',
                type_echeance TEXT DEFAULT 'recurrente',
                objectif_id INTEGER,
                date_creation TEXT,
                date_modification TEXT
            )
        """)

        # Add missing columns if they exist from old schema
        columns_to_add = {
            "nom": "TEXT",
            "frequence": "TEXT",
            "date_prevue": "TEXT",
            "date_debut": "TEXT",
            "date_fin": "TEXT",
            "objectif_id": "INTEGER",
        }

        cursor.execute("PRAGMA table_info(echeances)")
        existing_cols = [row[1] for row in cursor.fetchall()]

        for col_name, col_type in columns_to_add.items():
            if col_name not in existing_cols:
                cursor.execute(
                    f"ALTER TABLE echeances ADD COLUMN {col_name} {col_type}"
                )
                logger.info(f"Added column '{col_name}' to echeances table")

        conn.commit()
        logger.info("Echeance table initialized successfully")

    except sqlcipher.Error as e:
        from backend.config.logging_config import log_error

        log_error(e, "Echeance table initialization failed")
        if conn:
            conn.rollback()
        raise
    finally:
        close_connection(conn)
