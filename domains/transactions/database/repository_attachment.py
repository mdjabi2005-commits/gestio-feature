"""
Repository pour les pièces jointes des transactions.
"""

import logging
import sqlite3
from typing import Optional

import pandas as pd

from shared.database.connection import get_db_connection, close_connection
from .model_attachment import TransactionAttachment

logger = logging.getLogger(__name__)


class AttachmentRepository:

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path

    def get_all_attachments(self) -> pd.DataFrame:
        conn = None
        try:
            conn = get_db_connection(db_path=self.db_path)
            df = pd.read_sql_query("SELECT * FROM transaction_attachments", conn)
            if df.empty:
                return self._empty_df()
            df['upload_date'] = pd.to_datetime(df['upload_date'])
            df['id'] = df['id'].astype(int)
            df['transaction_id'] = df['transaction_id'].astype(int)
            return df
        except sqlite3.Error as e:
            logger.error(f"Erreur get_all_attachments: {e}")
            return self._empty_df()
        finally:
            close_connection(conn)

    @staticmethod
    def _empty_df() -> pd.DataFrame:
        return pd.DataFrame(columns=['id', 'transaction_id', 'file_name', 'file_type', 'upload_date'])

    def add_attachment(self, attachment: TransactionAttachment) -> Optional[int]:
        conn = None
        try:
            conn = get_db_connection(db_path=self.db_path)
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO transaction_attachments (transaction_id, file_name, file_type, upload_date) "
                "VALUES (?, ?, ?, ?)",
                (attachment.transaction_id, attachment.file_name,
                 attachment.file_type, attachment.upload_date.isoformat())
            )
            new_id = cursor.lastrowid
            conn.commit()
            return new_id
        except sqlite3.Error as e:
            logger.error(f"Erreur add_attachment: {e}")
            return None
        finally:
            close_connection(conn)

    def delete_attachment(self, attachment_id: int) -> bool:
        conn = None
        try:
            conn = get_db_connection(db_path=self.db_path)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM transaction_attachments WHERE id = ?", (attachment_id,))
            conn.commit()
            return cursor.rowcount > 0
        except sqlite3.Error as e:
            logger.error(f"Erreur delete_attachment: {e}")
            return False
        finally:
            close_connection(conn)


attachment_repository = AttachmentRepository()
