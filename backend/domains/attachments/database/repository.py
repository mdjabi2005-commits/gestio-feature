"""
Repository pour les pièces jointes des transactions.
"""

import logging
from typing import List, Optional

from sqlcipher3 import dbapi2 as sqlcipher

from backend.shared.database.connection import get_db_connection, close_connection
from .model import TransactionAttachment

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
            conn.row_factory = sqlcipher.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM transaction_attachments WHERE transaction_id = ?",
                (transaction_id,),
            )
            rows = cursor.fetchall()
            return [TransactionAttachment(**dict(row)) for row in rows]
        except sqlcipher.Error as e:
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
            conn.row_factory = sqlcipher.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM transaction_attachments WHERE echeance_id = ?",
                (echeance_id,),
            )
            rows = cursor.fetchall()
            return [TransactionAttachment(**dict(row)) for row in rows]
        except sqlcipher.Error as e:
            logger.error(f"Erreur get_attachments_by_echeance: {e}")
            return []
        finally:
            close_connection(conn)

    def get_attachments_by_objectif(
        self, objectif_id: int
    ) -> List[TransactionAttachment]:
        conn = None
        try:
            conn = get_db_connection(db_path=self.db_path)
            conn.row_factory = sqlcipher.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM transaction_attachments WHERE objectif_id = ?",
                (objectif_id,),
            )
            rows = cursor.fetchall()
            return [TransactionAttachment(**dict(row)) for row in rows]
        except sqlcipher.Error as e:
            logger.error(f"Erreur get_attachments_by_objectif: {e}")
            return []
        finally:
            close_connection(conn)

    def get_attachment_by_id(
        self, attachment_id: int
    ) -> Optional[TransactionAttachment]:
        conn = None
        try:
            conn = get_db_connection(db_path=self.db_path)
            conn.row_factory = sqlcipher.Row
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM transaction_attachments WHERE id = ?", (attachment_id,)
            )
            row = cursor.fetchone()
            if row:
                return TransactionAttachment(**dict(row))
            return None
        except sqlcipher.Error as e:
            logger.error(f"Erreur get_attachment_by_id: {e}")
            return None
        finally:
            close_connection(conn)

    def add_attachment(
        self, attachment: TransactionAttachment, conn: sqlcipher.Connection = None
    ) -> Optional[int]:
        if conn:
            return self._add_attachment_with_conn(attachment, conn, commit=False)

        conn = None
        try:
            conn = get_db_connection(db_path=self.db_path)
            result = self._add_attachment_with_conn(attachment, conn, commit=True)
            close_connection(conn)
            return result
        except sqlcipher.Error as e:
            logger.error(f"Erreur add_attachment: {e}")
            if conn:
                close_connection(conn)
            return None

    def _add_attachment_with_conn(
        self,
        attachment: TransactionAttachment,
        conn: sqlcipher.Connection,
        commit: bool = True,
    ) -> Optional[int]:
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO transaction_attachments (transaction_id, echeance_id, objectif_id, file_path) "
                "VALUES (?, ?, ?, ?)",
                (
                    attachment.transaction_id,
                    attachment.echeance_id,
                    attachment.objectif_id,
                    attachment.file_path,
                ),
            )
            if commit:
                conn.commit()
            new_id = cursor.lastrowid
            return new_id
        except sqlcipher.Error as e:
            logger.error(f"Erreur add_attachment: {e}")
            if commit:
                conn.rollback()
            return None

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
        except sqlcipher.Error as e:
            logger.error(f"Erreur delete_attachment: {e}")
            return False
        finally:
            close_connection(conn)


attachment_repository = AttachmentRepository()
