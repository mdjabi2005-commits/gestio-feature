# AGENTS.md — Gestio V4 (Feature Branch)

> Application Python + Streamlit + SQLite pour gestion financière personnelle.

---

## ⚡ Commandes de Build/Lint/Test

### Installation et lancement

```bash
uv sync                          # Installer les dépendances
uv run streamlit run main.py     # Lancer en dev
```

### Tests

```bash
pytest                           # Tous les tests
pytest -v                        # Mode verbose
pytest tests/path/test_file.py::test_function   # Test unitaire spécifique
pytest --cov=domains --cov=shared --cov-report=html  # Avec coverage
pytest -m unit                   # Tests unitaires purs
pytest -m integration            # Tests avec DB
```

### Build

```bash
uv sync --group build
uv run pyinstaller gestio.spec
```

---

## 📐 Conventions de Code

### Stack
- Python 3.12+, Pydantic, Pandas, Plotly, Streamlit, SQLite
- Gestion dépendances : **uv** (jamais pip directement)

### Règles fondamentales

1. **Clés en français** : `categorie`, `montant`, `date`, `type` — pas de mapping FR↔EN
2. **Type hints obligatoires** sur toutes les fonctions publiques
3. **Ne jamais accéder au repository depuis les pages Streamlit** — passer par les services
4. **Logger** : `logger = logging.getLogger(__name__)` — jamais de `print()`
5. **Chemins** : utiliser `pathlib.Path` — jamais `os.path`
6. **Imports** : absolus uniquement — pas de `.` relatifs

### Taille des fichiers
- **Alerte : 200 lignes**, **Max : 300 lignes** — au-delà, subdiviser (SRP)

### Imports (ordre obligatoire)

```python
# 1. Bibliothèques standard
import logging
from datetime import date
from pathlib import Path
from typing import Optional, List

# 2. Bibliothèques tierces
import pandas as pd
import streamlit as st
from pydantic import BaseModel, Field, validator

# 3. Imports locaux
from shared.database import get_db_connection
from domains.transactions.database.model import Transaction

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
from shared.exceptions import DatabaseError, ValidationError
from shared.ui.toast_components import toast_error, toast_success

try:
    result = service.add(data)
except ValidationError as e:
    toast_error(f"Données invalides: {e}")
except DatabaseError as e:
    toast_error("Erreur base de données")
    logger.error(f"DB error: {e}", exc_info=True)
```

### UI Streamlit — Notifications

**Toujours** utiliser les helpers, jamais `st.success()` directement :

```python
from shared.ui.toast_components import toast_success, toast_error, toast_warning
toast_success("Opération réussie")
toast_error("Une erreur est survenue")
```

---

## 🧪 Structure des tests

```
tests/
├── conftest.py                    # Fixtures partagées
├── test_transactions/
│   ├── test_repository.py         # Tests CRUD
│   └── test_service.py            # Tests logique métier
├── test_ocr/
│   └── test_parser.py
└── test_shared/
    └── test_utils.py
```

### Tests obligatoires

| Fichier créé | Test requis |
|--------------|-------------|
| `services/*.py` | ✅ `tests/test_services/test_*.py` |
| `shared/utils/*.py` | ✅ `tests/test_shared/test_*.py` |
| `database/repository*.py` | ✅ `tests/test_transactions/test_repository*.py` |
| `pages/*.py` (UI pure) | ❌ Non |

---

## 🎨 Style Git

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

## ⚠️ Règles Importantes

1. **Pas de secrets hardcodés** — utiliser `os.getenv()` ou `.env`
2. **Pas de code mort commenté** — supprimer (YAGNI)
3. **Pas de boucles `iterrows()`** — utiliser la vectorisation pandas
4. **Migrations** : via `schema.py` uniquement
5. **Déploiement CI/CD** : `.github/workflows/build.yml` pour Windows
