# Logic Flow — Settings

## Status

**Page non implémentée** — Placeholder avec message "disponible ultérieurement".

## Fichiers actuels

```
src/app/settings/
└── page.tsx                    # Page placeholder (vide, pas de logique)
```

## Configuration (lecture directe)

Cette page lira probablement les fichiers de configuration YAML :

| Fichier | Description |
|---------|-------------|
| `backend/shared/utils/categories_loader` | Chargement des catégories |
| `resources/categories.yaml` | Définition des catégories |

## API Future (à implémenter)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/settings/` | Paramètres utilisateur |
| `PUT` | `/api/settings/` | Mettre à jour les paramètres |

## Effet papillon (quand implémenté)

| Fichier modifié | Impact |
|-----------------|--------|
| `api.ts` (ajout endpoints settings) | Settings page |
| `backend/shared/utils/categories_loader` | Settings, Dashboard, Transactions |
| `resources/categories.yaml` | Settings, Dashboard, Transactions |