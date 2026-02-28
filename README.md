# 💰 Gestio V4

> Application de **gestion financière personnelle** — Python · Streamlit · SQLite

[![Build](https://github.com/mdjabi2005-commits/gestio-feature/actions/workflows/build.yml/badge.svg)](https://github.com/mdjabi2005-commits/gestio-feature/actions/workflows/build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Python 3.12+](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/)

---

## ✨ Fonctionnalités

| Module | Description |
|--------|-------------|
| 🏠 **Accueil** | Tableau de bord avec KPI, graphiques et vue calendrier |
| 📊 **Transactions** | CRUD complet, filtrage avancé, graphiques Plotly & sunburst |
| 🔄 **Récurrences** | Gestion des transactions récurrentes (loyer, abonnements…) |
| 📎 **Pièces jointes** | Associer des fichiers (tickets, factures) aux transactions |
| 🔍 **OCR** | Extraction automatique depuis tickets/PDF (RapidOCR + LLM) |
| 📥 **Import** | Import en masse depuis fichiers externes |

---

## 🏗️ Architecture

Le projet suit une architecture **Domain-Driven Design (DDD)** :

```
v4/
├── main.py                          ← Point d'entrée Streamlit
├── launcher.py                      ← Lanceur (dev + PyInstaller)
├── pyproject.toml                   ← Dépendances & config projet (uv)
│
├── config/                          ← Configuration globale
│   ├── paths.py                     ← Chemins (DB, dossiers)
│   └── logging_config.py           ← Logging structuré
│
├── domains/                         ← Domaines métier (DDD)
│   ├── home/
│   │   └── pages/home.py           ← Page d'accueil / tableau de bord
│   │
│   └── transactions/
│       ├── database/                ← Modèles, repositories, schéma SQLite
│       │   ├── model.py             ← Modèle Transaction (Pydantic)
│       │   ├── model_recurrence.py  ← Modèle Récurrence
│       │   ├── model_attachment.py  ← Modèle Pièce jointe
│       │   ├── repository.py        ← CRUD transactions
│       │   ├── repository_recurrence.py
│       │   ├── repository_attachment.py
│       │   ├── schema.py            ← Migrations tables
│       │   └── constants.py         ← Catégories, constantes
│       │
│       ├── services/                ← Logique métier
│       │   ├── transaction_service.py
│       │   └── attachment_service.py
│       │
│       ├── recurrence/              ← Service récurrences
│       │   └── recurrence_service.py
│       │
│       ├── ocr/                     ← Extraction de texte
│       │   ├── core/                ← Moteurs OCR (RapidOCR, PDF, LLM)
│       │   └── services/            ← Service OCR + patterns YAML
│       │
│       ├── pages/                   ← Pages Streamlit
│       │   ├── add/                 ← Ajout de transaction
│       │   ├── view/                ← Consultation & filtres
│       │   ├── recurrences/         ← Gestion récurrences
│       │   └── import_page/         ← Import en masse
│       │
│       └── view/                    ← Composants visuels
│           ├── components/          ← Charts, KPI, calendrier, table
│           └── sunburst_navigation/ ← Navigation sunburst (D3/Plotly)
│
├── shared/                          ← Utilitaires transversaux
│   ├── database/connection.py       ← Connexion SQLite centralisée
│   ├── ui/                          ← Helpers UI, styles, toasts, erreurs
│   ├── services/security.py         ← Sécurité
│   ├── utils/converters.py          ← Convertisseurs
│   └── exceptions.py               ← Exceptions métier
│
├── resources/                       ← Assets statiques
│   ├── styles/                      ← CSS (gestio.css, calendar.css)
│   └── icons/                       ← Icônes app (générées)
│
└── .github/
    └── workflows/
        ├── build.yml                ← Build Windows + signature Azure + Release
        └── deploy-site.yml          ← Déploiement site docs (GitHub Pages)
```

---

## 🚀 Installation & Lancement

### Prérequis

- **Python 3.12+**
- **[uv](https://docs.astral.sh/uv/)** (gestionnaire de dépendances)

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/mdjabi2005-commits/gestio-feature.git
cd gestio-feature

# Installer les dépendances avec uv
uv sync
```

### Lancement (mode développement)

```bash
# Via Streamlit directement
uv run streamlit run main.py

# Ou via le launcher (ouvre le navigateur automatiquement)
uv run python launcher.py
```

### Build Windows (exécutable)

```bash
# Installer les dépendances de build
uv sync --group build

# Générer l'exécutable avec PyInstaller
uv run pyinstaller gestio.spec
```

> Le workflow CI/CD (`build.yml`) automatise le build + signature Azure + release GitHub sur les tags `v*.*.*`.

---

## 🛠️ Stack technique

| Composant | Technologie |
|-----------|-------------|
| **Langage** | Python 3.12 |
| **UI** | Streamlit |
| **Données** | SQLite + Pandas |
| **Graphiques** | Plotly, Matplotlib |
| **Validation** | Pydantic |
| **OCR** | RapidOCR, pdfminer.six, Ollama (LLM) |
| **Dépendances** | uv |
| **Build** | PyInstaller + Inno Setup |
| **CI/CD** | GitHub Actions |

---

## 📐 Conventions

### Commits (Conventional Commits)

```
feat: ajouter export PDF des transactions
fix: corriger le calcul des récurrences mensuelles
chore: mettre à jour les dépendances
docs: documenter le module OCR
refactor: extraire la logique de filtrage dans un service
test: ajouter tests unitaires pour transaction_service
```

### Branches

| Préfixe | Usage |
|---------|-------|
| `main` | Branche principale stable |
| `feat/` | Nouvelles fonctionnalités |
| `fix/` | Corrections de bugs |
| `chore/` | Maintenance, refactoring |

---

## 📄 Licence

[MIT](LICENSE) © 2026 DJABI

