"""Database schema initialization and migration."""

import logging
import sqlite3

from shared.database.connection import get_db_connection, close_connection

logger = logging.getLogger(__name__)


def init_transaction_table(db_path: str = None) -> None:
    """
    Initialize or update the SQLite database with the 'transactions' table.

    Creates the table if it doesn't exist and adds missing columns to existing tables.
    
    Args:
        db_path: Optional custom database path (for testing). If None, uses production DATABASE_PATH.
    """
    conn = None
    try:
        conn = get_db_connection(db_path=db_path)
        cursor = conn.cursor()

        # Create the table with the correct schema
        cursor.execute("""
                       CREATE TABLE IF NOT EXISTS transactions
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
                           description
                           TEXT,
                           montant
                           REAL
                           NOT
                           NULL,
                           date
                           TEXT
                           NOT
                           NULL,
                           source
                           TEXT
                           DEFAULT
                           'Manuel',
                           recurrence
                           TEXT,
                           date_fin
                           TEXT,
                           compte_iban
                           TEXT,
                           external_id
                           TEXT
                           UNIQUE
                       )
                       """)

        # Update the table if it exists with old schema
        # Add 'source' column if missing
        try:
            cursor.execute("ALTER TABLE transactions ADD COLUMN source TEXT DEFAULT 'Manuel'")
            logger.info("Added 'source' column to transactions table")
        except sqlite3.OperationalError:
            pass  # Column already exists

        # Add 'recurrence' column if missing
        try:
            cursor.execute("ALTER TABLE transactions ADD COLUMN recurrence TEXT DEFAULT 'Aucune'")
            logger.info("Added 'recurrence' column to transactions table")
        except sqlite3.OperationalError:
            pass  # Column already exists

        try:
            cursor.execute("ALTER TABLE transactions ADD COLUMN date_fin TEXT DEFAULT ''")
            logger.info("Added 'date_fin' column to transactions table")
        except sqlite3.OperationalError:
            pass  # Column already exists

        # Add 'compte_id' column if missing
        try:
            cursor.execute("ALTER TABLE transactions ADD COLUMN compte_id INTEGER")
            logger.info("Added 'compte_id' column to transactions table")
        except sqlite3.OperationalError:
            pass  # Column already exists

        try:
            cursor.execute("ALTER TABLE transactions ADD COLUMN external_id TEXT")
            cursor.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_external_id ON transactions(external_id)")
            logger.info("Added 'external_id' column to transactions table")
        except sqlite3.OperationalError:
            pass  # Column already exists

        # Add 'compte_iban' column if missing
        try:
            cursor.execute("ALTER TABLE transactions ADD COLUMN compte_iban TEXT")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_transactions_iban ON transactions(compte_iban)")
            logger.info("Added 'compte_iban' column to transactions table")
        except sqlite3.OperationalError:
            pass

        conn.commit()
        logger.info("Transaction table initialized successfully")

    except sqlite3.Error as e:
        from config.logging_config import log_error
        log_error(e, "Transaction table initialization failed")
        if conn:
            conn.rollback()
        raise
    finally:
        close_connection(conn)


def init_attachments_table(db_path: str = None) -> None:
    """
    Initialise la table pour les pièces jointes (factures, tickets).
    Relation 1-N avec transactions.
    """
    conn = None
    try:
        conn = get_db_connection(db_path=db_path)
        cursor = conn.cursor()

        cursor.execute("""
                       CREATE TABLE IF NOT EXISTS transaction_attachments
                       (
                           id
                           INTEGER
                           PRIMARY
                           KEY
                           AUTOINCREMENT,
                           transaction_id
                           INTEGER
                           NOT
                           NULL,
                           file_path
                           TEXT
                           NOT
                           NULL,
                           file_name
                           TEXT
                           NOT
                           NULL,
                           file_type
                           TEXT,
                           upload_date
                           TEXT
                           NOT
                           NULL,
                           size
                           INTEGER,
                           FOREIGN
                           KEY
                       (
                           transaction_id
                       ) REFERENCES transactions
                       (
                           id
                       ) ON DELETE CASCADE
                           )
                       """)

        # Index pour recherche rapide par transaction
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_attachments_tx_id ON transaction_attachments(transaction_id)")

        conn.commit()
        logger.info("Attachments table initialized successfully")

    except sqlite3.Error as e:
        logger.error(f"Attachments table initialization failed: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        close_connection(conn)


def migrate_transaction_table() -> None:
    """
    Migrate database schema from old column names to new ones.

    Handles migration from French column names (Catégorie, Sous-catégorie, etc.)
    to English-friendly names (categorie, sous_categorie, etc.).
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if table exists with old schema
        cursor.execute("PRAGMA table_info(transactions)")
        columns = [col[1] for col in cursor.fetchall()]

        # If old columns exist, migrate
        if "Catégorie" in columns or "Sous-catégorie" in columns:
            logger.info("Migrating database schema...")

            # Create new table with correct schema
            cursor.execute("""
                           CREATE TABLE IF NOT EXISTS transactions_new
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
                               description
                               TEXT,
                               montant
                               REAL
                               NOT
                               NULL,
                               date
                               TEXT
                               NOT
                               NULL,
                               source
                               TEXT
                               DEFAULT
                               'Manuel',
                               recurrence
                               TEXT,
                               date_fin
                               TEXT
                           )
                           """)

            # Copy data mapping old names to new
            cursor.execute("""
                           INSERT INTO transactions_new
                           (id, type, categorie, sous_categorie, description, montant, date, source, recurrence,
                            date_fin)
                           SELECT id,
                                  type,
                                  "Catégorie"      AS categorie,
                                  "Sous-catégorie" AS sous_categorie,
                                  description,
                                  montant,
                                  "Date" AS date,
                    COALESCE("Source", 'Manuel') AS source,
                    COALESCE("Récurrence", 'Aucune') AS recurrence,
                    date_fin
                           FROM transactions
                           """)

            # Drop old table
            cursor.execute("DROP TABLE transactions")

            # Rename new table
            cursor.execute("ALTER TABLE transactions_new RENAME TO transactions")

            conn.commit()
            logger.info("Migration completed successfully!")
        else:
            logger.info("Schema is already up to date")

    except Exception as e:
        from config.logging_config import log_error
        log_error(e, "Migration error")
        if conn:
            conn.rollback()
        raise
    finally:
        close_connection(conn)


def create_indexes() -> None:
    """Create indexes for frequently queried columns."""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Index on date for chronological queries
        cursor.execute("""
                       CREATE INDEX IF NOT EXISTS idx_transactions_date
                           ON transactions(date DESC)
                       """)

        # Index on type for filtering
        cursor.execute("""
                       CREATE INDEX IF NOT EXISTS idx_transactions_type
                           ON transactions(type)
                       """)

        # Index on categorie for filtering
        cursor.execute("""
                       CREATE INDEX IF NOT EXISTS idx_transactions_categorie
                           ON transactions(categorie)
                       """)

        conn.commit()
        logger.info("Database indexes created successfully")

    except sqlite3.Error as e:
        from config.logging_config import log_error
        log_error(e, "Index creation failed")
        if conn:
            conn.rollback()
    finally:
        close_connection(conn)
