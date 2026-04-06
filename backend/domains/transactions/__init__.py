"""
Domaine Transactions

Module unifié pour gérer toutes les transactions financières
peu importe leur source (OCR, CSV, Manuelle).
"""

from .model import Transaction
from .repository import transaction_repository, TransactionRepository
from .constants import (
    TRANSACTION_TYPES,
    TRANSACTION_CATEGORIES,
    TRANSACTION_SOURCES,
    SOURCE_DEFAULT,
    TYPE_DEPENSE,
    TYPE_REVENU,
)
from .service import transaction_service, TransactionService

__all__ = [
    # Model
    "Transaction",
    # Constants
    "TRANSACTION_TYPES",
    "TRANSACTION_CATEGORIES",
    "TRANSACTION_SOURCES",
    "SOURCE_DEFAULT",
    "TYPE_DEPENSE",
    "TYPE_REVENU",
    # Repository (accès direct si besoin interne)
    "transaction_repository",
    "TransactionRepository",
    # Service (point d'entrée recommandé pour l'UI)
    "transaction_service",
    "TransactionService",
]
