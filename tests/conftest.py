"""
conftest.py — Fixtures partagées pour tous les tests Gestio V4.

Stratégie DB :
- Chaque test reçoit une base SQLite EN MÉMOIRE (:memory:)
- Complètement isolée, détruite après chaque test
- Zéro risque de toucher la DB de production
"""

import pytest
from datetime import date
from pathlib import Path

from domains.transactions.database.schema import init_transaction_table, init_attachments_table
from domains.transactions.database.schema_table_recurrence import init_recurrence_table
from domains.transactions.database.model import Transaction
from domains.transactions.database.repository import TransactionRepository


# ─────────────────────────────────────────────────────────────────────────────
# Fixture : connexion SQLite en mémoire (scope=function → réinitialisée à chaque test)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def db_path(tmp_path: Path) -> str:
    """
    Crée une base de données SQLite temporaire dans un dossier pytest unique.
    Chaque test a sa propre DB — aucun partage d'état entre tests.

    tmp_path est fourni par pytest et supprimé automatiquement après le test.
    """
    path = str(tmp_path / "test_finances.db")

    # Initialise les tables (même schéma que la prod)
    init_transaction_table(db_path=path)
    init_attachments_table(db_path=path)
    init_recurrence_table(db_path=path)

    return path


@pytest.fixture
def repo(db_path: str) -> TransactionRepository:
    """Repository branché sur la DB de test."""
    return TransactionRepository(db_path=db_path)


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures : données d'exemple
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def transaction_depense() -> Transaction:
    """Transaction de dépense valide."""
    return Transaction(
        type="Dépense",
        categorie="Alimentation",
        sous_categorie="Supermarché",
        description="Courses Carrefour",
        montant=42.50,
        date=date(2026, 1, 15),
        source="Manuel",
        recurrence=None,
        date_fin=None,
        compte_iban=None,
        external_id=None,
        id=None,
    )


@pytest.fixture
def transaction_revenu() -> Transaction:
    """Transaction de revenu valide."""
    return Transaction(
        type="Revenu",
        categorie="Salaire",
        sous_categorie=None,
        description="Salaire janvier",
        montant=2500.00,
        date=date(2026, 1, 31),
        source="Manuel",
        recurrence=None,
        date_fin=None,
        compte_iban=None,
        external_id=None,
        id=None,
    )


@pytest.fixture
def transactions_batch() -> list[Transaction]:
    """Lot de 5 transactions pour tester les opérations en masse."""
    return [
        Transaction(
            type="Dépense", categorie="Transport", montant=25.0,
            date=date(2026, 1, i + 1), source="Manuel",
            sous_categorie=None, description=f"Ticket métro {i+1}",
            recurrence=None, date_fin=None, compte_iban=None, external_id=None, id=None,
        )
        for i in range(5)
    ]

