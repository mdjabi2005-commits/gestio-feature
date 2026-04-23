# Logic Flow — API /transactions

## Fichiers concernés

```
backend/api/
└── transactions.py                # Endpoints REST

backend/domains/transactions/
├── database/
│   ├── model.py                 # Modèle Transaction (Pydantic)
│   ├── repository.py            # TransactionRepository
│   └── schema.py                # Schéma DB
└── services/
    └── transaction_service.py    # Logique métier (pas utilisé ici)
```

## Arbre des dépendances

```
transactions.py (API)
├── fastapi (APIRouter, HTTPException)
├── typing (List)
├── backend.domains.transactions.database.model
│   └── pydantic (BaseModel, Field, validator)
├── backend.domains.transactions.database.repository
│   └── backend.shared.database (get_db_connection)
```

## Data Flow

```mermaid
graph TD
    subgraph Client
        Front[Frontend<br/>api.getTransactions()]
    end
    
    subgraph API
        GET["GET /api/transactions/"]
        POST["POST /api/transactions/"]
        DEL["DELETE /api/transactions/:id"]
    end
    
    subgraph Repository
        Repos[TransactionRepository]
    end
    
    subgraph Database
        DB[(SQLite<br/>%USERPROFILE%\analyse\finances.db)]
    end
    
    Front -->|HTTP| GET
    Front -->|HTTP| POST
    Front -->|HTTP| DEL
    
    GET --> Repos
    POST --> Repos
    DEL --> Repos
    
    Repos -->|SELECT| DB
    Repos -->|INSERT| DB
    Repos -->|DELETE| DB
    
    DB -->|rows| Repos
    Repos -->|Transaction[]| GET
    Repos -->|id| POST
    Repos -->|status| DEL
    
    GET -->|JSON| Front
    POST -->|JSON| Front
    DEL -->|JSON| Front
```

## Endpoints

| Methode | Path | Entrée | Sortie |
|---------|------|--------|---------|
| `GET` | `/api/transactions/` | - | `Transaction[]` |
| `POST` | `/api/transactions/` | `Transaction` | `{ id: int }` |
| `PUT` | `/api/transactions/{id}` | `Transaction` | `Transaction` |
| `DELETE` | `/api/transactions/{id}` | - | `{ status: "success" }` |

## Modèle Transaction

```python
class Transaction(BaseModel):
    id: Optional[int] = None
    type: str  # "Dépense" ou "Revenu"
    categorie: str
    sous_categorie: Optional[str] = None
    montant: float
    date: str  # ISO format
    description: Optional[str] = None
    source: Optional[str] = "Manuel"
```

## Effet papillon

**Si tu modifies...** → **Ça affecte...**

| Fichier modifié | Impact |
|-----------------|--------|
| `transactions.py` | Frontend `api.getTransactions()`, `api.addTransaction()` |
| `repository.py` | API transactions, dashboard, recurrences |
| `model.py` | API, Frontend (types TypeScript dans `api.ts`) |
| `schema.py` | DB (migration) |

## Frontend associé

- `frontend/src/api.ts` - `api.getTransactions()`, `api.addTransaction()`
- `frontend/src/app/transactions/page.tsx`
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/hooks/useFinancialData.ts`