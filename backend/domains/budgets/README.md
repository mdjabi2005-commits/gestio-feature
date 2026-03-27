# Budgets Domain

## Fonctionnalité

Gestion des budgets mensuels par catégorie.

## Fichiers

- `model.py` - Modèle Pydantic Budget
- `repository.py` - Accès données SQLite

## Usage

```python
from backend.domains.budgets.repository import budget_repository
from backend.domains.budgets.model import Budget

# Récupérer tous les budgets
budgets = budget_repository.get_all()

# Upsert (créer ou mettre à jour)
budget = Budget(categorie="Alimentation", montant_max=500)
budget_repository.upsert(budget)

# Supprimer
budget_repository.delete(budget_id)
```
