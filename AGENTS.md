# AGENTS.md — Gestio V4

> **Point d'entrée pour TOUS les agents IA. À LIRE EN PREMIER.**

---

## ⚡ Début de session (OBLIGATOIRE)

1. **Lire ce fichier en entier**
2. **Lire les fichiers `.agent/`** (contexte spécifique par agent)
3. **Poser ces questions à l'utilisateur :**
   - Sur quelle issue travaille-t-on ? (ex: #12)
   - Sur quelle branche sommes-nous ? (`git branch --show-current`)

**Règles absolues :**
- **NE JAMAIS coder sur `main`**
- Si pas de branche précisée, **demander** avant de commencer
- Référencer `#{numéro}` dans chaque commit

---

### 📥 Lire une issue GitHub

**Cas 1 : Numéro d'issue connu**
```bash
python scripts/fetch_issue.py 123
# → Crée issue_123.md avec encodage UTF-8
```

**Cas 2 : Depuis une branche** (ex: branche `10-ma-feature`)
```bash
# Extraire le numéro de la branche (10) et récupérer l'issue
python scripts/fetch_issue.py 10
```

**NE JAMAIS** utiliser `gh issue view 123` directement — problèmes d'encodage garantis.

---

## 📁 Quel agent ?

| Agent | Scope | Lire ce fichier |
|-------|-------|-----------------|
| **Claude / Minimax** | `backend/` uniquement | `.agent/skill-backend.md` |
| **Gemini / v0 / Lovable** | `frontend/` uniquement | `.agent/skill-frontend.md` |
| **Tous agents** | Conventions globales | `.agent/skill-conventions.md` |
| **Tous agents** | Termes métier | `.agent/terms.md` |

---

## 🎯 Scope des agents (TRES IMPORTANT)

### Règle d'or : **1 agent = 1 dossier**

- **Agent Frontend** (Gemini, v0, Lovable) → **SEULEMENT** dans `frontend/`
- **Agent Backend** (Claude, Minimax) → **SEULEMENT** dans `backend/`

### Si un agent a besoin de changements dans l'autre partie :

**L'agent DOIT écrire un prompt à l'autre agent** pour expliquer les changements nécessaires.

---

## ⚙️ Commandes (Build / Lint / Test)

### Backend

```bash
# Installer les dépendances
uv sync

# Lancer le serveur (depuis la racine du projet)
uv run uvicorn backend.main:app --reload --port 8002

# Lancer tous les tests
uv run pytest tests/ -v

# Lancer un test spécifique
uv run pytest tests/test_transactions/test_repository.py::test_insert -v

# Lancer les tests avec coverage
uv run pytest tests/ --cov=backend --cov-report=html

# Lint (si configuré)
uv run ruff check backend/
```

### Frontend

```bash
# Installer les dépendances
cd frontend && npm install

# Lancer le serveur de développement
npm run dev          # http://localhost:3000

# Build production
npm run build

# Lint
npm run lint
```

### ⚠️ Important

- **TOUJOURS** exécuter pytest depuis la **racine du projet** (`V1-feature`), jamais depuis `backend/`
- Le dossier `tests/` est à la racine, pas dans `backend/`

---

## 📏 Code Style Guidelines

### Python (Backend)

| Règle | Détail |
|-------|--------|
| **Type hints** | Obligatoires sur toutes les fonctions publiques |
| **Imports** | Absolus uniquement (`from backend.shared...`), jamais relatifs (`from .`) |
| **Chemins** | Toujours `pathlib.Path`, jamais `os.path` |
| **Logging** | `logger = logging.getLogger(__name__)`, **jamais** de `print()` |
| **Pydantic** | Validation des modèles de données |
| **Exceptions** | Lever des exceptions métier (pas de `raise Exception`) |

### Ordre des imports

```python
# 1. Bibliothèques standard
import logging
from datetime import date
from pathlib import Path

# 2. Bibliothèques tierces
import pandas as pd
from fastapi import APIRouter
from pydantic import BaseModel

# 3. Imports locaux (absolus)
from backend.shared.database import get_db_connection
from backend.domains.transactions.database.model import Transaction

# 4. Logger en dernier
logger = logging.getLogger(__name__)
```

### TypeScript (Frontend)

| Règle | Détail |
|-------|--------|
| **Strict** | Mode strict activé, **jamais** de `any` |
| **Types** | Types explicites, interfaces pour les données API |
| **Styling** | Tailwind CSS uniquement |
| **Composants** | PascalCase (`TransactionTable.tsx`) |
| **Hooks** | Préfixe `use` (`useTransactions.ts`) |

### 🌍 Nommage (RÈGLE OBLIGATOIRE)

**TOUJOURS** utiliser des noms de champs en **français** dans les réponses API :

| À éviter ❌ | Correct ✅ |
|------------|-----------|
| `amount` | `montant` |
| `type: "income"` | `type: "revenu"` |
| `category` | `categorie` |
| `status: "paid"` | `statut: "reglee"` |

---

## 🏗️ Architecture

### Structure

```
gestion-financiere/
├── backend/           # FastAPI (port 8002)
│   ├── main.py       # Point d'entrée
│   ├── api/          # Endpoints REST
│   ├── domains/      # Logique métier (DDD)
│   ├── shared/      # Composants partagés
│   └── config/       # Configuration
├── frontend/         # React + TypeScript + Tailwind (port 3000)
│   └── src/app/     # Pages
├── tests/            # Tests pytest
└── .agent/           # Règles par agent
```

### Ports

| Service | Port |
|---------|------|
| Backend (FastAPI) | 8002 |
| Frontend (Next.js) | 3000 |

---

## ⚠️ Avant de modifier du code (OBLIGATOIRE)

### 1. Lire le LOGIC_FLOW du module

| Module | Emplacement |
|--------|--------------|
| Dashboard | `backend/api/dashboard/LOGIC_FLOW.md` |
| Transactions | `backend/api/transactions/LOGIC_FLOW.md` |
| Échéances | `backend/api/echeances/LOGIC_FLOW.md` |
| Budgets | `backend/api/budgets/LOGIC_FLOW.md` |
| OCR | `backend/api/ocr/LOGIC_FLOW.md` |

### 2. Comprendre le Data Flow

- **Comment les données entrent** (input)
- **Comment les données sortent** (output)
- **Quels services/API sont appelés**

### 3. Synchronisation Backend ↔ Frontend

Si tu modifies un **modèle Pydantic** dans le backend, tu DOIS aussi modifier les **types TypeScript** dans `frontend/src/api.ts`.

### 4. Vocabulaire et Concepts Complexes (GLOSSAIRE)

Si tu rencontres un terme métier complexe ou une notion technique que tu ne comprends pas, **tu DOIS consulter le fichier** `backend/GLOSSARY.md`. 
Si la notion n'y figure pas ou qu'elle manque de clarté, **n'hésite surtout pas à demander à l'utilisateur** de t'expliquer et d'enrichir ce glossaire pour que tu puisses mieux comprendre le code et son objectif global.

---

## 📏 Règles importantes

### Taille des fichiers

**INTERDIT :** Tout fichier dépassant **200 lignes**.

### Tests obligatoires

| Fichier créé | Test requis |
|-------------|-------------|
| Service | `tests/test_services/test_*.py` |
| Repository | `tests/test_transactions/test_*.py` |
| Utilitaire | `tests/test_shared/test_*.py` |

### Notifications UI

**Toujours** utiliser `toast_success`, `toast_error` de `backend/shared/ui/toast_components.py` — **jamais** `print()` ou `st.success()`.

---

## 🔌 Gestion des Chemins

Les chemins vers la base de données et dossiers ne sont **JAMAIS** en dur dans le code.
Voir : `backend/config/paths.py` → `DATA_DIR`

---

## 📝 Fin de session

Quand l'utilisateur dit **"fin de session"** ou **"session terminée"** :

1. **Lancer les tests** : `uv run pytest tests/ -v` et corriger les échecs
2. **Vérifier les READMEs/LOGIC_FLOWs** modifiés pendant la session
3. **Les mettre à jour** si besoin
