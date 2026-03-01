"""
Tests du TransactionRepository — CRUD complet sur base de données de test.
Chaque test utilise une DB isolée en mémoire (fixture `repo` de conftest.py).
"""

import pytest
from datetime import date

from domains.transactions.database.model import Transaction
from domains.transactions.database.repository import TransactionRepository


# ─────────────────────────────────────────────────────────────────────────────
# INSERT
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.integration
def test_add_retourne_un_id(repo: TransactionRepository, transaction_depense: Transaction):
    """Ajouter une transaction valide doit retourner un ID entier positif."""
    new_id = repo.add(transaction_depense)
    assert new_id is not None
    assert isinstance(new_id, int)
    assert new_id > 0


@pytest.mark.integration
def test_add_transaction_retrouvable(repo: TransactionRepository, transaction_depense: Transaction):
    """La transaction ajoutée doit être retrouvable par son ID."""
    new_id = repo.add(transaction_depense)
    row = repo.get_by_id(new_id)

    assert row is not None
    assert row["montant"] == pytest.approx(42.50)
    assert row["categorie"] == "Alimentation"
    assert row["type"] == "Dépense"


@pytest.mark.integration
def test_add_doublon_external_id_ignore(repo: TransactionRepository):
    """Deux transactions avec le même external_id : la 2e doit être ignorée."""
    t = Transaction(
        type="Dépense", categorie="Transport", montant=10.0,
        date=date(2026, 1, 1), external_id="EXT-001",
        source="Manuel", sous_categorie=None, description=None,
        recurrence=None, date_fin=None, compte_iban=None, id=None,
    )
    id1 = repo.add(t)
    id2 = repo.add(t)  # doublon

    assert id1 is not None
    assert id2 is None  # ignoré silencieusement


# ─────────────────────────────────────────────────────────────────────────────
# UPDATE
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.integration
def test_update_modifie_le_montant(repo: TransactionRepository, transaction_depense: Transaction):
    """Modifier le montant d'une transaction existante doit persister."""
    new_id = repo.add(transaction_depense)

    updated = {
        "id": new_id,
        "type": "Dépense",
        "categorie": "Alimentation",
        "montant": 99.99,
        "date": date(2026, 1, 15),
        "source": "Manuel",
    }
    success = repo.update(updated)
    assert success is True

    row = repo.get_by_id(new_id)
    assert row["montant"] == pytest.approx(99.99)


@pytest.mark.integration
def test_update_sans_id_retourne_false(repo: TransactionRepository):
    """Un update sans ID doit retourner False sans exception."""
    result = repo.update({"type": "Dépense", "categorie": "Test", "montant": 1.0})
    assert result is False


# ─────────────────────────────────────────────────────────────────────────────
# DELETE
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.integration
def test_delete_supprime_la_transaction(repo: TransactionRepository, transaction_depense: Transaction):
    """Supprimer une transaction : elle ne doit plus être retrouvable."""
    new_id = repo.add(transaction_depense)
    success = repo.delete(new_id)

    assert success is True
    assert repo.get_by_id(new_id) is None


@pytest.mark.integration
def test_delete_batch(repo: TransactionRepository, transactions_batch: list):
    """Supprimer plusieurs transactions en une fois."""
    ids = [repo.add(t) for t in transactions_batch]
    assert all(i is not None for i in ids)

    success = repo.delete(ids)
    assert success is True

    df = repo.get_all()
    assert df.empty


# ─────────────────────────────────────────────────────────────────────────────
# GET ALL / FILTRES
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.integration
def test_get_all_retourne_toutes_les_transactions(
    repo: TransactionRepository, transactions_batch: list
):
    """get_all() doit retourner autant de lignes qu'on en a insérées."""
    for t in transactions_batch:
        repo.add(t)

    df = repo.get_all()
    assert len(df) == len(transactions_batch)


@pytest.mark.integration
def test_get_filtered_par_categorie(repo: TransactionRepository, transaction_depense: Transaction, transaction_revenu: Transaction):
    """Le filtre par catégorie doit n'exposer que les transactions correspondantes."""
    repo.add(transaction_depense)   # Alimentation
    repo.add(transaction_revenu)    # Salaire

    df = repo.get_filtered(category="Alimentation")
    assert len(df) == 1
    assert df.iloc[0]["categorie"] == "Alimentation"


@pytest.mark.integration
def test_get_all_vide_retourne_dataframe_vide(repo: TransactionRepository):
    """Sur une DB vide, get_all() doit retourner un DataFrame vide (pas une erreur)."""
    df = repo.get_all()
    assert df.empty

