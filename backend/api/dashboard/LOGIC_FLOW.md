# Logic Flow — API /dashboard

## Fichiers concernés

```
backend/api/
└── dashboard.py                  # Endpoints REST

backend/domains/transactions/
├── database/
│   ├── model.py                 # Modèle Transaction
│   └── repository.py            # TransactionRepository
│
└── shared/
    └── utils/
        └── categories_loader.py  # Chargement catégories YAML

resources/
└── categories.yaml              # Configuration catégories
```

## Arbre des dépendances

```
dashboard.py (API)
├── fastapi (APIRouter, HTTPException)
├── backend.domains.transactions.database.repository
│   └── backend.shared.database (get_db_connection)
├── backend.shared.utils.categories_loader
│   └── yaml
└── datetime
```

## Data Flow

```mermaid
graph TD
    subgraph Client
        Front[Frontend<br/>api.getSummary()]
    end
    
    subgraph API
        GET_DASH["GET /api/dashboard/"]
    end
    
    subgraph Repository
        Repos[TransactionRepository]
    end
    
    subgraph Database
        DB[(SQLite<br/>base.db)]
    end
    
    subgraph Categories
        YAML[categories.yaml]
        Loader[categories_loader.py]
    end
    
    Front -->|HTTP| GET_DASH
    GET_DASH --> Repos
    Repos -->|SELECT| DB
    DB -->|rows| Repos
    Repos -->|transactions| GET_DASH
    
    GET_DASH --> Loader
    Loader -->|read| YAML
    YAML -->|config| Loader
    Loader -->|category config| GET_DASH
    
    GET_DASH -->|JSON summary| Front
```

## Endpoint

| Methode | Path | Entrée | Sortie |
|---------|------|--------|---------|
| `GET` | `/api/dashboard/` | - | `DashboardSummary` |

## Fonctionnalités spéciales

### Refresh des échéances

Au démarrage, le dashboard appelle `refresh_echeances()` qui :
1. `cleanup_past_echeances()` - Supprime les échéances passées
2. `sync_recurrences_to_echeances()` - Génère les occurrences futures depuis les recurrences

### Prochaines échéances

Le dashboard retourne maintenant `prochaines_echeances` - les 123 échéances actives triées par date.

## Scan OCR

Le dashboard intègre aussi l'endpoint `/api/ocr/scan` pour le scan de tickets.

## Sortie (DashboardSummary)

```python
{
    "total_revenus": float,
    "total_depenses": float,
    "solde": float,
    "repartition_categories": [
        {
            "nom": str,
            "valeur": float,
            "couleur": str,
            "icone": str,
            "pourcentage": int,
            "enfants": [
                {
                    "nom": str,
                    "valeur": float,
                    "couleur": str,
                    "pourcentage": int
                }
            ]
        }
    ],
    "historique": [
        {
            "date": str,
            "solde": float,
            "revenus": float,
            "depenses": float
        }
    ],
    "prochaines_echeances": [  # NOUVEAU
        {
            "id": int,
            "nom": str,
            "montant": float,
            "date_prevue": str,
            "categorie": str,
            "type": str,
            "statut": str
        }
    ]
}
```

## Effet papillon

**Si tu modifies...** → **Ça affecte...**

| Fichier modifié | Impact |
|-----------------|--------|
| `dashboard.py` | Frontend `api.getSummary()` |
| `repository.py` | Dashboard, Transactions, Recurrences |
| `categories.yaml` | Dashboard (couleurs, icônes) |
| `categories_loader.py` | Dashboard (catégories) |

## Frontend associé

- `frontend/src/api.ts` - `api.getSummary()`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/app/transactions/page.tsx`
- `frontend/src/hooks/useFinancialData.ts`
- `frontend/src/components/dashboard/sunburst-chart.tsx`
- `frontend/src/lib/categories.ts`