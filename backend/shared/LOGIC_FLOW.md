# Logic Flow — shared/ (Composants partagés)

## Fichiers concernés

```
backend/shared/
├── database/
│   └── connection.py          # Connexion SQLite
├── utils/
│   ├── categories_loader.py    # Chargement catégories YAML
│   ├── converters.py         # Converters
│   └── amount_parser.py      # Parseur de montants
├── services/
│   └── security.py            # Sécurité
├── ui/
│   ├── toast_components.py   # Notifications
│   ├── styles.py            # Styles
│   └── helpers.py            # Helpers UI
└── exceptions.py             # Exceptions personnalisées
```

## Arbre des dépendances

```
shared/database/connection.py
└── sqlite3
└── pathlib (Path)
└── backend.config.paths

shared/utils/categories_loader.py
└── yaml
└── pathlib (Path)
└── backend.config.paths

shared/exceptions.py
└── (pas de dépendance externe)
```

## Impact par dossier

### `database/connection.py`

| Utilisé par | Impact |
|------------|--------|
| Tous les repositories | Si modifié → tous les endpoints |

### `utils/categories_loader.py`

| Utilisé par | Impact |
|------------|--------|
| `backend/api/dashboard.py` | Dashboard, SunburstChart |

### `exceptions.py`

| Utilisé par | Impact |
|------------|--------|
| Tous les services | Si modifié → propagation exceptions |

### `ui/` (Streamlit - Legacy)

| Utilisé par | Impact |
|------------|--------|
| Pages Streamlit (ui-V1) | **PAS utilisé** dans V4 (FastAPI) |

## Effet papillon

**Si tu modifies...** → **Ça affecte...**

| Fichier modifié | Impact |
|-----------------|--------|
| `connection.py` | **TOUT** le backend (tous les repositories) |
| `categories_loader.py` | Dashboard uniquement |
| `exceptions.py` | Tous les services et API |
| `ui/*` | **Personne** (legacy, plus utilisé en V4) |