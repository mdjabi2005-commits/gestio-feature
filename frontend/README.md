# Frontend — Gestio V4

Interface utilisateur React + TypeScript + Tailwind (Next.js).

## Structure

```
src/
├── app/                    # Pages (Next.js App Router)
│   ├── dashboard/          # Page dashboard
│   ├── transactions/       # Page transactions
│   │   └── excel/          # - Mode Haute Densité (Excel)
│   ├── recurrences/        # Page récurrences
│   ├── budgets/            # Page budgets
│   ├── objectifs/          # Page objectifs
│   └── settings/           # Page paramètres
│
├── components/             # Composants réutilisables
│   ├── dashboard/          # Composants spécifiques dashboard
│   └── objectifs/          # Composants spécifiques objectifs
│
├── api/                    # Client API modulaire (types + services)
├── api.ts                  # Agrégateur API (point d'entrée principal)
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
Il est structuré de manière modulaire dans `src/api/`.

```typescript
import { api } from '@/api';

const transactions = await api.getTransactions();
const objectifs = await api.getObjectifs(); // Nouveau
```

### Types TypeScript

Les types sont définis dans `src/api/types.ts` et doivent correspondre aux modèles Pydantic du backend.

**Important** : Si tu modifies un modèle Pydantic dans le backend, tu DOIS aussi modifier les types correspondants dans `src/api/types.ts`.

## Data Flow

L'application utilise une architecture centralisée où le **Header** (dans `AppShell`) fait office de centre de commande :

```
Header (Action) → AppShell (Context State) → Context → Unified Fetch (Hook) → API
```

### Architecture des Plans (Strategic-First)
Les ressources critiques sont gérées via des plans de répartition globaux :
- **Budgets** : La création passe par `SalaryPlanSetup` (Plan de Salaire).
- **Objectifs** : La configuration passe par `GoalSavingsConfig` (Plan d'Épargne).
- **Édition** : Les formulaires individuels (`BudgetForm`, `GoalForm`) sont réservés à l'édition de précision depuis les détails.

### Synchronisation des Données
Le `FinancialDataContext` orchestre les données via `useFinancialSync` qui regroupe la récupération atomique des entités et le calcul des métriques stratégiques (capacité d'épargne, répartition globale).

Voir les fichiers `LOGIC_FLOW.md` pour chaque page :

- `src/app/dashboard/LOGIC_FLOW.md`
- `src/app/transactions/LOGIC_FLOW.md`
- `src/app/budgets/LOGIC_FLOW.md`
- `src/app/objectifs/LOGIC_FLOW.md`
- `src/app/recurrences/LOGIC_FLOW.md`
- `src/app/settings/LOGIC_FLOW.md`

## Conventions

- **TypeScript strict** — pas de `any`
- **Styling** — Tailwind uniquement
- **Composants** — `PascalCase`
- **Hooks** — `useXxx.ts`

## Règle de taille des fichiers

**INTERDIT :** Tout fichier dépassant **200 lignes** doit être subdivisé en plusieurs fichiers plus petits (Single Responsibility Principle).