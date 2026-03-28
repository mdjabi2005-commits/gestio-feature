# Logic Flow — Dashboard

## Fichiers concernés (imports directs)

```
src/app/dashboard/
└── page.tsx                    # Page principale

src/context/
└── FinancialDataContext.tsx    # Context provider (et useFinancial)

src/hooks/
└── useFinancialData.ts         # Hook de fetching des données

src/api/
├── types.ts                  # Définitions des types
└── (autres basés sur api.ts)

src/components/dashboard/
├── kpi-cards.tsx               # Cartes KPI
├── sunburst-chart.tsx          # Graphique sunburst
└── transaction-table.tsx        # Tableau transactions

src/lib/
├── utils.ts                    # Utilitaires (cn)
└── categories.ts               # Catégories (icons, colors)
```

## Arbre des dépendances complet

```
page.tsx
├── @/context/FinancialDataContext
│   └── useFinancialData.ts
│       └── @/api.ts (Agrégateur)
│           └── @/api/ (Services modulaires)
│
├── @/components/dashboard/kpi-cards.tsx
│   └── @/lib/utils.ts
│   └── lucide-react
│
├── @/components/dashboard/sunburst-chart.tsx
│   └── recharts
│   └── @/lib/categories.ts
│
└── @/components/dashboard/transaction-table.tsx
    └── @/lib/utils.ts
    └── @/lib/categories.ts
```

## Data Flow

```mermaid
graph TD
    subgraph Frontend
        Page[page.tsx]
        Context[FinancialDataContext]
        Hook[useFinancialData]
        API[api.ts]
        Components[KPI Cards<br/>Sunburst<br/>Table]
    end
    
    subgraph Backend
        GET_DASH["GET /api/dashboard/"]
        GET_TX["GET /api/transactions/"]
        Repos[TransactionRepository]
        DB[(SQLite)]
    end
    
    Page --> Context
    Context --> Hook
    Hook --> API
    API -->|GET| GET_DASH
    API -->|GET| GET_TX
    GET_DASH --> Repos
    GET_TX --> Repos
    Repos --> DB
    DB --> Repos
    Repos --> GET_DASH
    Repos --> GET_TX
    GET_DASH -->|JSON| API
    GET_TX -->|JSON| API
    API --> Hook
    Hook --> Context
    Context --> Components
```

## API Endpoints

| Methode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/dashboard/` | Résumé financier (totaux, catégories, historique) |
| `GET` | `/api/transactions/` | Liste des transactions |

## Entrées → Sorties

| Étape | Données reçues | Données envoyées |
|-------|---------------|-----------------|
| `useFinancialData` | - | `{ summary, transactions, loading, apiStatus }` |
| `FinancialDataContext` | `{ summary, transactions }` | `{ summary, transactions }` |
| `page.tsx` | `{ summary, transactions, loading }` | - |
| `KpiCards` | `{ summary.solde, summary.total_revenus, summary.total_depenses }` | Affichage KPI |
| `SunburstChart` | `{ summary.repartition_categories }` | Graphique sunburst |
| `TransactionTable` | `{ transactions.slice(0,10), summary.repartition_categories }` | Tableau |

## Effet papillon

**Si tu modifies...** → **Ça affecte...**

| Fichier modifié | Impact |
|-----------------|--------|
| `api.ts` | Toutes les pages utilisant l'API |
| `useFinancialData.ts` | Dashboard, Transactions (toutes les pages utilisant le context) |
| `FinancialDataContext.tsx` | Toutes les pages utilisant `useFinancial()` |
| `kpi-cards.tsx` | Dashboard uniquement |
| `sunburst-chart.tsx` | Dashboard, Transactions |
| `transaction-table.tsx` | Dashboard |
| `lib/utils.ts` | Tous les composants utilisant `cn()` |
| `lib/categories.ts` | Composants utilisant les catégories |