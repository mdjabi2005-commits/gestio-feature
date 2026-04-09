# Goals API - Logique et Flux de Données

## Overview

API pour gérer les objectifs d'épargne (Goals).

---

## Endpoints

| Méthode | Route | Description |
|--------|-------|-------------|
| GET | `/api/goals/` | Liste tous les objectifs avec progression |
| GET | `/api/goals/{goal_id}` | Détail d'un objectif |
| POST | `/api/goals/` | Créer un objectif |
| PUT | `/api/goals/{goal_id}` | Modifier un objectif |
| DELETE | `/api/goals/{goal_id}` | Supprimer un objectif |
| GET | `/api/goals/{goal_id}/monthly-progress` | Progression mensuelle |

---

## Data Flow

### Création d'un objectif

```
HTTP POST /api/goals/
    ↓
Goal model validation
    ↓
goal_repository.add(goal)
    ↓
Return goal_id (int)
```

### Récupération avec progression

```
HTTP GET /api/goals/{goal_id}
    ↓
goal_repository.get_by_id_with_progress(goal_id)
    ↓
GoalWithProgress model
    ↓
Return JSON
```

---

## Modèles

### Goal (Input)
- `nom`: str (required)
- `montant_cible`: float (required, >= 0)
- `date_fin`: date (optional)
- `categorie`: str (required) — catégories définies dans goals.yaml
- `description`: str (optional)
- `statut`: str (default: "active")
- `poids_allocation`: float (default: 1.0, >= 0)

### GoalWithProgress (Output)
- Tous les champs de Goal
- `montant_actuel`: float — total des économies réalisées
- `progression_pourcentage`: float
- `montant_restant`: float
- `mois_restants`: int

---

## Dépendances

- `backend.domains.goals.model.Goal`
- `backend.domains.goals.model.GoalWithProgress`
- `backend.domains.goals.repository.goal_repository`
