# Backend — Gestio V4

API FastAPI avec architecture Domain-Driven Design (DDD).

## Structure

```
backend/
├── main.py                    # Point d'entrée FastAPI
├── api/                       # Endpoints REST
│   ├── dashboard/            # Résumé financier
│   ├── transactions/          # CRUD transactions
│   ├── attachments/          # Pièces jointes
│   ├── ocr/                  # Scan tickets/PDF
│   ├── echeances/            # Échéances
│   └── budgets/              # Budgets mensuels
│
├── domains/                   # Logique métier (DDD)
│   ├── home/                 # Landing page
│   ├── transactions/         # Transactions, OCR
│   │   ├── database/         # Modèles, repositories
│   │   ├── ocr/              # Moteurs OCR (RapidOCR, Groq)
│   │   └── services/         # Logique métier
│   ├── budgets/              # Gestion budgets
│   └── goals/                # Objectifs financiers
│
├── shared/                    # Composants partagés
│   ├── database/              # Connexion SQLite
│   ├── services/             # File service
│   └── ui/                   # Composants UI
│
├── config/                    # Configuration (paths, logging)
└── resources/                # Assets (icons)
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
| `GET` | `/api/ocr/config` | Récupère la clé API Groq |
| `POST` | `/api/ocr/config` | Sauvegarde la clé API Groq |
| `POST` | `/api/ocr/scan` | Scan un ticket (image) |
| `POST` | `/api/ocr/scan-income` | Scan une fiche de paie (PDF) |
| `GET` | `/api/ocr/salary-plans` | Liste les plans de salaire |
| `POST` | `/api/ocr/salary-plans` | Sauvegarde un plan de salaire |
| `GET` | `/api/echeances/` | Liste des échéances |
| `POST` | `/api/echeances/` | Créer une échéance |
| `GET` | `/api/budgets/` | Liste des budgets |
| `POST` | `/api/budgets/` | Créer/mettre à jour un budget |
| `DELETE` | `/api/budgets/:id` | Supprimer un budget |

---

## Base de données

- **Emplacement** : Voir `backend/config/paths.py` (variable `DB_PATH`)
- **Outil** : SQLite
- **Migrations** : Via `schema.py`

---

## Commandes

```bash
uv pip install -r requirements.txt                           # Installer
uv run uvicorn backend.main:app --reload   # Dev (port 8002)
pytest                            # Tests
```

---

## Documentation par domaine

Voir les fichiers `LOGIC_FLOW.md` dans :

- `backend/api/transactions/LOGIC_FLOW.md`
- `backend/api/dashboard/LOGIC_FLOW.md`
- `backend/api/attachments/LOGIC_FLOW.md`
- `backend/api/ocr/LOGIC_FLOW.md`
- `backend/api/echeances/LOGIC_FLOW.md`
- `backend/api/budgets/LOGIC_FLOW.md`