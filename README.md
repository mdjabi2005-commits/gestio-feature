# Gestio V4

> Application de **gestion financière personnelle** — FastAPI + React + SQLite

[![Build](https://github.com/mdjabi2005-commits/gestio-feature/actions/workflows/build.yml/badge.svg)](https://github.com/mdjabi2005-commits/gestio-feature/actions/workflows/build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Fonctionnalités

| Module | Description |
|--------|-------------|
| **Dashboard** | KPIs, graphiques, résumé financier |
| **Transactions** | CRUD complet, filtrage, graphiques |
| **Pièces jointes** | Associer des fichiers aux transactions |
| **OCR** | Extraction automatique depuis tickets/PDF |

---

## Architecture

Architecture **DDD** avec API REST + client lourd :

```
gestion-financiere/
├── backend/           # API Python (FastAPI + SQLite)
│   ├── main.py        # Point d'entrée
│   ├── api/           # Endpoints REST
│   ├── config/        # Configuration
│   ├── domains/       # DDD - home/, transactions/
│   ├── shared/        # DB, services partagés
│   └── resources/     # Assets
│
├── frontend/          # UI (React + TypeScript + Tailwind)
│   ├── src/app/       # Pages
│   ├── src/components/
│   └── src/api.ts     # Client API
│
├── tests/             # Tests pytest
└── .github/           # CI/CD
```

---

## Installation et lancement

### Prérequis

- Python 3.12+
- Node.js 20+ (Uniquement pour le développement Frontend)
- **uv** (gestionnaire Python) - s'installe automatiquement si manquant via les scripts de démarrage.

### 🌟 Démarrage Universel (Recommandé)

Lancez simplement le script correspondant à votre OS. Il installera les dépendances automatiquement.
- Windows : `Double clic sur launcher.bat`
- Mac/Linux : `bash launcher.sh`

*(Note : Si le frontend n'est pas compilé et que `node_modules` est absent, le serveur démarrera en mode PROD sur `8002`)*

### Démarrage Manuel Séparé (Mode Développement Avancé)

**Backend:**
```bash
uv sync
uv run uvicorn backend.main:app --reload --port 8002   # http://localhost:8002
```

**Frontend:**
```bash
cd frontend && npm install
npm run dev         # http://localhost:3000
```

---

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| **Backend** | Python 3.12, FastAPI, SQLite, Pydantic |
| **Frontend** | React 19, TypeScript, Tailwind, Next.js |
| **API** | REST avec CORS |
| **Dépendances** | uv (Python), npm (JS) |

---

## Base de données

**La base SQLite utilise `platformdirs` pour un emplacement multi-plateforme.**

| Variable | Emplacement par défaut |
|----------|------------------------|
| Normal | `platformdirs.user_data_dir("Gestio")/finances.db` |
| Test (TEST_MODE=true) | `platformdirs.user_data_dir("Gestio")/test_finances.db` |

| OS | Emplacement |
|----|--------------|
| Windows | `C:\Users\<user>\AppData\Local\Gestio\finances.db` |
| Linux | `/home/<user>/.local/share/Gestio/finances.db` |

Voir : `backend/config/paths.py`

---

## Règles de développement

### Taille des fichiers

**INTERDIT :** Tout fichier dépassant **200 lignes** doit être subdivisé.

### Tests

```bash
# Lancer tous les tests (depuis la racine du projet)
uv run pytest tests/ -v

# Lancer un test spécifique
uv run pytest tests/test_transactions/test_repository.py::test_insert -v

# Lancer avec coverage
uv run pytest tests/ --cov=backend --cov-report=html
```

### Commits

```
feat: ajouter l'export CSV des transactions
fix: corriger le filtre par catégorie
test: ajouter des tests pour le service
```

### Branches

| Préfixe | Usage |
|---------|-------|
| `main` | Production stable |
| `feat/` | Nouvelles fonctionnalités |
| `fix/` | Corrections de bugs |

---

## Licence

MIT © 2026 DJABI