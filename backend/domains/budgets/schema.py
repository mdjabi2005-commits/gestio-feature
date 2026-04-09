"""
Database schema initialization for Budgets table.
"""

import logging
from sqlcipher3 import dbapi2 as sqlcipher
from backend.shared.database import db_transaction

logger = logging.getLogger(__name__)


def init_budgets_table(db_path: str = None) -> None:
    """Initialize the budgets table."""
    try:
        with db_transaction(db_path) as conn:
            cursor = conn.cursor()

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS budgets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    categorie TEXT UNIQUE NOT NULL,
                    montant_max REAL NOT NULL,
                    date_creation TEXT NOT NULL
                )
            """)

            cursor.execute(
                "CREATE INDEX IF NOT EXISTS idx_budgets_categorie ON budgets(categorie)"
            )

        logger.info("Budgets table initialized successfully")
    except sqlcipher.Error as e:
        logger.error(f"Budgets table initialization failed: {e}")
        raise
