"""
Repository pour les pièces jointes des transactions.
"""

import logging
import sqlite3
from typing import List, Optional

from backend.shared.database.connection import get_db_connection, close_connection
from .model_attachment import TransactionAttachment

logger = logging.getLogger(__name__)


class AttachmentRepository:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path

    def get_attachments_by_transaction(
        self, transaction_id: int
    ) -> List[TransactionAttachment]:
        conn = None
        try:
            conn = get_db_connection(db_path=self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM transaction_attachments WHERE transaction_id = ?",
                (transaction_id,),
            )
            rows = cursor.fetchall()
            return [TransactionAttachment(**dict(row)) for row in rows]
        except sqlite3.Error as e:
            logger.error(f"Erreur get_attachments_by_transaction: {e}")
            return []
        finally:
            close_connection(conn)

    def get_attachments_by_echeance(
        self, echeance_id: int
    ) -> List[TransactionAttachment]:
        conn = None
        try:
            conn = get_db_connection(db_path=self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM transaction_attachments WHERE echeance_id = ?",
                (echeance_id,),
            )
            rows = cursor.fetchall()
            return [TransactionAttachment(**dict(row)) for row in rows]
        except sqlite3.Error as e:
            logger.error(f"Erreur get_attachments_by_echeance: {e}")
            return []
        finally:
            close_connection(conn)

    def get_attachment_by_id(
        self, attachment_id: int
    ) -> Optional[TransactionAttachment]:
        conn = None
        try:
            conn = get_db_connection(db_path=self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM transaction_attachments WHERE id = ?", (attachment_id,)
            )
            row = cursor.fetchone()
            if row:
                return TransactionAttachment(**dict(row))
            return None
        except sqlite3.Error as e:
            logger.error(f"Erreur get_attachment_by_id: {e}")
            return None
        finally:
            close_connection(conn)

    def add_attachment(self, attachment: TransactionAttachment) -> Optional[int]:
        conn = None
        try:
            conn = get_db_connection(db_path=self.db_path)
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO transaction_attachments (transaction_id, echeance_id, file_name, file_path, file_type, upload_date, size) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    attachment.transaction_id,
                    attachment.echeance_id,
                    attachment.file_name,
                    attachment.file_path,
                    attachment.file_type,
                    attachment.upload_date.isoformat(),
                    getattr(attachment, "size", None),
                ),
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
            cursor.execute(
                "DELETE FROM transaction_attachments WHERE id = ?", (attachment_id,)
            )
            deleted = cursor.rowcount > 0
            conn.commit()
            return deleted
        except sqlite3.Error as e:
            logger.error(f"Erreur delete_attachment: {e}")
            return False
        finally:
            close_connection(conn)


attachment_repository = AttachmentRepository()
