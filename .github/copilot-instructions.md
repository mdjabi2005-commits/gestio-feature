# Instructions GitHub Copilot — Gestio V4

## Contexte du projet

Application de **gestion financière personnelle** en Python avec Streamlit.
- **Stack** : Python 3.12, Streamlit, Pandas, Plotly, SQLite, uv, PyInstaller
- **Architecture** : Domain-Driven Design (DDD) — chaque domaine dans `domains/`
- **OS cible** : Windows (build via PyInstaller + Inno Setup), multi-plateforme à l'exécution

## Structure des domaines

```
domains/
  home/          ← Page d'accueil / tableau de bord
  transactions/  ← CRUD transactions, récurrences, OCR, pièces jointes
shared/          ← Utilitaires transversaux (DB, UI, services)
config/          ← Configuration globale (chemins, logging)
resources/       ← Assets statiques (icônes, CSS)
```

## Règles de développement

### Code Python
- **Python 3.12+** uniquement
- **Type hints** obligatoires sur toutes les fonctions publiques
- **Pydantic** pour la validation des modèles de données
- Pas de logique métier dans les pages Streamlit — déléguer aux services
- Toujours utiliser `pathlib.Path` au lieu de `os.path`
- Imports absolus uniquement (pas de `.` relatifs)

### Base de données
- SQLite via `shared/database/connection.py`
- Toujours utiliser les repositories (`repository.py`) — jamais de SQL direct dans les pages
- Les migrations se font via `schema.py`

### UI Streamlit
- Utiliser les helpers de `shared/ui/helpers.py` et `shared/ui/styles.py`
- Les toasts/notifications via `shared/ui/toast_components.py`
- Les erreurs user-friendly via `shared/ui/friendly_error.py`

### Sécurité
- **Ne jamais** commiter de fichiers `.db`, `.sqlite`, `.env`, `.key`, `.pem`
- Les secrets Azure dans les variables d'environnement GitHub Secrets uniquement

### Gestion des dépendances
- Utiliser **uv** pour gérer les dépendances (pas pip directement)
- `uv add <package>` pour ajouter, `uv sync` pour installer

## Conventions de nommage Git

### Branches
- `main` — branche principale stable
- `feat/description` — nouvelles fonctionnalités
- `fix/description` — corrections de bugs
- `chore/description` — maintenance, refactoring

### Commits (Conventional Commits)
```
feat: ajouter export PDF des transactions
fix: corriger le calcul des récurrences mensuelles
chore: mettre à jour les dépendances
docs: documenter le module OCR
refactor: extraire la logique de filtrage dans un service
test: ajouter tests unitaires pour transaction_service
```

## CI/CD

- `.github/workflows/build.yml` — Build Windows + signature Azure + Release GitHub
- `.github/workflows/deploy-site.yml` — Déploiement site de documentation sur GitHub Pages
- Les releases se déclenchent sur les tags `v*.*.*`

