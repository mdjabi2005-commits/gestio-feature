import logging
from datetime import datetime
from typing import List, Optional

from sqlcipher3 import dbapi2 as sqlcipher

from backend.shared.database.connection import get_db_connection, close_connection
from .model import Budget

logger = logging.getLogger(__name__)


class BudgetRepository:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path

    def get_all(self) -> List[Budget]:
        conn = None
        try:
            conn = get_db_connection(db_path=self.db_path)
            conn.row_factory = sqlcipher.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM budgets ORDER BY categorie ASC")
            rows = cursor.fetchall()
            return [Budget(**dict(row)) for row in rows]
        except sqlcipher.Error as e:
            logger.error(f"Erreur get_all budgets: {e}")
            return []
        finally:
            close_connection(conn)

    def get_by_category(self, categorie: str) -> Optional[Budget]:
        conn = None
        try:
            conn = get_db_connection(db_path=self.db_path)
            conn.row_factory = sqlcipher.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM budgets WHERE categorie = ?", (categorie,))
            row = cursor.fetchone()
            return Budget(**dict(row)) if row else None
        except sqlcipher.Error as e:
            logger.error(f"Erreur get_by_category: {e}")
            return None
        finally:
            close_connection(conn)

    def upsert(self, budget: Budget) -> Optional[Budget]:
        conn = None
        try:
            existing = self.get_by_category(budget.categorie)
            conn = get_db_connection(db_path=self.db_path)
            cursor = conn.cursor()

            if existing:
                cursor.execute(
                    "UPDATE budgets SET montant_max = ? WHERE categorie = ?",
                    (budget.montant_max, budget.categorie),
                )
            else:
                cursor.execute(
                    "INSERT INTO budgets (categorie, montant_max, date_creation) VALUES (?, ?, ?)",
                    (budget.categorie, budget.montant_max, datetime.now().isoformat()),
                )

            conn.commit()
            return self.get_by_category(budget.categorie)

        except sqlcipher.Error as e:
            logger.error(f"Erreur upsert budget: {e}")
            if conn:
                conn.rollback()
            return None
        finally:
            close_connection(conn)

    def delete(self, budget_id: int) -> bool:
        conn = None
        try:
            conn = get_db_connection(db_path=self.db_path)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM budgets WHERE id = ?", (budget_id,))
            conn.commit()
            return cursor.rowcount > 0
        except sqlcipher.Error as e:
            logger.error(f"Erreur delete budget: {e}")
            if conn:
                conn.rollback()
            return False
        finally:
            close_connection(conn)


budget_repository = BudgetRepository()
