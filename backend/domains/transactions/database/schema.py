"""Database schema initialization and migration."""

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
    Retourne True si la colonne a été ajoutée.
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


def init_transaction_table(db_path: str = None) -> None:
    """Initialize or update the transactions table."""
    try:
        with db_transaction(db_path) as conn:
            cursor = conn.cursor()

            # Ensure column renames are applied first
            cursor.execute("PRAGMA table_info(transactions)")
            columns = [col[1] for col in cursor.fetchall()]
            if "Catégorie" in columns:
                cursor.execute(
                    'ALTER TABLE transactions RENAME COLUMN "Catégorie" TO "categorie"'
                )
            if "Sous-catégorie" in columns:
                cursor.execute(
                    'ALTER TABLE transactions RENAME COLUMN "Sous-catégorie" TO "sous_categorie"'
                )
            if "Date" in columns:
                cursor.execute(
                    'ALTER TABLE transactions RENAME COLUMN "Date" TO "date"'
                )
            if "Source" in columns:
                cursor.execute(
                    'ALTER TABLE transactions RENAME COLUMN "Source" TO "source"'
                )
            if "Récurrence" in columns:
                cursor.execute(
                    'ALTER TABLE transactions RENAME COLUMN "Récurrence" TO "recurrence"'
                )

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
                    external_id TEXT UNIQUE
                )
            """)

            add_column_if_missing(cursor, "transactions", "source", "'Manuel'")
            add_column_if_missing(cursor, "transactions", "compte_id")
            add_column_if_missing(cursor, "transactions", "echeance_id")
            add_column_if_missing(cursor, "transactions", "objectif_id")
            # Migration: renommer les anciennes colonnes anglaises si elles existent
            cursor.execute("PRAGMA table_info(transactions)")
            existing_cols = [col[1] for col in cursor.fetchall()]
            if "updated_at" in existing_cols:
                try:
                    cursor.execute(
                        'ALTER TABLE transactions RENAME COLUMN "updated_at" TO "date_mise_a_jour"'
                    )
                    logger.info("Renamed 'updated_at' → 'date_mise_a_jour'")
                except sqlcipher.OperationalError:
                    pass
            if "sync_status" in existing_cols:
                try:
                    cursor.execute(
                        'ALTER TABLE transactions RENAME COLUMN "sync_status" TO "statut_synchro"'
                    )
                    logger.info("Renamed 'sync_status' → 'statut_synchro'")
                except sqlcipher.OperationalError:
                    pass

            add_column_if_missing(cursor, "transactions", "date_mise_a_jour")
            add_column_if_missing(cursor, "transactions", "statut_synchro", "'local'")

            create_index_if_not_exists(
                cursor, "idx_transactions_external_id", "transactions", "external_id"
            )
            create_index_if_not_exists(
                cursor, "idx_transactions_echeance_id", "transactions", "echeance_id"
            )
            create_index_if_not_exists(
                cursor, "idx_transactions_objectif_id", "transactions", "objectif_id"
            )

        logger.info("Transaction table initialized successfully")
    except sqlcipher.Error as e:
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

            # Migration for transactions.attachment column removal
            cursor.execute("PRAGMA table_info(transactions)")
            tx_columns = [col[1] for col in cursor.fetchall()]
            if "attachment" in tx_columns:
                logger.info(
                    "Moving existing attachment paths from transactions to transaction_attachments..."
                )
                cursor.execute(
                    "SELECT id, attachment FROM transactions WHERE attachment IS NOT NULL AND attachment != ''"
                )
                existing_tx_attachments = cursor.fetchall()
                for tx_id, path in existing_tx_attachments:
                    cursor.execute(
                        "INSERT INTO transaction_attachments (transaction_id, file_path) VALUES (?, ?)",
                        (tx_id, path),
                    )
                logger.info(
                    "Finished moving attachments. Column removal will happen on next full migration or manual cleanup."
                )
                # We don't drop the column immediately to avoid complex ALTER TABLE for now,
                # but we stop using it in the repository.

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


def migrate_transaction_table() -> None:
    """Migrate database schema from old French column names."""
    with db_transaction() as conn:
        cursor = conn.cursor()
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
    except sqlcipher.Error as e:
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
    except sqlcipher.Error as e:
        logger.error(f"Budgets table initialization failed: {e}")
        raise
