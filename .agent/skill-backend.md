---
description: Règles pour le développement backend Python (FastAPI) - Pour Claude, Minimax
---

# Backend (Python + FastAPI)

Pour **Claude**, **Minimax** ou tout agent IA travaillant sur le backend.

## Contexte

- **Stack** : Python 3.12+, FastAPI, Pydantic, SQLite
- **Architecture** : Domain-Driven Design (DDD)
- **API** : RESTful sur http://localhost:8001

## Structure

```
backend/
├── main.py              # Point d'entrée FastAPI
├── api/                 # Endpoints REST
├── config/             # Configuration
├── domains/            # Logique métier (DDD)
│   ├── home/
│   └── transactions/
│       ├── database/   # Modèles, repositories
│       └── services/   # Logique métier
└── shared/             # Composants partagés (DB, services)
```

## Commandes

```bash
uv sync
uv run uvicorn backend.main:app --reload   # Dev
pytest tests/path/test.py::test_function   # Test unitaire
```

## Documentation (OBLIGATOIRE avant de coder)

**Avant toute modification, lire le LOGIC_FLOW correspondant :**

| Module | Emplacement |
|--------|--------------|
| Dashboard | `backend/api/dashboard/LOGIC_FLOW.md` |
| Transactions | `backend/api/transactions/LOGIC_FLOW.md` |
| Attachments | `backend/api/attachments/LOGIC_FLOW.md` |
| OCR | `backend/api/ocr/LOGIC_FLOW.md` |
| Echeances | `backend/api/echeances/LOGIC_FLOW.md` |

**Chaque LOGIC_FLOW contient :**
- Architecture du module (fichiers, dépendances)
- Data Flow (diagramme mermaid)
- Endpoints (méthode, path, entrée, sortie)
- Effet papillon (si je modifie X, ça affecte Y)
- Frontend associé

**Sans lire le LOGIC_FLOW, tu risques de :**
- Créer des dépendances circulaires
- Dupliquer du code existant
- Casser des fonctionnalités liées
- Mal comprendre le的数据 flow

## Règles fondamentales

1. **Imports absolus** : `from backend.shared.database import get_db_connection`
2. **Type hints** obligatoires sur toutes les fonctions publiques
3. **Jamais d'accès direct au repository** — passer par les services
4. **Clés en français** : `categorie`, `montant`, `date`, `type`
5. **Logger** : `logger = logging.getLogger(__name__)` — jamais de `print()`

## Règles DDD

- **Un domaine ne doit pas importer un autre domaine** — Passer par `shared/`
- **Les modules de `shared/` ne doivent jamais importer un domaine**
- **Pattern Repository** : Tout accès DB passe par le repository du domaine
- **Pas de SQL dans les endpoints** — Requêtes uniquement dans les repositories

## Imports (ordre)

```python
# 1. Bibliothèques standard
import logging
from datetime import date
from typing import Optional, List

# 2. Bibliothèques tierces
import pandas as pd
from fastapi import APIRouter
from pydantic import BaseModel, Field, validator

# 3. Imports locaux
from backend.shared.database import get_db_connection
from backend.domains.transactions.database.model import Transaction

# 4. Logger
logger = logging.getLogger(__name__)
```

## Pydantic

```python
from pydantic import BaseModel, Field, validator
from datetime import date as Date

class Transaction(BaseModel):
    type: str = Field(..., description="Type (Dépense/Revenu)")
    categorie: str = Field("Non catégorisé")
    montant: float = Field(..., ge=0)
    date: Date

    @validator("type", pre=True)
    def normalize_type(cls, v):
        return v.strip().capitalize() if isinstance(v, str) else v
```

## Erreurs

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

## ⚠️ Règle de taille

**INTERDIT :** Tout fichier dépassant **200 lignes**.