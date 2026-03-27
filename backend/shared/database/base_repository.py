"""
Base Repository - Classe de base pour les repositories.
"""

import logging
import sqlite3
from abc import ABC, abstractmethod
from typing import Any, Generic, List, Optional, TypeVar

from .connection import get_db_connection, close_connection
from .db_context import db_transaction, db_cursor

logger = logging.getLogger(__name__)

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    """
    Classe de base pour les repositories.
    Fournit les opérations CRUD de base.
    """

    table_name: str = ""
    model_class: type = None

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path

    @abstractmethod
    def _row_to_model(self, row: sqlite3.Row) -> T:
        """Convertit une ligne SQL en modèle."""
        pass

    def _model_to_dict(self, model: T) -> dict:
        """Convertit un modèle en dictionnaire pour INSERT/UPDATE."""
        if hasattr(model, "model_dump"):
            return model.model_dump()
        return model.__dict__

    def get_all(self) -> List[T]:
        """Récupère tous les enregistrements."""
        with db_cursor(self.db_path) as cursor:
            cursor.execute(f"SELECT * FROM {self.table_name}")
            return [self._row_to_model(row) for row in cursor.fetchall()]

    def get_by_id(self, id: int) -> Optional[T]:
        """Récupère un enregistrement par son ID."""
        with db_cursor(self.db_path) as cursor:
            cursor.execute(f"SELECT * FROM {self.table_name} WHERE id = ?", (id,))
            row = cursor.fetchone()
            return self._row_to_model(row) if row else None

    def get_where(self, where: str, params: tuple = ()) -> List[T]:
        """Récupère les enregistrements correspondant à la condition."""
        with db_cursor(self.db_path) as cursor:
            cursor.execute(f"SELECT * FROM {self.table_name} WHERE {where}", params)
            return [self._row_to_model(row) for row in cursor.fetchall()]

    def get_one_where(self, where: str, params: tuple = ()) -> Optional[T]:
        """Récupère un seul enregistrement correspondant à la condition."""
        with db_cursor(self.db_path) as cursor:
            cursor.execute(f"SELECT * FROM {self.table_name} WHERE {where}", params)
            row = cursor.fetchone()
            return self._row_to_model(row) if row else None

    def count(self, where: str = "1=1", params: tuple = ()) -> int:
        """Compte les enregistrements."""
        with db_cursor(self.db_path) as cursor:
            cursor.execute(
                f"SELECT COUNT(*) FROM {self.table_name} WHERE {where}", params
            )
            return cursor.fetchone()[0]

    def insert(self, data: dict) -> Optional[int]:
        """Insère un nouvel enregistrement."""
        columns = ", ".join(data.keys())
        placeholders = ", ".join("?" * len(data))
        query = f"INSERT INTO {self.table_name} ({columns}) VALUES ({placeholders})"

        try:
            with db_transaction(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(query, tuple(data.values()))
                return cursor.lastrowid
        except sqlite3.Error as e:
            logger.error(f"Insert error: {e}")
            return None

    def update(self, id: int, data: dict) -> bool:
        """Met à jour un enregistrement existant."""
        set_clause = ", ".join(f"{k} = ?" for k in data.keys())
        query = f"UPDATE {self.table_name} SET {set_clause} WHERE id = ?"

        try:
            with db_transaction(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(query, tuple(data.values()) + (id,))
                return cursor.rowcount > 0
        except sqlite3.Error as e:
            logger.error(f"Update error: {e}")
            return False

    def delete(self, id: int) -> bool:
        """Supprime un enregistrement par son ID."""
        try:
            with db_transaction(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(f"DELETE FROM {self.table_name} WHERE id = ?", (id,))
                return cursor.rowcount > 0
        except sqlite3.Error as e:
            logger.error(f"Delete error: {e}")
            return False

    def delete_many(self, ids: List[int]) -> bool:
        """Supprime plusieurs enregistrements par leurs IDs."""
        if not ids:
            return True

        placeholders = ", ".join("?" * len(ids))
        query = f"DELETE FROM {self.table_name} WHERE id IN ({placeholders})"

        try:
            with db_transaction(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(query, ids)
                return True
        except sqlite3.Error as e:
            logger.error(f"Delete many error: {e}")
            return False
