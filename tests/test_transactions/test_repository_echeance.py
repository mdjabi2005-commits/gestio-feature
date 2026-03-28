"""
Tests du EcheanceRepository — CRUD complet sur base de données de test.
"""

import pytest
from datetime import date

from backend.domains.transactions.database.model_echeance import Echeance
from backend.domains.transactions.database.repository_echeance import EcheanceRepository


@pytest.fixture
def echeance_repo(db_path) -> EcheanceRepository:
    """Repository branché sur la DB de test."""
    repo = EcheanceRepository(db_path=db_path)
    from backend.domains.transactions.database.schema_table_echeance import (
        init_echeance_table,
    )

    init_echeance_table(db_path)
    return repo


@pytest.fixture
def echeance_loyer() -> Echeance:
    """Échéance de type dépense (loyer)."""
    return Echeance(
        nom="Loyer",
        type="depense",
        categorie="Logement",
        sous_categorie="Loyer",
        montant=800.0,
        frequence="mensuel",
        date_debut=date(2026, 1, 1),
        date_fin=date(2026, 12, 31),
        description="Loyer mensuel",
        statut="active",
        type_echeance="recurrente",
    )


@pytest.fixture
def echeance_salaire() -> Echeance:
    """Échéance de type revenu (salaire)."""
    return Echeance(
        nom="Salaire",
        type="revenu",
        categorie="Salaire",
        sous_categorie="Net",
        montant=2500.0,
        frequence="mensuel",
        date_debut=date(2026, 1, 1),
        description="Salaire mensuel",
        statut="active",
        type_echeance="recurrente",
    )


@pytest.mark.integration
def test_add_echeance(echeance_repo, echeance_loyer):
    """Ajoute une échéance et vérifie son ID de retour."""
    echeance_id = echeance_repo.add(echeance_loyer)
    assert echeance_id is not None
    assert echeance_id > 0


@pytest.mark.integration
def test_get_all_echeances(echeance_repo, echeance_loyer, echeance_salaire):
    """Récupère toutes les échéances actives."""
    echeance_repo.add(echeance_loyer)
    echeance_repo.add(echeance_salaire)

    results = echeance_repo.get_all()

    assert len(results) == 2


@pytest.mark.integration
def test_get_all_raw(echeance_repo, echeance_loyer):
    """Récupère toutes les échéances sous forme de dictionnaires."""
    echeance_repo.add(echeance_loyer)

    results = echeance_repo.get_all_raw()

    assert len(results) == 1
    assert results[0]["nom"] == "Loyer"


@pytest.mark.integration
def test_update_echeance(echeance_repo, echeance_loyer):
    """Met à jour une échéance existante."""
    echeance_id = echeance_repo.add(echeance_loyer)

    echeance_loyer.id = echeance_id
    echeance_loyer.montant = 850.0

    success = echeance_repo.update(echeance_loyer)

    assert success is True

    all_echeances = echeance_repo.get_all()
    assert all_echeances[0].montant == 850.0


@pytest.mark.integration
def test_delete_echeance(echeance_repo, echeance_loyer):
    """Supprime une échéance."""
    echeance_id = echeance_repo.add(echeance_loyer)

    success = echeance_repo.delete(echeance_id)

    assert success is True
    assert len(echeance_repo.get_all()) == 0


@pytest.mark.integration
def test_get_occurrences_for_month(echeance_repo, echeance_loyer):
    """Calcule les occurrences d'échéance pour un mois donné."""
    echeance_repo.add(echeance_loyer)

    occurrences = echeance_repo.get_occurrences_for_month(2026, 1)

    assert len(occurrences) == 1
    assert occurrences[0]["nom"] == "Loyer"
    assert occurrences[0]["montant"] == 800.0


@pytest.mark.integration
def test_get_occurrences_multiple_months(echeance_repo, echeance_loyer):
    """Calcule les occurrences sur plusieurs mois."""
    echeance_repo.add(echeance_loyer)

    jan = echeance_repo.get_occurrences_for_month(2026, 1)
    fev = echeance_repo.get_occurrences_for_month(2026, 2)
    mar = echeance_repo.get_occurrences_for_month(2026, 3)

    assert len(jan) == 1
    assert len(fev) == 1
    assert len(mar) == 1


@pytest.mark.integration
def test_echeance_with_objectif_id(echeance_repo):
    """Test une échéance liée à un objectif."""
    echeance = Echeance(
        nom="Épargne vacances",
        type="depense",
        categorie="Épargne",
        sous_categorie="Vacances",
        montant=100.0,
        frequence="mensuel",
        date_debut=date(2026, 1, 1),
        objectif_id=1,
        statut="active",
    )

    echeance_id = echeance_repo.add(echeance)

    assert echeance_id > 0
