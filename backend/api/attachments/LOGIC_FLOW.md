# Logic Flow — API /attachments

## Fichiers concernés

```
backend/api/
└── attachments.py               # Endpoints REST

backend/domains/transactions/
├── database/
│   ├── model_attachment.py     # Modèle TransactionAttachment
│   └── repository_attachment.py # AttachmentRepository
└── services/
    └── attachment_service.py    # Logique métier fichiers
```

## Arbre des dépendances

```
attachments.py (API)
├── fastapi (APIRouter, HTTPException, UploadFile, File, Response)
├── typing (List)
├── backend.domains.transactions.database.repository (TransactionRepository)
├── backend.domains.transactions.services.attachment_service
│   └── pathlib (Path)
└── backend.domains.transactions.database.model_attachment
    └── pydantic (BaseModel)
```

## Data Flow

```mermaid
graph TD
    subgraph Client
        Front[Frontend<br/>api.uploadAttachment()]
    end
    
    subgraph API
        GET_ATT["GET /api/attachments/transaction/:id"]
        POST_ATT["POST /api/attachments/transaction/:id"]
        GET_FILE["GET /api/attachments/:id"]
        DEL_ATT["DELETE /api/attachments/:id"]
    end
    
    subgraph Services
        AttServ[attachment_service.py]
    end
    
    subgraph Repositories
        TxRepo[TransactionRepository]
        AttRepo[AttachmentRepository]
    end
    
    subgraph Storage
        Files[(Fichiers<br/>resources/attachments/)]
        DB[(SQLite<br/>base.db)]
    end
    
    Front -->|HTTP FormData| POST_ATT
    POST_ATT --> TxRepo
    TxRepo -->|SELECT| DB
    DB -->|transaction| TxRepo
    TxRepo -->|transaction| POST_ATT
    POST_ATT --> AttServ
    AttServ -->|save file| Files
    AttServ -->|INSERT| AttRepo
    AttRepo -->|INSERT| DB
    
    Front -->|HTTP| GET_ATT
    GET_ATT --> AttServ
    AttServ --> AttRepo
    AttRepo -->|SELECT| DB
    DB -->|attachments| AttRepo
    AttRepo -->|Attachment[]| AttServ
    AttServ -->|Attachment[]| GET_ATT
    GET_ATT -->|JSON| Front
    
    Front -->|HTTP| GET_FILE
    GET_FILE --> AttServ
    AttServ -->|read file| Files
    Files -->|content| AttServ
    AttServ -->|Response| GET_FILE
    GET_FILE -->|File| Front
    
    Front -->|HTTP| DEL_ATT
    DEL_ATT --> AttServ
    AttServ --> AttRepo
    AttRepo -->|DELETE| DB
    AttServ -->|delete file| Files
```

## Endpoints

| Methode | Path | Entrée | Sortie |
|---------|------|--------|---------|
| `GET` | `/api/attachments/transaction/{id}` | - | `Attachment[]` |
| `POST` | `/api/attachments/transaction/{id}` | `FormData` | `{ message }` |
| `GET` | `/api/attachments/{id}` | - | `File Response` |
| `DELETE` | `/api/attachments/{id}` | - | `{ message }` |

## Modèle Attachment

```python
class TransactionAttachment(BaseModel):
    id: Optional[int] = None
    transaction_id: int
    file_name: str
    file_path: str
    file_type: Optional[str] = None
    upload_date: str
```

## Stockage

Les fichiers sont stockés dans : `resources/attachments/{transaction_id}/{filename}`

## Effet papillon

**Si tu modifies...** → **Ça affecte...**

| Fichier modifié | Impact |
|-----------------|--------|
| `attachments.py` | Frontend `api.uploadAttachment()`, `api.getAttachments()` |
| `attachment_service.py` | API attachments (toutes les opérations) |
| `repository_attachment.py` | API attachments |
| `model_attachment.py` | API, Frontend (types) |

## Frontend associé

- `frontend/src/api.ts` - `api.getAttachments()`, `api.uploadAttachment()`, `api.deleteAttachment()`
- `frontend/src/components/AttachmentList.tsx`