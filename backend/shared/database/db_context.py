"""
Database context managers - Helpers pour les opérations DB.
"""

import logging
import sqlite3
from contextlib import contextmanager
from typing import Generator, Optional
from .connection import get_db_connection, close_connection

logger = logging.getLogger(__name__)


@contextmanager
def db_transaction(
    db_path: Optional[str] = None,
) -> Generator[sqlite3.Connection, None, None]:
    """
    Context manager pour les transactions de base de données.
    Gère automatiquement l'ouverture, le commit/rollback et la fermeture.

    Usage:
        with db_transaction() as conn:
            cursor = conn.cursor()
            cursor.execute(...)
            # commit automatique si pas d'exception
        # connexion fermée automatiquement
    """
    conn = None
    try:
        conn = get_db_connection(db_path=db_path)
        yield conn
        conn.commit()
    except sqlite3.Error as e:
        logger.error(f"Database error: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        close_connection(conn)


def execute_single(
    query: str,
    params: tuple = (),
    db_path: Optional[str] = None,
) -> Optional[sqlite3.Row]:
    """
    Exécute une requête SELECT et retourne une seule ligne.

    Usage:
        row = execute_single("SELECT * FROM table WHERE id = ?", (1,))
    """
    with db_transaction(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        return cursor.fetchone()


def execute_all(
    query: str,
    params: tuple = (),
    db_path: Optional[str] = None,
) -> list:
    """
    Exécute une requête SELECT et retourne toutes les lignes.

    Usage:
        rows = execute_all("SELECT * FROM table WHERE type = ?", ("depense",))
    """
    with db_transaction(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        return cursor.fetchall()


def execute_write(
    query: str,
    params: tuple = (),
    db_path: Optional[str] = None,
) -> int:
    """
    Exécute une requête INSERT/UPDATE/DELETE.

    Returns:
        Nombre de lignes affectées

    Usage:
        count = execute_write("INSERT INTO table (col) VALUES (?)", ("value",))
    """
    with db_transaction(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        return cursor.rowcount


def execute_many(
    query: str,
    params_list: list[tuple],
    db_path: Optional[str] = None,
) -> int:
    """
    Exécute une requête sur plusieurs ensembles de paramètres.

    Returns:
        Nombre total de lignes affectées
    """
    with db_transaction(db_path) as conn:
        cursor = conn.cursor()
        cursor.executemany(query, params_list)
        return cursor.rowcount
