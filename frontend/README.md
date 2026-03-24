# Frontend — Gestio V4

Interface utilisateur React + TypeScript + Tailwind (Vite).

## Structure

```
src/
├── app/               # Pages (dashboard, transactions, settings, recurrences)
├── components/        # Composants réutilisables
├── api.ts             # Client API (appels vers backend FastAPI)
├── context/           # React Context (état global)
├── hooks/             # Custom hooks
└── lib/               # Utilitaires (utils, icons, categories)
```

## Commandes

```bash
npm install          # Installer les dépendances
npm run dev          # Lancer en dev (http://localhost:5173)
npm run build        # Build production
npm run lint         # Vérifier le code
```

## API

Le client API communique avec le backend FastAPI sur `http://localhost:8001`.

```typescript
import { api } from '@/api';

const transactions = await api.getTransactions();
await api.addTransaction(data);
```

## Conventions

- **TypeScript strict** — pas de `any`
- **Styling** — Tailwind uniquement
- **Composants** — `PascalCase`
- **Hooks** — `useXxx.ts`

## Règle de taille des fichiers

**INTERDIT :** Tout fichier dépassant **200 lignes** doit être subdivisé en plusieurs fichiers plus petits (Single Responsibility Principle).