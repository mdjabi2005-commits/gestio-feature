# Budgets Domain

## Fonctionnalité

Gestion des budgets mensuels par catégorie et des Salary Plans (plans de salaire).

## Fichiers

- `model.py` - Modèle Pydantic Budget
- `repository.py` - Accès données SQLite (budgets)
- `model_salary_plan.py` - Modèle Pydantic SalaryPlan
- `repository_salary_plan.py` - Accès données SQLite (salary_plans)

## Usage

### Budgets

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

### Salary Plans

```python
from backend.domains.budgets.repository_salary_plan import salary_plan_repository
from backend.domains.budgets.model_salary_plan import SalaryPlan, SalaryPlanItem

# Récupérer tous les plans
plans = salary_plan_repository.get_all()

# Récupérer le plan actif
active_plan = salary_plan_repository.get_active()

# Créer un plan
plan = SalaryPlan(
    nom="Plan Principal",
    reference_salary=3000.0,
    is_active=True,
    items=[
        SalaryPlanItem(categorie="Loyer", montant=800, type="expense"),
        SalaryPlanItem(categorie="Salaire", montant=3000, type="income")
    ]
)
salary_plan_repository.upsert(plan)

# Supprimer
salary_plan_repository.delete(plan_id)
```

## Strategic Balance

Le calcul du "Solde Échéances" (Strategic Balance) se fait côté frontend :

1. **Revenu de référence** → `SalaryPlan.reference_salary`
2. **Échéances du mois** → `/api/echeances/`
3. **Solde** = Revenus récurrents - Charges fixes

Les échéances avec `status === 'paid'` sont incluses dans le calcul car elles représentent des charges/revenus du mois en cours.
