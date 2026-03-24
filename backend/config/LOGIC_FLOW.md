# Logic Flow — config/ (Configuration)

## Fichiers concernés

```
backend/config/
├── __init__.py              # Configuration globale
├── paths.py                  # Chemins des fichiers
└── logging_config.py        # Configuration logging
```

## Arbre des dépendances

```
config/__init__.py
└── os (environ)
└── paths.py

config/paths.py
└── pathlib (Path)

config/logging_config.py
└── logging
└── pathlib (Path)
```

## Impact

| Fichier | Impact | Usage |
|---------|--------|-------|
| `__init__.py` | **TOUT** le backend | Variables globales (TEST_MODE, etc.) |
| `paths.py` | Tous les modules utilisant des chemins | repositories, services |
| `logging_config.py` | Tous les modules utilisant logger | logging |

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `TEST_MODE` | Si "true", utilise base de test |
| `DATA_DIR` | Répertoire des données |
| `RESOURCES_DIR` | Répertoire des ressources |

## Effet papillon

**Si tu modifies...** → **Ça affecte...**

| Fichier modifié | Impact |
|-----------------|--------|
| `__init__.py` | **TOUT** le backend |
| `paths.py` | repositories, services, API |
| `logging_config.py` | logging dans tout le backend |