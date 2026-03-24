# Skill: Backend Python (FastAPI)

Instructions pour travailler sur l'API backend de Gestio V4.

## Contexte du projet

- **Stack** : Python 3.12+, FastAPI, Pydantic, SQLite
- **Architecture** : Domain-Driven Design (DDD)
- **API** : RESTful, sur http://localhost:8001

## Fichiers clés

- `backend/main.py` — Point d'entrée FastAPI
- `backend/api/` — Endpoints REST
- `backend/domains/transactions/` — Domaine principal
- `backend/shared/database/` — Connexion SQLite

## Commandes

```bash
uv sync                              # Installer les dépendances
uv run uvicorn backend.main:app --reload   # Serveur de dev
pytest tests/test_services/          # Lancer les tests
```

## Règles

1. Imports absolus : `from backend.shared.database import get_db_connection`
2. Type hints obligatoires sur toutes les fonctions publiques
3. Jamais d'accès direct au repository depuis les endpoints API — passer par les services
4. Clés en français : `categorie`, `montant`, `date`, `type`
5. Logger : `logger = logging.getLogger(__name__)` — jamais de `print()`

## Taille des fichiers

**INTERDIT :** Tout fichier dépassant **200 lignes** doit être subdivisé.

## Gestion des erreurs

```python
from backend.shared.exceptions import DatabaseError, ValidationError
from fastapi import HTTPException

try:
    result = service.add(data)
except ValidationError as e:
    raise HTTPException(status_code=400, detail=f"Données invalides: {e}")
except DatabaseError as e:
    logger.error(f"DB error: {e}", exc_info=True)
    raise HTTPException(status_code=500, detail="Erreur base de données")
```

## Tests requis

- `services/*.py` → `tests/test_services/test_*.py`
- `shared/utils/*.py` → `tests/test_shared/test_*.py`
- `database/repository*.py` → `tests/test_transactions/test_repository*.py`