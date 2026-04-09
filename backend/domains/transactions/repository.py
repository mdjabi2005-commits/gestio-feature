"""
Transaction Repository - Gestion des données pour le domaine Transactions.
"""

import logging
from datetime import date, datetime, timezone
from typing import List, Optional, Dict

from sqlcipher3 import dbapi2 as sqlcipher

from backend.shared.database import db_transaction
from backend.shared.database.base_repository import BaseRepository
from backend.domains.transactions.model import Transaction

logger = logging.getLogger(__name__)


class TransactionRepository(BaseRepository[Transaction]):
    """Repository pour gérer les transactions en base de données."""
    table_name = "transactions"
    model_class = Transaction

    def _get_with_attachments_query(self) -> str:
        return """
            SELECT t.*, 
            COALESCE((SELECT 1 FROM transaction_attachments WHERE transaction_id = t.id LIMIT 1), 0) as has_attachments
            FROM transactions t 
        """

    def get_all(self) -> List[Transaction]:
        """Récupère toutes les transactions."""
        with db_transaction(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(f"{self._get_with_attachments_query()} ORDER BY t.date DESC")
            transactions = []
            for row in cursor.fetchall():
                try:
                    transactions.append(Transaction.model_validate(dict(row)))
                except Exception as e:
                    logger.error(f"Error validating transaction row: {e}")
            return transactions

    @staticmethod
    def _to_validated_db_dict(transaction) -> dict:
        """Valide et normalise les données pour la DB."""
        from pydantic import ValidationError

        if isinstance(transaction, Transaction):
            validated = transaction
        else:
            try:
                validated = Transaction.model_validate(transaction)
            except ValidationError as exc:
                errors = "; ".join(e["msg"] for e in exc.errors())
                raise ValueError(f"Validation échouée: {errors}") from exc

        return validated.to_db_dict()

    def add(self, transaction, conn=None) -> Optional[int]:
        """Ajoute une transaction."""
        try:
            data = self._to_validated_db_dict(transaction)

            if data.get("external_id"):
                with self._get_conn(conn) as c:
                    cursor = c.cursor()
                    cursor.execute(
                        "SELECT id FROM transactions WHERE external_id = ?",
                        (data["external_id"],),
                    )
                    if cursor.fetchone():
                        logger.info(f"Doublon ignoré: {data['external_id']}")
                        return None

            now = datetime.now(timezone.utc).isoformat()
            data["date_mise_a_jour"] = now
            if "statut_synchro" not in data or not data["statut_synchro"]:
                data["statut_synchro"] = "local"
                
            # Filter None to not override default schema values and keep insert clean
            data_to_insert = {k: v for k, v in data.items() if v is not None}

            columns = ", ".join(data_to_insert.keys())
            placeholders = ", ".join("?" * len(data_to_insert))
            query = f"INSERT INTO {self.table_name} ({columns}) VALUES ({placeholders})"

            with self._get_conn(conn) as c:
                cursor = c.cursor()
                cursor.execute(query, tuple(data_to_insert.values()))
                new_id = cursor.lastrowid

                # Handle attachment if provided in the input
                attachment_path = None
                if isinstance(transaction, dict):
                    attachment_path = transaction.get("attachment")
                elif hasattr(transaction, "attachment"):
                    attachment_path = getattr(transaction, "attachment")

                # Save attachment if provided using the shared connection
                if new_id and attachment_path:
                    from backend.domains.attachments.repository import attachment_repository
                    from backend.domains.attachments.model import TransactionAttachment

                    attachment_repository.add_attachment(
                        TransactionAttachment(
                            transaction_id=new_id, file_path=attachment_path
                        ),
                        conn=c,
                    )

            logger.info(f"Transaction ajoutée: ID {new_id}")
            return new_id

        except ValueError as e:
            logger.error(f"Validation échouée: {e}")
            return None
        except sqlcipher.Error as e:
            logger.error(f"Erreur SQL add: {e}")
            return None

    def update(self, transaction: Dict) -> bool:
        """Met à jour une transaction existante."""
        tx_id = transaction.get("id")
        if not tx_id:
            logger.error("ID manquant pour update")
            return False

        try:
            data = self._to_validated_db_dict(transaction)
            now = datetime.now(timezone.utc).isoformat()
            
            data["date_mise_a_jour"] = now
            if "statut_synchro" not in data or not data["statut_synchro"]:
                data["statut_synchro"] = "local"

            return self.update_by_id(tx_id, data)

        except ValueError as e:
            logger.error(f"Validation échouée update: {e}")
            return False
        except sqlcipher.Error as e:
            logger.error(f"Erreur SQL update: {e}")
            return False

    def get_by_id(self, tx_id: int) -> Optional[dict]:
        """Récupère une transaction par son ID."""
        with db_transaction(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                f"{self._get_with_attachments_query()} WHERE t.id = ?",
                (tx_id,),
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    def get_filtered(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        category: Optional[str] = None,
    ) -> List[Transaction]:
        """Récupère les transactions filtrées."""
        query = f"{self._get_with_attachments_query()} WHERE 1=1"
        params = []

        if start_date:
            query += " AND t.date >= ?"
            params.append(start_date.isoformat())
        if end_date:
            query += " AND t.date <= ?"
            params.append(end_date.isoformat())
        if category:
            query += " AND t.categorie = ?"
            params.append(category)

        query += " ORDER BY t.date DESC"

        with db_transaction(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            transactions = []
            for row in cursor.fetchall():
                try:
                    transactions.append(Transaction.model_validate(dict(row)))
                except Exception as e:
                    logger.error(f"Error validating filtered transaction row: {e}")
            return transactions

    def delete(self, transaction_id: int | List[int]) -> bool:
        """Supprime une ou plusieurs transactions."""
        if isinstance(transaction_id, int):
            return super().delete(transaction_id)
        else:
            if not transaction_id:
                return True
            return self.delete_many(transaction_id)


transaction_repository = TransactionRepository()
