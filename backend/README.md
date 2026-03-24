# Backend — Gestio V4

API FastAPI avec architecture Domain-Driven Design (DDD).

## Structure

```
backend/
├── main.py                    # Point d'entrée FastAPI
├── api/                       # Endpoints REST
│   ├── transactions.py         # CRUD transactions
│   ├── dashboard.py           # Résumé financier
│   └── attachments.py         # Pièces jointes
│
├── domains/                   # Logique métier (DDD)
│   ├── home/                  # (réservé)
│   └── transactions/          # Transactions, récurrences, pièces jointes
│       ├── database/          # Modèles, repositories, schéma
│       │   ├── model.py       # Transaction (Pydantic)
│       │   ├── repository.py  # CRUD
│       │   └── schema.py     # Schéma DB
│       └── services/          # Logique métier
│
├── shared/                    # Composants partagés
│   ├── database/              # Connexion SQLite
│   └── utils/                # Helpers (categories_loader)
│
├── config/                    # Configuration
└── resources/                # Assets (attachments, icons)
```

## Ajouter un nouveau domain

### 1. Créer la structure

```bash
backend/domains/mon_nouveau_domaine/
├── __init__.py
├── database/
│   ├── __init__.py
│   ├── model.py          # Modèle Pydantic
│   └── repository.py     # CRUD
└── services/
    ├── __init__.py
    └── mon_service.py    # Logique métier
```

### 2. Créer l'API

```python
# backend/api/mon_nouveau_domaine.py
from fastapi import APIRouter
from backend.domains.mon_nouveau_domaine.database.repository import MonRepo

router = APIRouter(prefix="/api/mon_nouveau_domaine", tags=["mon_nouveau_domaine"])
repo = MonRepo()

@router.get("/")
async def get_items():
    return repo.get_all()
```

### 3. Ajouter dans main.py

```python
from backend.api.mon_nouveau_domaine import router as nouveau_router
app.include_router(nouveau_router)
```

### 4. Créer le LOGIC_FLOW

Créer `backend/api/mon_nouveau_domaine/LOGIC_FLOW.md`

---

## Architecture DDD

### Règles

1. **Un domaine ne doit pas importer un autre domaine**
   - ✅ `api` → `domain.transactions`
   - ✅ `shared` → `domain.transactions`
   - ❌ `domain.transactions` → `domain.home`

2. **Les modules de `shared/` ne doivent jamais importer un domaine**
   - Sens unique : domaine → shared

3. **Tout accès DB passe par le repository**

---

## API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/dashboard/` | Résumé financier |
| `GET` | `/api/transactions/` | Liste transactions |
| `POST` | `/api/transactions/` | Ajouter transaction |
| `DELETE` | `/api/transactions/:id` | Supprimer transaction |
| `GET` | `/api/attachments/transaction/:id` | Liste pièces jointes |
| `POST` | `/api/attachments/transaction/:id` | Upload pièce jointe |
| `DELETE` | `/api/attachments/:id` | Supprimer pièce jointe |

---

## Base de données

- **Fichier** : `data/base.db`
- **Outil** : SQLite
- **Migrations** : Via `schema.py`

---

## Commandes

```bash
uv sync                           # Installer
uv run uvicorn backend.main:app --reload   # Dev (port 8001)
pytest                            # Tests
```

---

## Documentation par domaine

Voir les fichiers `LOGIC_FLOW.md` dans :

- `backend/api/transactions/LOGIC_FLOW.md`
- `backend/api/dashboard/LOGIC_FLOW.md`
- `backend/api/attachments/LOGIC_FLOW.md`