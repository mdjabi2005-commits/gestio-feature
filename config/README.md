# 📁 Dossier `/config`

## 🎯 But du dossier

Ce dossier centralise **toute la configuration de l'application** : chemins de fichiers et configuration du logging.

---

## 📄 Fichiers

### 1. `__init__.py`

**Rôle** : Point d'entrée du module de configuration. Exporte les constantes de chemins pour un accès facile.

**Exports principaux** :

```python
from .paths import (
    DATA_DIR, DB_PATH, TO_SCAN_DIR, SORTED_DIR,
    REVENUS_A_TRAITER, REVENUS_TRAITES,
    CSV_EXPORT_DIR, CSV_TRANSACTIONS_SANS_TICKETS
)
```

**Utilisation** :

```python
from config import DB_PATH
```

---

### 2. `paths.py`

**Rôle** : Définit **tous les chemins de fichiers et répertoires** utilisés par l'application.

#### Configuration des chemins

**Répertoire racine** :

```python
DATA_DIR = str(Path.home() / "analyse")
# Emplacement : C:\Users\<user>\analyse (ou /home/<user>/analyse sur Linux)
# Si TEST_MODE=true : C:\Users\<user>\test
```

**Base de données** :

```python
DB_PATH = os.path.join(DATA_DIR, "finances.db")
```

**Dossiers gérés** :

- `tickets_a_scanner` : Pour les tickets à traiter
- `tickets_tries` : Archives des tickets
- `revenus_a_traiter` / `revenus_traites` : Fiches de paie
- `logs` : Logs applicatifs
- `exports` : Exports CSV

#### Création automatique

Tous les dossiers sont créés automatiquement au démarrage.

---

### 3. `logging_config.py`

**Rôle** : Configuration avancée du système de logging.

**Fonctionnalités** :

- **Double sortie** :
    - **Fichiers** : Logs complets avec stack traces (erreurs détaillées).
    - **Console** : Logs épurés pour une meilleure lisibilité.
- **Trace ID** : Identifiant unique par erreur pour retrouver facilement une erreur console dans le fichier de log.
- **Rotation** : Les fichiers de logs tournent automatiquement quand ils atteignent 5MB (garde les 3 derniers).

---

## 📦 Dépendances

- `os` : Manipulation de chemins
- `pathlib.Path` : Chemins cross-platform
- `logging` : Système de logs standard Python

## ⚠️ NotesImportantes

- La configuration **OCR** et **Database** (catégories) n'est plus gérée ici mais directement dans les domaines
  respectifs ou via la base de données.
- `ui_config.py` a été supprimé car obsolète.
