"""
Transaction Repository - Gestion des données pour le domaine Transactions.
"""

import logging
from datetime import date, datetime, timezone
from typing import List, Optional, Dict

from sqlcipher3 import dbapi2 as sqlcipher

from backend.shared.database import db_transaction
from backend.shared.utils import create_empty_transaction_df, convert_transaction_df
from backend.domains.transactions.model import Transaction

logger = logging.getLogger(__name__)


class TransactionRepository:
    """Repository pour gérer les transactions en base de données."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path

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

    def add(self, transaction) -> Optional[int]:
        """Ajoute une transaction."""
        try:
            data = self._to_validated_db_dict(transaction)

            if data.get("external_id"):
                with db_transaction(self.db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute(
                        "SELECT id FROM transactions WHERE external_id = ?",
                        (data["external_id"],),
                    )
                    if cursor.fetchone():
                        logger.info(f"Doublon ignoré: {data['external_id']}")
                        return None

            query = """
                INSERT INTO transactions
                (type, categorie, sous_categorie, description, montant, date,
                 source, external_id, compte_id, echeance_id, objectif_id,
                 date_mise_a_jour, statut_synchro)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """

            now = datetime.now(timezone.utc).isoformat()

            with db_transaction(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    query,
                    (
                        data["type"],
                        data["categorie"],
                        data["sous_categorie"],
                        data["description"],
                        data["montant"],
                        data["date"],
                        data["source"],
                        data["external_id"],
                        data.get("compte_id"),
                        data["echeance_id"],
                        data["objectif_id"],
                        now,
                        data.get("statut_synchro", "local"),
                    ),
                )
                new_id = cursor.lastrowid

                # Handle attachment if provided in the input
                attachment_path = None
                if isinstance(transaction, dict):
                    attachment_path = transaction.get("attachment")
                elif hasattr(transaction, "attachment"):
                    attachment_path = getattr(transaction, "attachment")

                # Save attachment if provided
                if new_id and attachment_path:
                    from .repository_attachment import attachment_repository
                    from .model_attachment import TransactionAttachment

                    attachment_repository.add_attachment(
                        TransactionAttachment(
                            transaction_id=new_id, file_path=attachment_path
                        ),
                        conn=conn,
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

            query = """
                UPDATE transactions
                SET type=?, categorie=?, sous_categorie=?, description=?,
                    montant=?, date=?, source=?, external_id=?, echeance_id=?,
                    objectif_id=?, date_mise_a_jour=?, statut_synchro=?
                WHERE id=?
            """

            with db_transaction(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    query,
                    (
                        data["type"],
                        data["categorie"],
                        data["sous_categorie"],
                        data["description"],
                        data["montant"],
                        data["date"],
                        data["source"],
                        data["external_id"],
                        data["echeance_id"],
                        data["objectif_id"],
                        now,
                        data.get("statut_synchro", "local"),
                        tx_id,
                    ),
                )
                return cursor.rowcount > 0

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
            ids = [transaction_id]
        else:
            ids = transaction_id

        if not ids:
            return True

        try:
            placeholders = ",".join("?" * len(ids))
            query = f"DELETE FROM transactions WHERE id IN ({placeholders})"

            with db_transaction(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(query, ids)

            logger.info(f"{len(ids)} transaction(s) supprimée(s)")
            return True

        except sqlcipher.Error as e:
            logger.error(f"Erreur delete: {e}")
            return False

    def update_attachment(self, transaction_id: int, attachment_path: str) -> bool:
        """Ajoute une pièce jointe pour une transaction (méthode legacy)."""
        try:
            from .repository_attachment import attachment_repository
            from .model_attachment import TransactionAttachment

            attachment = TransactionAttachment(
                transaction_id=transaction_id,
                file_path=attachment_path,
            )
            new_id = attachment_repository.add_attachment(attachment)
            return new_id is not None
        except Exception as e:
            logger.error(f"Erreur update_attachment: {e}")
            return False


transaction_repository = TransactionRepository()
