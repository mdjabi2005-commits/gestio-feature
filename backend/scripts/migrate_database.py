r"""
Script de migration pour la base de données SQLite.

Usage:
    python -m backend.scripts.migrate_database

Options:
    --db-path C:\chemin\vers\finances.db  # Chemin personnalisé
    --dry-run                             # Affiche les actions sans executer
    --force                               # Ignore les confirmations

Ce script:
1. Sauvegarde la base de donnees
2. Analyse les tables existantes
3. Cree/repare les tables manquantes ou incorrectes
4. Migre les donnees des anciennes colonnes
5. Supprime les tables obsoletes
"""

import argparse
import logging
import os
import shutil
import sqlite3
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


OBSOLETE_TABLES = [
    "transactions_backup_fix",
    "transactions_backup",
    "transaction_attachments_old",
    "budgets_categories",
    "virements",
    "objectif",
    "comptes",
    "recurrences",
    "investissements",
    "comptes_bancaires",
    "portefeuilles",
]


def get_db_path(user_db_path: Optional[str] = None) -> str:
    """Récupère le chemin de la base de données."""
    if user_db_path:
        return user_db_path

    from backend.config.paths import DB_PATH
    return str(DB_PATH)


def create_backup(db_path: str) -> str:
    """Crée une sauvegarde de la base de données."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{db_path.rsplit('.', 1)[0]}_backup_{timestamp}.db"
    shutil.copy2(db_path, backup_path)
    logger.info(f"✅ Sauvegarde créée: {backup_path}")
    return backup_path


def get_existing_tables(db_path: str) -> list:
    """Récupère la liste des tables existantes."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    conn.close()
    return tables


def get_table_columns(db_path: str, table: str) -> list:
    """Récupère les colonnes d'une table."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cursor.fetchall()]
    conn.close()
    return columns


def add_column_if_missing(
    db_path: str,
    table: str,
    column: str,
    col_type: str = "TEXT",
    default: Optional[str] = None,
) -> bool:
    """Ajoute une colonne si elle n'existe pas."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute(f"PRAGMA table_info({table})")
        existing_cols = [row[1] for row in cursor.fetchall()]

        if column not in existing_cols:
            col_def = f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"
            if default:
                col_def += f" DEFAULT {default}"
            cursor.execute(col_def)
            conn.commit()
            logger.info(f"  ➕ Colonne '{column}' ajoutée à '{table}'")
            conn.close()
            return True
        conn.close()
        return False
    except sqlite3.Error as e:
        conn.close()
        logger.error(f"  ❌ Erreur ajout colonne {column}: {e}")
        return False


