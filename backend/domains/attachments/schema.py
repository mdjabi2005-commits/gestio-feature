"""
Database schema initialization for Attachments table.
"""

import logging
from sqlcipher3 import dbapi2 as sqlcipher
from backend.shared.database import db_transaction

logger = logging.getLogger(__name__)


def add_column_if_missing(
    cursor: sqlcipher.Cursor,
    table: str,
    column: str,
    default: str = None,
) -> bool:
    """
    Ajoute une colonne à une table si elle n'existe pas.
    """
    try:
        col_def = f"ALTER TABLE {table} ADD COLUMN {column}"
        if default:
            col_def += f" DEFAULT {default}"
        cursor.execute(col_def)
        logger.info(f"Added '{column}' column to {table} table")
        return True
    except sqlcipher.OperationalError:
        return False


def create_index_if_not_exists(
    cursor: sqlcipher.Cursor,
    index_name: str,
    table: str,
    columns: str,
) -> None:
    """Crée un index s'il n'existe pas déjà."""
    try:
        cursor.execute(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table}({columns})")
        logger.info(f"Created index {index_name}")
    except sqlcipher.OperationalError:
        pass


def init_attachments_table(db_path: str = None) -> None:
    """Initialize the attachments table."""
    try:
        with db_transaction(db_path) as conn:
            cursor = conn.cursor()

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS transaction_attachments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    transaction_id INTEGER,
                    echeance_id INTEGER,
                    objectif_id INTEGER,
                    file_path TEXT NOT NULL,
                    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
                )
            """)

            add_column_if_missing(cursor, "transaction_attachments", "objectif_id")

            # Migration check: if file_name or upload_date exists, we need to migrate to new structure
            cursor.execute("PRAGMA table_info(transaction_attachments)")
            columns = [col[1] for col in cursor.fetchall()]
            if "file_name" in columns or "upload_date" in columns:
                logger.info("Migrating transaction_attachments to simplified schema...")
                cursor.execute(
                    "ALTER TABLE transaction_attachments RENAME TO transaction_attachments_old"
                )
                cursor.execute("""
                    CREATE TABLE transaction_attachments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        transaction_id INTEGER,
                        echeance_id INTEGER,
                        file_path TEXT NOT NULL,
                        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
                    )
                """)
                cursor.execute("""
                    INSERT INTO transaction_attachments (id, transaction_id, echeance_id, file_path)
                    SELECT id, transaction_id, echeance_id, file_path FROM transaction_attachments_old
                """)
                cursor.execute("DROP TABLE transaction_attachments_old")

            create_index_if_not_exists(
                cursor,
                "idx_attachments_tx_id",
                "transaction_attachments",
                "transaction_id",
            )
            create_index_if_not_exists(
                cursor,
                "idx_attachments_echeance_id",
                "transaction_attachments",
                "echeance_id",
            )

        logger.info("Attachments table initialized successfully")
    except sqlcipher.Error as e:
        logger.error(f"Attachments table initialization failed: {e}")
        raise
