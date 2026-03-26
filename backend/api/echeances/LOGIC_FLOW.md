# Logic Flow — API /echeances

## Fichiers concernés

```
backend/api/echeances/
└── echeances.py               # Endpoints REST

backend/domains/transactions/
├── database/
│   ├── model_echeance.py     # Modèle Echeance (Pydantic)
│   ├── repository_echeance.py # EcheanceRepository
│   └── schema_table_echeance.py # Création table
├── recurrence/
│   └── recurrence_service.py  # refresh_echeances(), sync/cleanup
└── shared/
    └── database/
        └── connection.py     # get_db_connection()
```

## Arbre des dépendances

```
echeances.py (API)
├── fastapi (APIRouter, HTTPException)
├── typing (List)
├── backend.domains.transactions.database.model_echeance
│   └── pydantic (BaseModel, Field)
├── backend.domains.transactions.database.repository_echeance
│   └── backend.shared.database (get_db_connection)
└── datetime (date, timedelta)
```

## Data Flow

```mermaid
graph TD
    subgraph Client
        Front[Frontend<br/>api.getEcheances()]
    end
    
    subgraph API
        GET_ECH["GET /api/echeances/"]
    end
    
    subgraph Repository
        Repo[EcheanceRepository]
    end
    
    subgraph Services
        Refresh[refresh_echeances]
        Sync[sync_recurrences_to_echeances]
        Cleanup[cleanup_past_echeances]
    end
    
    subgraph Database
        ECHE[(SQLite<br/>echeances table)]
    end
    
    subgraph Recurrences
        REC[(recurrences)]
    end
    
    Front -->|HTTP| GET_ECH
    GET_ECH --> Refresh
    
    Refresh --> Cleanup
    Cleanup -->|DELETE old| ECHE
    
    Refresh --> Sync
    Sync -->|SELECT| REC
    REC -->|active recurrences| Sync
    Sync -->|generate occurrences| ECHE
    
    GET_ECH --> Repo
    Repo -->|SELECT active| ECHE
    ECHE -->|echeances| Repo
    Repo -->|EcheanceResponse[]| GET_ECH
    GET_ECH -->|JSON| Front
```

## Endpoint

| Methode | Path | Entrée | Sortie |
|---------|------|--------|---------|
| `GET` | `/api/echeances/` | - | `EcheanceResponse[]` |

## Format de réponse (EcheanceResponse)

```typescript
interface EcheanceResponse {
  id: string                    // ID de l'échéance
  name: string                  // description ou nom
  category: string              // categorie
  categoryType: string          // sous_categorie (optionnel)
  date: string                  // date_prevue formatée "DD Mmm."
  daysRemaining: number         // jours jusqu'à l'échéance
  amount: number               // montant
  type: "expense" | "income"    // "Dépense" → expense, "Revenu" → income
  status: "paid" | "pending" | "overdue"  // basé sur date_prevue et statut
  paymentMethod: "automatic" | "manual"  // basé sur frequence
}
```

## Logique de projection

La méthode `get_occurrences_for_month(year, month)` calcule les occurrences :

- Si `date_fin` est NULL → projette jusqu'à fin année+1
- Si `date_fin` est présent → ne pas dépasser cette date

## Effet papillon

**Si tu modifies...** → **Ça affecte...**

| Fichier modifié | Impact |
|-----------------|--------|
| `echeances.py` | Frontend `api.getEcheances()`, page `/echeances` |
| `repository_echeance.py` | API echeances, dashboard |
| `model_echeance.py` | API echeances, Frontend (types) |
| `recurrence_service.py` | Generation automatique des échéances |

## Frontend associé

- `frontend/src/api.ts` - `api.getEcheances()`
- `frontend/src/app/echeances/page.tsx`
- `frontend/src/components/dashboard/echeance-table.tsx`

## Relations

- **Dashboard** appelle `refresh_echeances()` et retourne `prochaines_echeances`
- Les échéances sont générées depuis les recurrences actives
- Chaque recurrence génère des occurrences futures dans `echeances`