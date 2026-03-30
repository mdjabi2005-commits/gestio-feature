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

**Répertoire de données techniques (DB, logs, archives) via platformdirs** :

```python
import platformdirs
DATA_DIR = platformdirs.user_data_dir(appname="Gestio", appauthor=False)
# Emplacement OS standard : Ex: C:\Users\<user>\AppData\Local\Gestio sur Windows
```

**Base de données** :

```python
DB_PATH = os.path.join(DATA_DIR, "finances.db")
```

**Dossiers gérés** :

- Placés sur le **Bureau** de l'utilisateur pour un accès facile (Dossiers de scan actif) :
  - `tickets_a_scanner` : Déposez vos tickets ici
  - `revenus_a_traiter` : Déposez vos fiches de paie / revenus ici
- Placés sous le **DATA_DIR** (Dossiers cachés / archivage) :
  - `tickets_tries` : Archives des tickets déjà scannés
  - `revenus_traites` : Archives des revenus scannés
  - `gestio_app.log` : Log applicatif

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
- `platformdirs` : Résolution des répertoires natifs de l'OS (Desktop, AppData, etc.)
- `logging` : Système de logs standard Python

## ⚠️ NotesImportantes

- La configuration **OCR** (GROQ_API_KEY) est gérée via variables d'environnement (`.env`).
- La configuration **Database** (catégories) est gérée directement dans les domaines ou via la base de données.
- `ui_config.py` a été supprimé car obsolète.