def rename_column(db_path: str, table: str, old_col: str, new_col: str) -> bool:
    """Renomme une colonne."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute(f"ALTER TABLE {table} RENAME COLUMN {old_col} TO {new_col}")
        conn.commit()
        logger.info(f"  ➡️  Colonne '{old_col}' → '{new_col}' dans '{table}'")
        conn.close()
        return True
    except sqlite3.Error as e:
        conn.close()
        return False


def migrate_transactions(db_path: str) -> None:
    """Migre la table transactions."""
    logger.info("🔧 Migration table: transactions")
    columns = get_table_columns(db_path, "transactions")

    old_french_columns = {
        "Catégorie": "categorie",
        "Sous-catégorie": "sous_categorie",
        "Date": "date",
        "Source": "source",
        "Récurrence": "recurrence",
    }

    for old_col, new_col in old_french_columns.items():
        if old_col in columns:
            rename_column(db_path, "transactions", old_col, new_col)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(transactions)")
    columns = [row[1] for row in cursor.fetchall()]
    conn.close()

    required_cols = {
        "type": "TEXT NOT NULL",
        "categorie": "TEXT NOT NULL",
        "sous_categorie": "TEXT",
        "description": "TEXT",
        "montant": "REAL NOT NULL",
        "date": "TEXT NOT NULL",
        "source": "TEXT DEFAULT 'Manuel'",
        "external_id": "TEXT UNIQUE",
        "compte_id": "INTEGER",
        "echeance_id": "INTEGER",
        "objectif_id": "INTEGER",
    }

    for col, col_type in required_cols.items():
        if col not in columns:
            default = "'Manuel'" if col == "source" else None
            add_column_if_missing(db_path, "transactions", col, col_type, default)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON transactions(external_id)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_transactions_echeance_id ON transactions(echeance_id)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_transactions_objectif_id ON transactions(objectif_id)"
    )
    conn.commit()
    conn.close()
    logger.info("  ✅ transactions migrée")


def migrate_attachments(db_path: str) -> None:
    """Migre la table transaction_attachments."""
    logger.info("🔧 Migration table: transaction_attachments")
    columns = get_table_columns(db_path, "transaction_attachments")

    required_cols = {
        "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
        "transaction_id": "INTEGER",
        "echeance_id": "INTEGER",
        "objectif_id": "INTEGER",
        "file_path": "TEXT NOT NULL",
    }

    for col, col_type in required_cols.items():
        if col not in columns:
            if (
                col == "id"
                or col == "file_path"
                or col == "transaction_id"
                or col == "echeance_id"
            ):
                logger.warning(
                    f"  ⚠️  Colonne manquante '{col}' - la table doit être recréée"
                )
                break
            add_column_if_missing(db_path, "transaction_attachments", col, col_type)
    else:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_attachments_tx_id ON transaction_attachments(transaction_id)"
        )
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_attachments_echeance_id ON transaction_attachments(echeance_id)"
        )
        conn.commit()
        conn.close()

    logger.info("  ✅ transaction_attachments migrée")


def migrate_budgets(db_path: str) -> None:
    """Migre la table budgets."""
    logger.info("🔧 Migration table: budgets")
    columns = get_table_columns(db_path, "budgets")

    if "budget_mensuel" in columns:
        rename_column(db_path, "budgets", "budget_mensuel", "montant_max")

    required_cols = {
        "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
        "categorie": "TEXT UNIQUE NOT NULL",
        "montant_max": "REAL NOT NULL",
        "date_creation": "TEXT NOT NULL",
    }

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='budgets'"
    )
    if not cursor.fetchone():
        cursor.execute("""
            CREATE TABLE budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                categorie TEXT UNIQUE NOT NULL,
                montant_max REAL NOT NULL,
                date_creation TEXT NOT NULL
            )
        """)
        conn.commit()
        logger.info("  ➕ Table budgets créée")
    conn.close()

    for col, col_type in required_cols.items():
        if col not in columns:
            add_column_if_missing(db_path, "budgets", col, col_type)

    logger.info("  ✅ budgets migrée")


def migrate_echeances(db_path: str) -> None:
    """Migre la table echeances."""
    logger.info("🔧 Migration table: echeances")
    columns = get_table_columns(db_path, "echeances")

    required_cols = {
        "id": "INTEGER PRIMARY KEY AUTOINCREMENT",
        "nom": "TEXT",
        "type": "TEXT NOT NULL",
        "categorie": "TEXT NOT NULL",
        "sous_categorie": "TEXT",
        "montant": "REAL NOT NULL",
        "frequence": "TEXT",
        "date_debut": "TEXT",
        "date_fin": "TEXT",
        "description": "TEXT",
        "statut": "TEXT DEFAULT 'active'",
        "type_echeance": "TEXT DEFAULT 'recurrente'",
        "objectif_id": "INTEGER",
        "date_creation": "TEXT",
        "date_modification": "TEXT",
    }

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='echeances'"
    )
    if not cursor.fetchone():
        cursor.execute("""
            CREATE TABLE echeances (
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
        conn.commit()
        logger.info("  ➕ Table echeances créée")
    conn.close()

    for col, col_type in required_cols.items():
        if col not in columns:
            add_column_if_missing(db_path, "echeances", col, col_type)

    logger.info("  ✅ echeances migrée")


def migrate_goals(db_path: str) -> None:
    """Migre la table goals."""
    logger.info("🔧 Migration table: goals")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='goals'")
    if not cursor.fetchone():
        cursor.execute("""
            CREATE TABLE goals (
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
        logger.info("  ➕ Table goals créée")

    conn.close()
    logger.info("  ✅ goals migrée")


def remove_unused_columns(db_path: str) -> None:
    """Supprime les colonnes qui ne sont plus dans les modèles."""
    logger.info("🧹 Suppression colonnes inutiles...")

    # transactions - colonnes a supprimer
    transactions_cols_to_remove = [
        "recurrence",
        "date_fin",
        "compte_iban",
        "linked_tx_id",
        "nom_marchand",
        "counterparty_iban",
        "counterparty_name",
    ]

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(transactions)")
    existing_cols = [row[1] for row in cursor.fetchall()]

    for col in transactions_cols_to_remove:
        if col in existing_cols:
            try:
                cursor.execute(f"ALTER TABLE transactions DROP COLUMN {col}")
                conn.commit()
                logger.info(f"  🗑️  Colonne '{col}' supprimée de transactions")
            except sqlite3.Error as e:
                logger.warning(f"  ⚠️  Impossible de supprimer {col}: {e}")

    # echeances - colonnes a supprimer
    echeances_cols_to_remove = [
        "date_echeance",
        "recurrence",
        "recurrence_id",
        "date_prevue",
    ]

    cursor.execute("PRAGMA table_info(echeances)")
    existing_cols = [row[1] for row in cursor.fetchall()]

    for col in echeances_cols_to_remove:
        if col in existing_cols:
            try:
                cursor.execute(f"ALTER TABLE echeances DROP COLUMN {col}")
                conn.commit()
                logger.info(f"  🗑️  Colonne '{col}' supprimée de echeances")
            except sqlite3.Error as e:
                logger.warning(f"  ⚠️  Impossible de supprimer {col}: {e}")

    conn.close()
    logger.info("  ✅ Colonnes inutiles supprimées")


def remove_obsolete_tables(db_path: str, tables: list) -> None:
    """Supprime les tables obsolètes."""
    logger.info("🧹 Suppression tables obsolètes...")

    for table in OBSOLETE_TABLES:
        if table in tables:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            try:
                cursor.execute(f"DROP TABLE {table}")
                conn.commit()
                logger.info(f"  🗑️  Table '{table}' supprimée")
            except sqlite3.Error as e:
                logger.error(f"  ❌ Erreur suppression {table}: {e}")
            finally:
                conn.close()


def verify_integrity(db_path: str) -> bool:
    """Vérifie l'intégrité de la base de données."""
    logger.info("🔍 Vérification intégrité...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute("PRAGMA integrity_check")
        result = cursor.fetchone()
        if result[0] == "ok":
            logger.info("  ✅ Intégrité OK")
            conn.close()
            return True
        else:
            logger.warning(f"  ⚠️  Problèmes détectés: {result}")
            conn.close()
            return False
    except sqlite3.Error as e:
        logger.error(f"  ❌ Erreur vérification intégrité: {e}")
        conn.close()
        return False


def show_table_summary(db_path: str) -> None:
    """Affiche un résumé des tables."""
    logger.info("📊 Résumé des tables:")
    tables = get_existing_tables(db_path)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        logger.info(f"  • {table}: {count} lignes")

    conn.close()


def main():
    parser = argparse.ArgumentParser(
        description="Migration de la base de données SQLite"
    )
    parser.add_argument("--db-path", help="Chemin vers la base de données")
    parser.add_argument(
        "--dry-run", action="store_true", help="Affiche les actions sans exécuter"
    )
    parser.add_argument("--force", action="store_true", help="Ignore les confirmations")
    args = parser.parse_args()

    db_path = get_db_path(args.db_path)

    if not os.path.exists(db_path):
        logger.error(f"❌ Base de données introuvable: {db_path}")
        sys.exit(1)

    logger.info(f"📂 Base de données: {db_path}")

    if args.dry_run:
        logger.info("🔍 Mode DRY-RUN - Aucune modification ne sera effectuée")

    if not args.force and not args.dry_run:
        response = input("⚠️  Créer une sauvegarde avant migration ? (o/n): ")
        if response.lower() != "o":
            logger.info("❌ Migration annulée")
            sys.exit(0)

    if not args.dry_run:
        create_backup(db_path)

    tables = get_existing_tables(db_path)
    logger.info(f"📋 Tables existantes: {tables}")

    if not args.dry_run:
        migrate_transactions(db_path)
        migrate_attachments(db_path)
        migrate_budgets(db_path)
        migrate_echeances(db_path)
        migrate_goals(db_path)
        remove_unused_columns(db_path)
        remove_obsolete_tables(db_path, tables)
        verify_integrity(db_path)

    logger.info("\n✅ Migration terminée!")
    show_table_summary(db_path)


if __name__ == "__main__":
    main()
