# Goals Domain

## Fonctionnalité

Définition et suivi des jalons financiers ou objectifs d'épargne de l'utilisateur (ex: Rénovation, Fonds d'urgence). Calcule la progression par rapport aux allocations planifiées et aux transactions effectives.

## Fichiers

- `model.py` - Modèles Pydantic `Goal` et `GoalMilestone`
- `schema.py` - Schéma SQL (SQLite)
- `repository.py` - Opérations CRUD et récupération des statistiques/progression depuis la BDD

## Usage

### Récupération des Objectifs

```python
from backend.domains.goals.repository import goal_repository

# Récupérer tous les objectifs avec leur progression
all_goals = goal_repository.get_all()

# Sauvegarder un objectif
from backend.domains.goals.model import Goal
nouveau_goal = Goal(
    name="Vacances",
    target_amount=1500,
    current_amount=200,
    status="En cours"
)
goal_repository.upsert(nouveau_goal)
```

## Stratégie d'Épargne

L'évolution de chaque objectif (`current_amount`) se base logiquement sur la somme des opérations dédiées au financement de cet objectif dans le système, tel que distribué par les `SalaryPlan` ou ajouté manuellement dans une tirelire/catégorie d'épargne donnée.

---

## 🔧 Quick Reference

### Endpoints API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/goals/` | Liste les objectifs actuels |
| `POST` | `/api/goals/` | Créer ou modifier un objectif (Upsert) |
| `DELETE`| `/api/goals/{id}` | Supprimer un objectif |
| `GET` | `/api/goals/stats` | Données agrégées pour les KPI liés à l'épargne |

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Objectif supprimé inattendu` | Synchronisation UI/BDD imparfaite | Vider la cache ou redémarrer le Dashboard |
| `Target <= 0` | Validation échouée | `target_amount` doit toujours être strictement positif |
