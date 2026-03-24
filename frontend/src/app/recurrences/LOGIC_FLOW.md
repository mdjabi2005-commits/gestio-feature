# Logic Flow — Recurrences

## Status

**Page non implémentée** — Placeholder avec message "disponible ultérieurement".

## Fichiers actuels

```
src/app/recurrences/
└── page.tsx                    # Page placeholder (vide, pas de logique)
```

## API Future (à implémenter)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/recurrences/` | Liste des récurrences |
| `POST` | `/api/recurrences/` | Créer une récurrence |
| `PUT` | `/api/recurrences/:id` | Modifier une récurrence |
| `DELETE` | `/api/recurrences/:id` | Supprimer une récurrence |

## Effet papillon (quand implémenté)

| Fichier modifié | Impact |
|-----------------|--------|
| `api.ts` (ajout endpoints recurrences) | Recurrences page |
| Nouveau hook `useRecurrences.ts` | Recurrences page |
| Nouveau context `RecurrenceContext.tsx` | Toutes les pages utilisant les récurrences |
| `backend/recurrence/` | API recurrences |