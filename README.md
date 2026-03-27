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
- Node.js 20+
- **uv** (gestionnaire Python)

### Backend

```bash
uv sync
uv run uvicorn backend.main:app --reload   # http://localhost:8002
```

### Frontend

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

## Règles de développement

### Taille des fichiers

**INTERDIT :** Tout fichier dépassant **200 lignes** doit être subdivisé.

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