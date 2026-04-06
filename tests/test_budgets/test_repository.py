"""
Tests du BudgetRepository — CRUD complet sur base de données de test.
"""

import pytest

from backend.domains.budgets.database.model import Budget
from backend.domains.budgets.database.repository import BudgetRepository


@pytest.fixture
def budget_repo(db_path) -> BudgetRepository:
    """Repository branché sur la DB de test."""
    repo = BudgetRepository(db_path=db_path)
    from backend.domains.budgets.database.schema import init_budgets_table

    init_budgets_table(db_path)
    return repo


@pytest.fixture
def budget_alimentation() -> Budget:
    """Budget alimentation."""
    return Budget(categorie="Alimentation", montant_max=500.0)


@pytest.fixture
def budget_transport() -> Budget:
    """Budget transport."""
    return Budget(categorie="Transport", montant_max=200.0)


@pytest.mark.integration
def test_upsert_budget(budget_repo, budget_alimentation):
    """Crée un nouveau budget."""
    result = budget_repo.upsert(budget_alimentation)

    assert result is not None
    assert result.categorie == "Alimentation"
    assert result.montant_max == 500.0


@pytest.mark.integration
def test_upsert_budget_update_existing(budget_repo, budget_alimentation):
    """Met à jour un budget existant."""
    budget_repo.upsert(budget_alimentation)

    budget_alimentation.montant_max = 600.0
    result = budget_repo.upsert(budget_alimentation)

    assert result.montant_max == 600.0


@pytest.mark.integration
def test_get_all_budgets(budget_repo, budget_alimentation, budget_transport):
    """Récupère tous les budgets."""
    budget_repo.upsert(budget_alimentation)
    budget_repo.upsert(budget_transport)

    results = budget_repo.get_all()

    assert len(results) == 2


@pytest.mark.integration
def test_get_by_category(budget_repo, budget_alimentation):
    """Récupère un budget par catégorie."""
    budget_repo.upsert(budget_alimentation)

    result = budget_repo.get_by_category("Alimentation")

    assert result is not None
    assert result.categorie == "Alimentation"


@pytest.mark.integration
def test_get_by_category_not_found(budget_repo):
    """Récupère un budget inexistant."""
    result = budget_repo.get_by_category("Inconnu")

    assert result is None


@pytest.mark.integration
def test_delete_budget(budget_repo, budget_alimentation):
    """Supprime un budget."""
    result = budget_repo.upsert(budget_alimentation)
    budget_id = result.id

    success = budget_repo.delete(budget_id)

    assert success is True
    assert budget_repo.get_by_category("Alimentation") is None
