# Instructions GitHub Copilot — Gestio V4

## ⚡ Début de session obligatoire

Avant toute modification de code, demander **obligatoirement** :

1. **Sur quelle issue travaille-t-on ?** → ex: `#1`
2. **Sur quelle branche sommes-nous ?** → vérifier avec `git branch --show-current`

- Référencer `#{numéro}` dans **chaque commit** de la session
- Ne jamais commencer à modifier du code sans connaître l'issue et la branche

---

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
