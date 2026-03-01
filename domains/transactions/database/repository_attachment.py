"""
Repository pour les pièces jointes des transactions.
"""

import logging
import sqlite3
from typing import Optional

import pandas as pd

from shared.database.connection import get_db_connection, close_connection
from shared.utils import convert_attachment_df, create_empty_attachment_df
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
                return create_empty_attachment_df()
            return convert_attachment_df(df)
        except sqlite3.Error as e:
            logger.error(f"Erreur get_all_attachments: {e}")
            return create_empty_attachment_df()
        finally:
            close_connection(conn)


    def add_attachment(self, attachment: TransactionAttachment) -> Optional[int]:
        conn = None
        try:
            conn = get_db_connection(db_path=self.db_path)
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO transaction_attachments (transaction_id, file_name, file_path, file_type, upload_date) "
                "VALUES (?, ?, ?, ?, ?)",
                (attachment.transaction_id, attachment.file_name, attachment.file_path,
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
            
            # 1. Obtenir le chemin du fichier avant suppression
            cursor.execute("SELECT file_path FROM transaction_attachments WHERE id = ?", (attachment_id,))
            result = cursor.fetchone()
            file_path = result[0] if result else None
            
            # 2. Supprimer l'entrée en base
            cursor.execute("DELETE FROM transaction_attachments WHERE id = ?", (attachment_id,))
            deleted = cursor.rowcount > 0
            conn.commit()
            
            # 3. Supprimer le fichier physiquement (si l'entrée a bien été supprimée)
            if deleted and file_path:
                try:
                    import os
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        logger.info(f"Fichier physique supprimé: {file_path}")
                except OSError as e:
                    logger.warning(f"Impossible de supprimer le fichier physique {file_path}: {e}")
                    
            return deleted
        except sqlite3.Error as e:
            logger.error(f"Erreur delete_attachment: {e}")
            return False
        finally:
            close_connection(conn)


attachment_repository = AttachmentRepository()
