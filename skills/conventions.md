# Skill : Conventions du projet

Conventions générales pour le projet Gestio V4.

## Architecture

```
gestion-financiere/
├── backend/           # FastAPI + SQLite
├── frontend/          # React + TypeScript + Tailwind
├── tests/             # pytest
└── .github/           # CI/CD
```

## Convention Git

### Commits

```
feat: ajouter l'export CSV des transactions
fix: corriger le filtre par catégorie
refactor: extraire la logique de parsing
test: ajouter 5 tests pour le module recurrence
```

### Branches

| Préfixe | Usage |
|---------|-------|
| `main` | Production stable |
| `feat/` | Nouvelles fonctionnalités |
| `fix/` | Corrections de bugs |

## Règles importantes

1. **Pas de secrets hardcodés** — utiliser `.env` et `os.getenv()`
2. **Pas de code mort commenté** — supprimer (YAGNI)
3. **Pas de boucles `iterrows()`** — utiliser la vectorisation pandas

## Règle de taille des fichiers

**INTERDIT ABSOLUMENT :** Tout fichier dépassant **200 lignes** est INTERDIT.

Tout fichier doit être subdivisé en plusieurs fichiers plus petits (Single Responsibility Principle).

## CI/CD

- `.github/workflows/build.yml` — Build Windows
- Tests exécutés à chaque push
- Rapport de coverage généré