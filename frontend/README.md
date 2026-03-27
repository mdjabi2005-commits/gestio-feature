# Frontend — Gestio V4

Interface utilisateur React + TypeScript + Tailwind (Next.js).

## Structure

```
src/
├── app/                    # Pages (Next.js App Router)
│   ├── dashboard/          # Page dashboard
│   ├── transactions/       # Page transactions
│   ├── recurrences/        # Page récurrences
│   ├── budgets/            # Page budgets
│   └── settings/           # Page paramètres
│
├── components/             # Composants réutilisables
│   └── dashboard/          # Composants spécifiques dashboard
│
├── api.ts                  # Client API (types + appels HTTP)
├── context/                # React Context (FinancialDataContext)
├── hooks/                  # Custom hooks (useFinancialData)
└── lib/                    # Utilitaires (utils, categories)
```

## Commandes

```bash
npm install          # Installer les dépendances
npm run dev          # Lancer en dev (http://localhost:3000)
npm run build        # Build production
npm run lint         # Vérifier le code
```

## API

Le client API communique avec le backend FastAPI sur `http://localhost:8002`.

```typescript
import { api } from '@/api';

const transactions = await api.getTransactions();
await api.addTransaction(data);
```

### Types TypeScript

Les types sont définis dans `src/api.ts` et doivent correspondre aux modèles Pydantic du backend.

**Important** : Si tu modifies un modèle Pydantic dans le backend, tu DOIS aussi modifier les types correspondants dans `src/api.ts`.

## Data Flow

```
Page → Context → Hook → API → Backend → SQLite
                   ↓
              Composants
```

Voir les fichiers `LOGIC_FLOW.md` pour chaque page :

- `src/app/dashboard/LOGIC_FLOW.md`
- `src/app/transactions/LOGIC_FLOW.md`
- `src/app/recurrences/LOGIC_FLOW.md`
- `src/app/settings/LOGIC_FLOW.md`

## Conventions

- **TypeScript strict** — pas de `any`
- **Styling** — Tailwind uniquement
- **Composants** — `PascalCase`
- **Hooks** — `useXxx.ts`

## Règle de taille des fichiers

**INTERDIT :** Tout fichier dépassant **200 lignes** doit être subdivisé en plusieurs fichiers plus petits (Single Responsibility Principle).