"""
Transaction Service
Gère la logique métier et les requêtes complexes pour les transactions.
Délègue toute la persistance au Repository.

Convention : toutes les clés sont en FRANÇAIS (FR) — pas de mapping FR↔EN dans ce service.
Les colonnes retournées correspondent exactement au modèle Transaction.
"""

import logging
from datetime import date
from typing import Optional, Union, List

import pandas as pd

from ..database.model import Transaction
from ..database.repository import transaction_repository

logger = logging.getLogger(__name__)


class TransactionService:
    """
    Service couche métier pour les transactions.
    Point d'entrée unique pour toutes les opérations — les pages UI ne doivent
    jamais appeler le repository directement.
    """

    def __init__(self):
        self.repository = transaction_repository

    # ----------------------------------------------------------
    # LECTURE
    # ----------------------------------------------------------

    def get_all(self) -> pd.DataFrame:
        """Récupère toutes les transactions (colonnes FR)."""
        return self.repository.get_all

    def get_filtered(
            self,
            start_date: Optional[date] = None,
            end_date: Optional[date] = None,
            category: Optional[str] = None,
    ) -> pd.DataFrame:
        """
        Récupère les transactions filtrées (colonnes FR).

        Colonnes retournées : id, type, categorie, sous_categorie, description,
                              montant, date, source, recurrence, date_fin,
                              compte_iban, external_id
        """
        return self.repository.get_filtered(
            start_date=start_date,
            end_date=end_date,
            category=category,
        )

    def get_transaction_by_id(self, tx_id: int) -> Optional[Transaction]:
        """Récupère une transaction par son ID et la convertit en modèle Pydantic."""
        try:
            row = self.repository.get_by_id(tx_id)
            if row:
                return Transaction(**row)
            return None
        except Exception as e:
            logger.error(f"Erreur get_transaction_by_id {tx_id}: {e}")
            return None

    # ----------------------------------------------------------
    # ÉCRITURE
    # ----------------------------------------------------------

    def add(self, transaction: Union[Transaction, dict]) -> Optional[int]:
        """
        Ajoute une nouvelle transaction.

        Args:
            transaction: Objet Transaction (Pydantic) ou dict avec clés FR.

        Returns:
            ID de la nouvelle transaction, ou None en cas d'erreur.
        """
        try:
            new_id = self.repository.add(transaction)
            if new_id:
                logger.info(f"TransactionService: transaction ajoutée ID={new_id}")
            return new_id
        except Exception as e:
            logger.error(f"Erreur TransactionService.add: {e}")
            return None

    def update(self, transaction: dict) -> bool:
        """
        Met à jour une transaction existante.

        Args:
            transaction: Dict avec clés FR, doit contenir 'id'.

        Returns:
            True si succès, False sinon.
        """
        try:
            return self.repository.update(transaction)
        except Exception as e:
            logger.error(f"Erreur TransactionService.update: {e}")
            return False

    def delete(self, transaction_id: Union[int, List[int]]) -> bool:
        """
        Supprime une ou plusieurs transactions en base de données.
        Les entrées transaction_attachments sont retirées automatiquement via FK ON DELETE CASCADE.
        Les fichiers physiques ne sont PAS supprimés ici — c'est à l'UI de demander confirmation.

        Args:
            transaction_id: Un seul ID ou une liste d'IDs.
        """
        try:
            return self.repository.delete(transaction_id)

        except Exception as e:
            logger.error(f"Erreur TransactionService.delete: {e}")
            return False

    # ----------------------------------------------------------
    # MÉTHODE DÉPRÉCIÉE (compatibilité temporaire)
    # ----------------------------------------------------------

    def get_filtered_transactions_df(
            self,
            start_date: Optional[date] = None,
            end_date: Optional[date] = None,
            category: Optional[str] = None,
    ) -> pd.DataFrame:
        """
        .. deprecated::
            Utiliser ``get_filtered()`` à la place.
            Cette méthode existait pour mapper FR→EN, ce mapping est supprimé.
        """
        logger.warning(
            "get_filtered_transactions_df() est dépréciée. Utiliser get_filtered() (colonnes FR)."
        )
        return self.get_filtered(start_date=start_date, end_date=end_date, category=category)


# Instance singleton
transaction_service = TransactionService()
