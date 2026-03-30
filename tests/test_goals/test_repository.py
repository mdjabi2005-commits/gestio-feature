"""
Tests du GoalRepository — CRUD complet sur base de données de test.
"""

import pytest
from datetime import date

from backend.domains.goals.database.model_goal import Goal
from backend.domains.goals.database.repository_goal import GoalRepository


@pytest.fixture
def goal_repo(db_path) -> GoalRepository:
    """Repository branché sur la DB de test."""
    repo = GoalRepository(db_path=db_path)
    from backend.domains.goals.database.schema_goal import init_goal_table

    init_goal_table(db_path)
    return repo


@pytest.fixture
def goal_vacances() -> Goal:
    """Objectif vacances."""
    return Goal(
        nom="Vacances 2026",
        montant_cible=2000.0,
        date_fin=date(2026, 12, 31),
        categorie="Loisirs",
        description="Vacances d'été",
        statut="active",
    )


@pytest.fixture
def goal_voiture() -> Goal:
    """Objectif voiture."""
    return Goal(
        nom="Voiture",
        montant_cible=10000.0,
        date_fin=date(2027, 6, 30),
        categorie="Voiture",
        description="Achat voiture",
        statut="active",
    )


@pytest.mark.integration
def test_add_goal(goal_repo, goal_vacances):
    """Ajoute un objectif et vérifie son ID de retour."""
    goal_id = goal_repo.add(goal_vacances)
    assert goal_id is not None
    assert goal_id > 0


@pytest.mark.integration
def test_get_all_goals(goal_repo, goal_vacances, goal_voiture):
    """Récupère tous les objectifs."""
    goal_repo.add(goal_vacances)
    goal_repo.add(goal_voiture)

    results = goal_repo.get_all()

    assert len(results) == 2


@pytest.mark.integration
def test_get_by_id(goal_repo, goal_vacances):
    """Récupère un objectif par son ID."""
    goal_id = goal_repo.add(goal_vacances)

    result = goal_repo.get_by_id(goal_id)

    assert result is not None
    assert result.nom == "Vacances 2026"
    assert result.montant_cible == 2000.0


@pytest.mark.integration
def test_get_by_id_not_found(goal_repo):
    """Récupère un objectif inexistant."""
    result = goal_repo.get_by_id(99999)
    assert result is None


@pytest.mark.integration
def test_update_goal(goal_repo, goal_vacances):
    """Met à jour un objectif existant."""
    goal_id = goal_repo.add(goal_vacances)

    success = goal_repo.update(
        goal_id,
        {
            "nom": "Vacances modifiées",
            "montant_cible": 2500.0,
            "date_fin": date(2026, 12, 31),
            "categorie": "Loisirs",
            "description": "Vacances modifiées",
            "statut": "active",
            "poids_allocation": 1.0,
        },
    )

    assert success is True

    result = goal_repo.get_by_id(goal_id)
    assert result.nom == "Vacances modifiées"
    assert result.montant_cible == 2500.0


@pytest.mark.integration
def test_delete_goal(goal_repo, goal_vacances):
    """Supprime un objectif."""
    goal_id = goal_repo.add(goal_vacances)

    success = goal_repo.delete(goal_id)

    assert success is True
    assert goal_repo.get_by_id(goal_id) is None


@pytest.mark.integration
def test_get_all_with_progress(goal_repo, goal_vacances, db_path):
    """Récupère les objectifs avec progression."""
    from backend.domains.transactions.database.repository import transaction_repository
    from backend.domains.transactions.database.schema import init_transaction_table

    transaction_repository.db_path = db_path
    init_transaction_table(db_path)

    goal_repo.add(goal_vacances)

    results = goal_repo.get_all_with_progress()

    assert len(results) == 1
    assert hasattr(results[0], "montant_actuel")
    assert hasattr(results[0], "progression_pourcentage")
