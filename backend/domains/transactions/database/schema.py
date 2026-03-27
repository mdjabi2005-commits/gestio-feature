"""Database schema initialization and migration."""

import logging
import sqlite3

from backend.shared.database import db_transaction, db_cursor

logger = logging.getLogger(__name__)


def add_column_if_missing(
    cursor: sqlite3.Cursor,
    table: str,
    column: str,
    default: str = None,
) -> bool:
    """
    Ajoute une colonne à une table si elle n'existe pas.
    Retourne True si la colonne a été ajoutée.
    """
    try:
        col_def = f"ALTER TABLE {table} ADD COLUMN {column}"
        if default:
            col_def += f" DEFAULT {default}"
        cursor.execute(col_def)
        logger.info(f"Added '{column}' column to {table} table")
        return True
    except sqlite3.OperationalError:
        return False


def create_index_if_not_exists(
    cursor: sqlite3.Cursor,
    index_name: str,
    table: str,
    columns: str,
) -> None:
    """Crée un index s'il n'existe pas déjà."""
    try:
        cursor.execute(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table}({columns})")
        logger.info(f"Created index {index_name}")
    except sqlite3.OperationalError:
        pass


def init_transaction_table(db_path: str = None) -> None:
    """Initialize or update the transactions table."""
    try:
        with db_transaction(db_path) as conn:
            cursor = conn.cursor()

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT NOT NULL,
                    categorie TEXT NOT NULL,
                    sous_categorie TEXT,
                    description TEXT,
                    montant REAL NOT NULL,
                    date TEXT NOT NULL,
                    source TEXT DEFAULT 'Manuel',
                    recurrence TEXT,
                    date_fin TEXT,
                    compte_iban TEXT,
                    external_id TEXT UNIQUE
                )
            """)

            add_column_if_missing(cursor, "transactions", "source", "'Manuel'")
            add_column_if_missing(cursor, "transactions", "recurrence", "'Aucune'")
            add_column_if_missing(cursor, "transactions", "date_fin", "''")
            add_column_if_missing(cursor, "transactions", "compte_id", "INTEGER")
            add_column_if_missing(cursor, "transactions", "compte_iban", "TEXT")
            add_column_if_missing(cursor, "transactions", "echeance_id", "INTEGER")
            add_column_if_missing(cursor, "transactions", "attachment", "TEXT")

            create_index_if_not_exists(
                cursor, "idx_transactions_external_id", "transactions", "external_id"
            )
            create_index_if_not_exists(
                cursor, "idx_transactions_iban", "transactions", "compte_iban"
            )
            create_index_if_not_exists(
                cursor, "idx_transactions_echeance_id", "transactions", "echeance_id"
            )

        logger.info("Transaction table initialized successfully")
    except sqlite3.Error as e:
        from backend.config.logging_config import log_error

        log_error(e, "Transaction table initialization failed")
        raise


def init_attachments_table(db_path: str = None) -> None:
    """Initialize the attachments table."""
    try:
        with db_transaction(db_path) as conn:
            cursor = conn.cursor()

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS transaction_attachments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    transaction_id INTEGER NOT NULL,
                    file_path TEXT NOT NULL,
                    file_name TEXT NOT NULL,
                    file_type TEXT,
                    upload_date TEXT NOT NULL,
                    size INTEGER,
                    echeance_id INTEGER,
                    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
                )
            """)

            add_column_if_missing(cursor, "transaction_attachments", "file_path", "''")
            add_column_if_missing(cursor, "transaction_attachments", "size", "INTEGER")
            add_column_if_missing(
                cursor, "transaction_attachments", "echeance_id", "INTEGER"
            )

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
    except sqlite3.Error as e:
        logger.error(f"Attachments table initialization failed: {e}")
        raise


def migrate_transaction_table() -> None:
    """Migrate database schema from old French column names."""
    with db_cursor() as cursor:
        cursor.execute("PRAGMA table_info(transactions)")
        columns = [col[1] for col in cursor.fetchall()]

    if "Catégorie" in columns or "Sous-catégorie" in columns:
        logger.info("Migrating database schema...")

        try:
            with db_transaction() as conn:
                cursor = conn.cursor()

                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS transactions_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        type TEXT NOT NULL,
                        categorie TEXT NOT NULL,
                        sous_categorie TEXT,
                        description TEXT,
                        montant REAL NOT NULL,
                        date TEXT NOT NULL,
                        source TEXT DEFAULT 'Manuel',
                        recurrence TEXT,
                        date_fin TEXT
                    )
                """)

                cursor.execute("""
                    INSERT INTO transactions_new
                    (id, type, categorie, sous_categorie, description, montant, date, source, recurrence, date_fin)
                    SELECT id, type, "Catégorie", "Sous-catégorie", description, montant, "Date",
                           COALESCE("Source", 'Manuel'), COALESCE("Récurrence", 'Aucune'), date_fin
                    FROM transactions
                """)

                cursor.execute("DROP TABLE transactions")
                cursor.execute("ALTER TABLE transactions_new RENAME TO transactions")

            logger.info("Migration completed successfully!")
        except Exception as e:
            from backend.config.logging_config import log_error

            log_error(e, "Migration error")
            raise
    else:
        logger.info("Schema is already up to date")


def create_indexes() -> None:
    """Create indexes for frequently queried columns."""
    try:
        with db_transaction() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC)"
            )
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)"
            )
            cursor.execute(
                "CREATE INDEX IF NOT EXISTS idx_transactions_categorie ON transactions(categorie)"
            )
        logger.info("Database indexes created successfully")
    except sqlite3.Error as e:
        from backend.config.logging_config import log_error

        log_error(e, "Index creation failed")
        raise


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
    except sqlite3.Error as e:
        logger.error(f"Budgets table initialization failed: {e}")
        raise
