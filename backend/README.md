# Backend — Gestio V4

API FastAPI structurée selon les principes d'architecture stricte (Domain-Driven Design).

## 🗺️ Fonctionnalité Principale

Le backend sert de cerveau à l'application Gestio. Il expose des APIs REST pour le frontend, valide la logique métier, interagit avec la base de données SQLite de manière sécurisée et gère les processus complexes (OCR, IA, analyse des fichiers, moteurs de récurrence).

## 📂 Structure

```text
backend/
├── main.py                    # Point d'entrée FastAPI
├── api/                       # Définitions des Endpoints REST
│   ├── attachments/
│   ├── budgets/
│   ├── dashboard/ 
│   ├── echeances/
│   ├── goals/
│   ├── ocr/
│   └── transactions/
│
├── domains/                   # Logique Métier Séparée par Domaine (DDD)
│   ├── attachments/
│   ├── budgets/
│   ├── echeance/
│   ├── goals/
│   ├── ocr/
│   └── transactions/
│
├── shared/                    # Composants et utilitaires communs
├── config/                    # Configuration globale (ex: paths.py)
├── resources/                 # Ressources serveur et assets
└── GLOSSARY.md                # Lexique métier financier
```

## 🏗️ Architecture DDD (Domain-Driven Design)

L'architecture est construite pour maintenir le code isolé, testable et modulaire :

### Règles strictes d'importation

1. **Isolation des domaines : Un domaine ne doit pas inclure un autre domaine.**
   - ✅ L'API a le droit d'appeler les Domaines.
   - ✅ Un Composant partagé (`shared/`) peut être appelé partout.
   - ❌ `backend.domains.transactions` ne doit **pas** importer `backend.domains.budgets`. Pour interagir, passez par des services d'orchestration ou via des événements si nécessaire.

2. **Sens unique pour `shared/`**
   - Les modules situés dans `shared/` ne doivent **absolument jamais** importer quoi que ce soit depuis `domains/` ou `api/`. L'import doit toujours aller du domaine vers le shared.

3. **Couche d'Accès aux Données (Repositories)**
   - Tout accès à la base de données doit systématiquement passer par un objet ou fichier `repository.py` du domaine concerné. Les requêtes SQL/ORM ne doivent **jamais** exister dans un contrôleur d'API.
   - **Généricité et BaseRepository** : Tous les domaines héritent désormais de `BaseRepository` (`backend/shared/database/base_repository.py`). Ce modèle centralise le CRUD pur, sécurise l'atomicité des requêtes croisées via les contextes de base de données, et parse de façon stricte les modèles via `Pydantic`.

---

## 🔧 Quick Reference

### Documentation Détaillée

Chaque domaine possède son propre README expliquant sa logique et son fonctionnement. Par ailleurs, chaque contrôleur API a son `LOGIC_FLOW.md`.

| Domaine / Feature | Métier (Dans `domains/`) | API & Flow (Dans `api/`) |
|-------------------|--------------------------|--------------------------|
| **Transactions** | [`/transactions/README.md`](domains/transactions/README.md) | [`/transactions/LOGIC_FLOW.md`](api/transactions/LOGIC_FLOW.md) |
| **OCR** | [`/ocr/README.md`](domains/ocr/README.md) | [`/ocr/LOGIC_FLOW.md`](api/ocr/LOGIC_FLOW.md) |
| **Budgets** | [`/budgets/README.md`](domains/budgets/README.md) | [`/budgets/LOGIC_FLOW.md`](api/budgets/LOGIC_FLOW.md) |
| **Échéances** | [`/echeance/README.md`](domains/echeance/README.md) | [`/echeances/LOGIC_FLOW.md`](api/echeances/LOGIC_FLOW.md) |
| **Objectifs (Goals)** | [`/goals/README.md`](domains/goals/README.md) | [`/goals/LOGIC_FLOW.md`](api/goals/LOGIC_FLOW.md) |
| **Pièces Jointes** | [`/attachments/README.md`](domains/attachments/README.md) | [`/attachments/LOGIC_FLOW.md`](api/attachments/LOGIC_FLOW.md) |
| **Dashboard** | *N/A* | [`/dashboard/LOGIC_FLOW.md`](api/dashboard/LOGIC_FLOW.md) |

### Dictionnaire de Données

👉 Pour comprendre la terminologie et le cycle de vie d'une transaction, le lexique est disponible dans : [**`GLOSSARY.md`**](GLOSSARY.md).

### Base de données

- **Emplacement** : Déterminé dynamiquement via `backend/config/paths.py` (variable de configuration `DB_PATH`).
- **Moteur SQL** : SQLite (SQLCipher via extensions si actif).
- **Initialisation** : Automatique au démarrage de l'app en appelant les différents `schema.py`.

### Commandes Utiles (via le gestionnaire `uv`)

```bash
# Gérer les dépendances
uv sync

# Lancer le serveur (depuis la racine du projet, pas dans "backend/")
uv run uvicorn backend.main:app --reload --port 8002

# Lancer la batterie de tests globaux
uv run pytest tests/ -v
```