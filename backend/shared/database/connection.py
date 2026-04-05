"""Database connection management."""

import logging
from typing import Optional

from sqlcipher3 import dbapi2 as sqlcipher

from backend.config import DB_PATH, MASTER_KEY

DATABASE_TIMEOUT = 30.0

logger = logging.getLogger(__name__)


def get_db_connection(
    timeout: float = DATABASE_TIMEOUT, db_path: Optional[str] = None
) -> sqlcipher.Connection:
    """
    Get a SQLCipher encrypted SQLite database connection.

    Args:
        timeout: Connection timeout in seconds
        db_path: Optional custom database path (for testing). If None, uses DB_PATH from config.

    Returns:
        SQLCipher connection object

    Raises:
        sqlcipher.Error: If connection fails
    """
    if not MASTER_KEY:
        raise ValueError(
            "MASTER_KEY not configured. Please set MASTER_KEY in .env file."
        )

    actual_db_path = db_path if db_path is not None else DB_PATH

    try:
        conn = sqlcipher.connect(actual_db_path, timeout=max(timeout, 30.0))
        conn.execute(f"PRAGMA key = '{MASTER_KEY}'")
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA journal_mode = WAL")
        conn.execute("PRAGMA busy_timeout = 30000")
        conn.row_factory = sqlcipher.Row
        return conn
    except sqlcipher.Error as e:
        logger.error(f"Database connection failed: {e}")
        raise


def close_connection(conn: Optional[sqlcipher.Connection]) -> None:
    """
    Safely close a database connection.

    Args:
        conn: SQLCipher connection to close
    """
    if conn:
        try:
            conn.close()
        except sqlcipher.Error as e:
            logger.error(f"Error closing connection: {e}")


def execute_query(
    query: str,
    params: tuple = (),
    fetch_one: bool = False,
    fetch_all: bool = False,
    commit: bool = False,
):
    """
    Execute a database query with automatic connection management.

    Args:
        query: SQL query to execute
        params: Query parameters
        fetch_one: Return single row
        fetch_all: Return all rows
        commit: Commit changes after execution

    Returns:
        Query results or None
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, params)

        if commit:
            conn.commit()

        if fetch_one:
            return cursor.fetchone()
        elif fetch_all:
            return cursor.fetchall()

        return cursor

    except sqlcipher.Error as e:
        logger.error(f"Query execution failed: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        close_connection(conn)
