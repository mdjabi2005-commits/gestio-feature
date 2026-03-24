# Instructions GitHub Copilot — Gestio V4

## ⚡ Début de session obligatoire

Avant toute modification de code, effectuer **obligatoirement** dans cet ordre :

1. **Lire tous les fichiers du dossier `.agent/`** → contexte métier, décisions d'architecture, conventions en cours
2. **Sur quelle issue travaille-t-on ?** → ex: `#1`
3. **Sur quelle branche sommes-nous ?** → vérifier avec `git branch --show-current`

- Référencer `#{numéro}` dans **chaque commit** de la session
- Ne jamais commencer à modifier du code sans avoir lu `.agent/`, connu l'issue et la branche

---

## Contexte du projet

Application de **gestion financière personnelle** en Python avec FastAPI et React.
- **Stack** : Python 3.12, FastAPI, SQLite, React 19, TypeScript, Tailwind, Vite
- **Architecture** : Domain-Driven Design (DDD) — chaque domaine dans `backend/domains/`
- **API** : RESTful sur http://localhost:8001
- **Frontend** : http://localhost:5173

## Structure des domaines

```
backend/
  ├── main.py              # Point d'entrée FastAPI
  ├── api/                 # Endpoints REST
  ├── domains/
  │   home/                # Dashboard
  │   transactions/       # CRUD, récurrences, pièces jointes
  shared/                 # Utilitaires transversaux (DB, services)
  config/                 # Configuration globale
  resources/              # Assets statiques

frontend/
  ├── src/app/            # Pages (dashboard, transactions, etc.)
  ├── src/components/     # Composants React
  └── src/api.ts          # Client API
```

## Règles de développement

### Code Python
- **Python 3.12+** uniquement
- **Type hints** obligatoires sur toutes les fonctions publiques
- **Pydantic** pour la validation des modèles de données
- Jamais d'accès direct au repository depuis les endpoints API — passer par les services
- Toujours utiliser `pathlib.Path` au lieu de `os.path`
- Imports absolus uniquement (pas de `.` relatifs)

### Base de données
- SQLite via `backend/shared/database/connection.py`
- Toujours utiliser les repositories — jamais de SQL direct dans les endpoints
- Les migrations se font via `schema.py`

### Frontend (React)
- TypeScript strict — pas de `any`
- Styling : Tailwind CSS uniquement
- API calls via `src/api.ts` (client centralisé)

### Sécurité
- **Ne jamais** commiter de fichiers `.db`, `.sqlite`, `.env`, `.key`, `.pem`
- Les secrets Azure dans les variables d'environnement GitHub Secrets uniquement

### Gestion des dépendances
- Utiliser **uv** pour gérer les dépendances (pas pip directement)
- `uv add <package>` pour ajouter, `uv sync` pour installer

## Règles Clean Code

### Taille des fichiers (obligatoire)
- **Seuil d'alerte : 200 lignes** → se poser la question d'un découpage
- **Maximum absolu : 300 lignes** → tout fichier au-delà doit être découpé avant merge
- Extraire les responsabilités distinctes dans des fichiers dédiés (SRP)

### Tests obligatoires à la création
Tout nouveau fichier de logique métier **doit avoir un fichier de test associé** dans le même commit ou le suivant :

| Fichier créé | Test requis | Emplacement |
|---|---|---|
| `services/mon_service.py` | ✅ Oui | `tests/test_services/test_mon_service.py` |
| `shared/utils/mon_util.py` | ✅ Oui | `tests/test_shared/test_mon_util.py` |
| `database/repository_x.py` | ✅ Oui | `tests/test_transactions/test_repository_x.py` |
| `pages/fragment_x.py` (UI pure) | ❌ Non | — |

Si l'utilisateur refuse les tests → ajouter `# TODO: tests manquants` en haut du fichier.

### Notifications UI
- **Toujours** utiliser `toast_success`, `toast_error`, `toast_warning` de `shared/ui/toast_components.py`
- **Jamais** `st.success()`, `st.error()`, `st.warning()` directement

### Autres règles
- Pas de `print()` → utiliser `logger = logging.getLogger(__name__)`
- Pas de code mort commenté → supprimer (YAGNI)
- Pas de boucles `iterrows()` sur DataFrame → utiliser la vectorisation pandas
- `time.sleep()` avant `st.rerun()` doit correspondre à la durée du toast (1.5s par défaut)

---

## CI/CD

- `.github/workflows/build.yml` — Build Windows + signature Azure + Release GitHub
- `.github/workflows/deploy-site.yml` — Déploiement site de documentation sur GitHub Pages
- Les releases se déclenchent sur les tags `v*.*.*`
