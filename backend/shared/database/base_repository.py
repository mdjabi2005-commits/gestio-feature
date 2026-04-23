"""
Base Repository - Classe de base simplifiée pour les repositories.
"""

import logging
from contextlib import contextmanager
from typing import Any, Generic, List, Optional, Type, TypeVar

from sqlcipher3 import dbapi2 as sqlcipher
from .db_context import db_transaction

logger = logging.getLogger(__name__)

T = TypeVar("T")

class BaseRepository(Generic[T]):
    table_name: str = ""
    model_class: Type[T] = None

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path

    # ── Helpers Internes ──────────────────────────────────────────────────

    @contextmanager
    def _get_conn(self, conn: Optional[sqlcipher.Connection] = None):
        if conn:
            yield conn
        else:
            with db_transaction(self.db_path) as new_conn:
                yield new_conn

    def _row_to_model(self, row: sqlcipher.Row) -> T:
        return self.model_class.model_validate(dict(row))

    def _get_insert_data(self, model: T) -> dict:
        d = model.model_dump() if hasattr(model, "model_dump") else model.__dict__
        return {k: v for k, v in d.items() if k != "id" and v is not None}

    def _execute_read(self, query: str, params: tuple = (), fetch_one: bool = False, raw: bool = False) -> Any:
        with db_transaction(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            if fetch_one:
                row = cursor.fetchone()
                if not row: return None
                return dict(row) if raw else self._row_to_model(row)
            
            rows = cursor.fetchall()
            if raw: return [dict(row) for row in rows]
            
            res = []
            for r in rows:
                try: res.append(self._row_to_model(r))
                except Exception as e: logger.error(f"[{self.table_name}] Parse error: {e}")
            return res

    def _execute_write(self, query: str, params: tuple, conn=None) -> tuple:
        try:
            with self._get_conn(conn) as c:
                cur = c.cursor()
                cur.execute(query, params)
                return cur.lastrowid, cur.rowcount
        except sqlcipher.Error as e:
            logger.error(f"[{self.table_name}] DB Write error: {e}")
            return None, -1

    # ── Lectures ──────────────────────────────────────────────────────────

    def get_all(self, order_by: str = None, where: str = None, params: tuple = ()) -> List[T]:
        q = f"SELECT * FROM {self.table_name}"
        if where: q += f" WHERE {where}"
        if order_by: q += f" ORDER BY {order_by}"
        return self._execute_read(q, params)

    def get_where(self, where: str, params: tuple = (), order_by: str = None) -> List[T]:
        q = f"SELECT * FROM {self.table_name} WHERE {where}" + (f" ORDER BY {order_by}" if order_by else "")
        return self._execute_read(q, params)

    def get_by_id(self, id: int) -> Optional[T]:
        return self._execute_read(f"SELECT * FROM {self.table_name} WHERE id = ?", (id,), fetch_one=True)

    def get_one_where(self, where: str, params: tuple = ()) -> Optional[T]:
        return self._execute_read(f"SELECT * FROM {self.table_name} WHERE {where} LIMIT 1", params, fetch_one=True)

    def get_where_raw(self, where: str, params: tuple = (), order_by: str = None) -> List[dict]:
        q = f"SELECT * FROM {self.table_name} WHERE {where}" + (f" ORDER BY {order_by}" if order_by else "")
        return self._execute_read(q, params, raw=True)

    def count(self, where: str = "1=1", params: tuple = ()) -> int:
        res = self._execute_read(f"SELECT COUNT(*) FROM {self.table_name} WHERE {where}", params, raw=True, fetch_one=True)
        return list(res.values())[0] if res else 0

    def exists(self, where: str, params: tuple = ()) -> bool:
        return self.count(where, params) > 0

    def get_time_filtered(
        self,
        start_date: Optional[Any] = None,
        end_date: Optional[Any] = None,
        date_column: str = "date",
        where: str = None,
        params: tuple = (),
        group_by: str = None,
        order_by: str = None,
        base_query: str = None,
        base_query_has_where: bool = False,
        end_inclusive: bool = True,
        raw: bool = False,
        fetch_one: bool = False,
    ) -> Any:
        """
        Requête temporelle hyper-générique.
        """
        query = base_query or f"SELECT * FROM {self.table_name}"
        conditions = []
        new_params = list(params)

        if where:
            conditions.append(f"({where})")

        if start_date:
            conditions.append(f"{date_column} >= ?")
            new_params.append(start_date.isoformat() if hasattr(start_date, 'isoformat') else start_date)

        if end_date:
            op = "<=" if end_inclusive else "<"
            conditions.append(f"{date_column} {op} ?")
            new_params.append(end_date.isoformat() if hasattr(end_date, 'isoformat') else end_date)

        if conditions:
            if base_query_has_where:
                query += " AND " + " AND ".join(conditions)
            else:
                query += " WHERE " + " AND ".join(conditions)

        if group_by:
            query += f" GROUP BY {group_by}"

        if order_by:
            query += f" ORDER BY {order_by}"

        return self._execute_read(query, tuple(new_params), fetch_one=fetch_one, raw=raw)

    # ── Écritures ─────────────────────────────────────────────────────────

    def add(self, model: T, conn=None) -> Optional[int]:
        data = self._get_insert_data(model)
        if not data: return None
        cols, pl = ", ".join(data.keys()), ", ".join("?" * len(data))
        return self._execute_write(f"INSERT INTO {self.table_name} ({cols}) VALUES ({pl})", tuple(data.values()), conn)[0]

    def update_by_id(self, id: int, data: dict, conn=None) -> bool:
        if not data: return False
        set_clause = ", ".join(f"{k} = ?" for k in data.keys())
        return self._execute_write(f"UPDATE {self.table_name} SET {set_clause} WHERE id = ?", tuple(data.values()) + (id,), conn)[1] > 0

    def delete(self, id: int, conn=None) -> bool:
        return self._execute_write(f"DELETE FROM {self.table_name} WHERE id = ?", (id,), conn)[1] > 0

    def delete_where(self, where: str, params: tuple = (), conn=None) -> bool:
        return self._execute_write(f"DELETE FROM {self.table_name} WHERE {where}", params, conn)[1] >= 0

    def delete_many(self, ids: List[int]) -> bool:
        if not ids: return True
        pl = ", ".join("?" * len(ids))
        return self._execute_write(f"DELETE FROM {self.table_name} WHERE id IN ({pl})", tuple(ids))[1] >= 0
