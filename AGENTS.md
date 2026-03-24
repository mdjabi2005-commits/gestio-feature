# AGENTS.md — Gestio V4

> Application de gestion financière personnelle. Architecture **FastAPI + React**.

---

## Architecture

```
gestion-financiere/
├── backend/           # API Python (FastAPI + SQLite)
│   ├── main.py        # Point d'entrée
│   ├── api/           # Endpoints REST
│   ├── config/        # Configuration
│   ├── domains/      # DDD - home/, transactions/
│   ├── shared/       # DB, services partagés
│   └── resources/    # Assets
├── frontend/          # UI (React + TS + Tailwind + Vite)
│   ├── src/app/      # Pages
│   ├── src/components/
│   └── src/api.ts    # Client API
├── tests/            # Tests pytest
└── .github/          # CI/CD
```

---

## Commandes

### Backend
```bash
uv sync                              # Installer
uv run uvicorn backend.main:app --reload   # Dev
pytest tests/path/test_file.py::test_function   # Test unitaire
pytest --cov=backend --cov-report=html          # Coverage
```

### Frontend
```bash
cd frontend && npm install
npm run dev                         # Dev
npm run build                       # Prod
npm run lint                        # Lint
```

---

## Conventions Backend (Python)

### Stack
- Python 3.12+, FastAPI, Pydantic, SQLite, Pandas — **uv** pour dépendances

### Règles fondamentales
1. **Clés en français** : `categorie`, `montant`, `date`, `type`
2. **Type hints** obligatoires sur toutes les fonctions publiques
3. **Jamais d'accès direct au repository depuis les endpoints API** — passer par les services
4. **Logger** : `logger = logging.getLogger(__name__)` — jamais de `print()`
5. **Imports** absolus uniquement — pas de `.` relatifs

### Imports (ordre obligatoire)
```python
# 1. Bibliothèques standard
import logging
from datetime import date
from pathlib import Path
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

### Pydantic Models
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

### Gestion d'erreurs
```python
from backend.shared.exceptions import DatabaseError, ValidationError

try:
    result = service.add(data)
except ValidationError as e:
    raise HTTPException(status_code=400, detail=f"Données invalides: {e}")
except DatabaseError as e:
    logger.error(f"DB error: {e}", exc_info=True)
    raise HTTPException(status_code=500, detail="Erreur base de données")
```

---

## Conventions Frontend (TypeScript/React)

### Stack
- React 19, TypeScript, Tailwind CSS, Vite — **npm**

### Règles fondamentales
1. **TypeScript strict** — pas de `any`
2. **Naming** : Composants `PascalCase`, Hooks `useXxx.ts`, Utils `camelCase`
3. **Styling** : Tailwind uniquement — pas de CSS inline

### Appels API
```tsx
import { api } from '@/api';

const transactions = await api.getTransactions();
await api.addTransaction(data);
```

---

## Règle de taille des fichiers (STRICTE)

**INTERDIT ABSOLUMENT :** Tout fichier dépassant **200 lignes** est INTERDIT.

Tout fichier doit être subdivisé en plusieurs fichiers plus petits (Single Responsibility Principle).

---

## Tests obligatoires

| Fichier créé | Test requis |
|--------------|-------------|
| `backend/services/*.py` | ✅ `tests/test_services/test_*.py` |
| `backend/shared/utils/*.py` | ✅ `tests/test_shared/test_*.py` |
| `backend/database/repository*.py` | ✅ `tests/test_transactions/test_repository*.py` |
| `frontend/components/*.tsx` | ❌ Non |

---

## Style Git

### Commits
```
feat: ajouter l'export CSV des transactions
fix: corriger le filtre par catégorie
refactor: extraire la logique de parsing
test: ajouter 5 tests pour le module recurrence
```

### Branches
| Préfixe | Usage |
|---------|-------|
| `main` | Production stable |
| `feat/` | Nouvelles fonctionnalités |
| `fix/` | Corrections de bugs |

---

## Règles Importantes

1. **Pas de secrets hardcodés** — utiliser `.env` et `os.getenv()`
2. **Pas de code mort commenté** — supprimer (YAGNI)
3. **Pas de boucles `iterrows()`** — vectorisation pandas
4. **Migrations** : via `schema.py` uniquement
5. **CI/CD** : `.github/workflows/build.yml` pour Windows