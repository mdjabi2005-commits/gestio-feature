"""
Transaction Repository
Gestion des données pour le domaine Transactions.
"""

import logging
import sqlite3
from datetime import date
from typing import List, Optional, Dict

import pandas as pd

from shared.database.connection import get_db_connection, close_connection
from shared.utils import create_empty_transaction_df, convert_transaction_df
from .model import Transaction

logger = logging.getLogger(__name__)


class TransactionRepository:
    """Repository pour gérer les transactions en base de données."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path



    def get_all(self) -> pd.DataFrame:
        """Récupère toutes les transactions."""
        conn = None
        try:
            conn = get_db_connection(db_path=self.db_path)
            query = "SELECT * FROM transactions ORDER BY date DESC"
            df = pd.read_sql_query(query, conn)

            return convert_transaction_df(df)

        except sqlite3.Error as e:
            logger.error(f"Erreur SQL: {e}")
            return create_empty_transaction_df()
        finally:
            close_connection(conn)

    @staticmethod
    def _to_validated_db_dict(transaction) -> dict:
        """
        Valide, normalise et prépare les données pour la DB en une seule étape.

        - Si c'est déjà une Transaction Pydantic : réutilise l'objet directement.
        - Si c'est un dict avec clés FR : valide via Transaction.model_validate()
          (lève ValueError si les données sont invalides).

        Retourne le dict prêt pour SQLite via to_db_dict() (pas de model_dump()).
        """
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
        """
        Ajoute une transaction.
        Accepte un objet Transaction (Pydantic) ou un dict avec clés FR.
        La validation et la normalisation sont assurées par Pydantic.
        """
        conn = None
        try:
            data = self._to_validated_db_dict(transaction)

            # Doublon par external_id
            if data.get("external_id"):
                conn = get_db_connection(db_path=self.db_path)
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT id FROM transactions WHERE external_id = ?",
                    (data["external_id"],)
                )
                if cursor.fetchone():
                    logger.info(f"Doublon ignoré: {data['external_id']}")
                    return None

            # Insertion
            if conn is None:
                conn = get_db_connection(db_path=self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO transactions
                    (type, categorie, sous_categorie, description, montant, date,
                     source, recurrence, date_fin, compte_iban, external_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data["type"], data["categorie"], data["sous_categorie"],
                data["description"], data["montant"], data["date"],
                data["source"], data["recurrence"], data["date_fin"],
                data["compte_iban"], data["external_id"],
            ))
            new_id = cursor.lastrowid
            conn.commit()
            logger.info(f"Transaction ajoutée: ID {new_id}")
            return new_id

        except ValueError as e:
            logger.error(f"Validation échouée: {e}")
            return None
        except sqlite3.Error as e:
            logger.error(f"Erreur SQL add: {e}")
            if conn:
                conn.rollback()
            return None
        finally:
            close_connection(conn)

    def update(self, transaction: Dict) -> bool:
        """
        Met à jour une transaction existante.
        Accepte un dict avec clés FR, doit contenir 'id'.
        La validation et la normalisation sont assurées par Pydantic.
        """
        tx_id = transaction.get("id")
        if not tx_id:
            logger.error("ID manquant pour update")
            return False

        conn = None
        try:
            data = self._to_validated_db_dict(transaction)

            conn = get_db_connection(db_path=self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE transactions
                SET type           = ?,
                    categorie      = ?,
                    sous_categorie = ?,
                    description    = ?,
                    montant        = ?,
                    date           = ?,
                    source         = ?,
                    recurrence     = ?,
                    date_fin       = ?,
                    compte_iban    = ?,
                    external_id    = ?
                WHERE id = ?
            """, (
                data["type"], data["categorie"], data["sous_categorie"],
                data["description"], data["montant"], data["date"],
                data["source"], data["recurrence"], data["date_fin"],
                data["compte_iban"], data["external_id"], tx_id,
            ))
            conn.commit()
            return cursor.rowcount > 0

        except ValueError as e:
            logger.error(f"Validation échouée update: {e}")
            return False
        except sqlite3.Error as e:
            logger.error(f"Erreur SQL update: {e}")
            if conn:
                conn.rollback()
            return False
        finally:
            close_connection(conn)

    def get_by_id(self, tx_id: int) -> Optional[dict]:
        """Récupère une transaction par son ID."""
        conn = None
        try:
            conn = get_db_connection(db_path=self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
            row = cursor.fetchone()

            if row:
                return dict(row)
            return None
        except sqlite3.Error as e:
            logger.error(f"Erreur get_by_id: {e}")
            return None
        finally:
            close_connection(conn)

    def get_filtered(self, start_date: Optional[date] = None, end_date: Optional[date] = None,
                     category: Optional[str] = None) -> pd.DataFrame:
        """Récupère les transactions filtrées."""
        conn = None
        try:
            conn = get_db_connection(db_path=self.db_path)

            query = "SELECT * FROM transactions WHERE 1=1"
            params = []

            if start_date:
                query += " AND date >= ?"
                params.append(start_date.isoformat())

            if end_date:
                query += " AND date <= ?"
                params.append(end_date.isoformat())

            if category:
                query += " AND categorie = ?"
                params.append(category)

            query += " ORDER BY date DESC"

            df = pd.read_sql_query(query, conn, params=params)

            if df.empty:
                return create_empty_transaction_df()

            return convert_transaction_df(df)

        except sqlite3.Error as e:
            logger.error(f"Erreur get_filtered: {e}")
            return create_empty_transaction_df()
        finally:
            close_connection(conn)

    def delete(self, transaction_id: int | List[int]) -> bool:
        """
        Supprime une ou plusieurs transactions.

        Args:
            transaction_id: Un seul ID (int) ou une liste d'IDs (List[int])

        Returns:
            True si succès, False sinon
        """
        conn = None
        try:
            # Normaliser en liste
            if isinstance(transaction_id, int):
                ids = [transaction_id]
            else:
                ids = transaction_id

            if not ids:
                return True

            conn = get_db_connection(db_path=self.db_path)
            cursor = conn.cursor()

            # Utiliser IN clause (fonctionne pour 1 ou N IDs)
            placeholders = ','.join('?' * len(ids))
            query = f"DELETE FROM transactions WHERE id IN ({placeholders})"
            cursor.execute(query, ids)

            conn.commit()
            deleted_count = cursor.rowcount
            logger.info(f"{deleted_count} transaction(s) supprimée(s)")
            return True

        except sqlite3.Error as e:
            logger.error(f"Erreur delete: {e}")
            if conn:
                conn.rollback()
            return False
        finally:
            close_connection(conn)


# Instance unique
transaction_repository = TransactionRepository()
