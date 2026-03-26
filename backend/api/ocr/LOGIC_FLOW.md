# Logic Flow — API /ocr

## Fichiers concernés

```
backend/api/ocr/
└── ocr.py                    # Endpoint REST de scan OCR

backend/domains/transactions/ocr/
├── services/
│   └── ocr_service.py        # OCRService (RapidOCR + Groq)
├── core/
│   ├── rapidocr_engine.py    # Moteur OCR (RapidOCR)
│   ├── groq_parser.py        # Parser LLM (Groq/Llama-3)
│   ├── parser.py             # Parsers montant/date
│   └── hardware_utils.py     # Détection CPU optimal
└── database/
    └── model.py              # Modèle Transaction
```

## Arbre des dépendances

```
ocr.py (API)
├── fastapi (APIRouter, UploadFile, File, HTTPException)
├── pydantic (BaseModel)
├── backend.domains.transactions.ocr.services.ocr_service
│   ├── RapidOCREngine
│   ├── GroqParser
│   └── PatternManager
└── backend.domains.transactions.database.model (Transaction)
```

## Data Flow

```mermaid
graph TD
    subgraph Client
        Front[Frontend<br/>api.scanTicket()]
    end
    
    subgraph API
        POST_SCAN["POST /api/ocr/scan"]
    end
    
    subgraph OCR Service
        OCR[OCRService]
        Engine[RapidOCREngine]
        Parser[GroqParser]
        Patterns[PatternManager]
    end
    
    subgraph Repository
        TxRepo[TransactionRepository]
    end
    
    subgraph Database
        DB[(SQLite<br/>base.db)]
    end
    
    subgraph External
        Groq[Groq API<br/>(Llama-3)]
    end
    
    Front -->|HTTP FormData| POST_SCAN
    POST_SCAN --> OCR
    
    OCR --> Engine
    Engine -->|extract text| Image[(Image<br/>ticket)]
    Image -->|raw text| OCR
    
    OCR --> Patterns
    Patterns -->|amount/date patterns| OCR
    
    OCR --> Parser
    Parser -->|montant, date| OCR
    
    OCR --> Parser
    Parser --> Groq
    Groq -->|category, description| OCR
    
    OCR --> TxRepo
    TxRepo -->|INSERT| DB
    
    OCR -->|Transaction| POST_SCAN
    POST_SCAN -->|JSON| Front
```

## Endpoint

| Methode | Path | Entrée | Sortie |
|---------|------|--------|---------|
| `POST` | `/api/ocr/scan` | `UploadFile` (image) | `OCRScanResponse` |

## Sortie (OCRScanResponse)

```python
class OCRScanResponse(BaseModel):
    transaction: Transaction    # Transaction pré-remplie
    warnings: List[str]        # ex: ["montant non trouvé", "catégorie non identifiée"]
    raw_ocr_text: Optional[str]  # Texte brut OCR pour debug
```

## Modèle Transaction (sortie OCR)

```python
class Transaction(BaseModel):
    type: str           # "Dépense" (par défaut pour tickets)
    categorie: str      # Catégorie identifiée via Groq
    sous_categorie: Optional[str]
    montant: float      # Extrait via patterns
    date: date          # Extraite via patterns
    description: str    # Nom commerçant via Groq
    source: str         # "ocr"
```

## Errors et Warnings

| Scenario | Code HTTP | Message |
|----------|-----------|---------|
| Format non supporté | 400 | "Format non supporté. Formats acceptés: jpeg, png, bmp, tiff, webp" |
| OCR échoue | 500 | "Échec du scan: ..." |
| Données incomplètes | 200 | `warnings` contient ["montant non trouvé", ...] |

## Effet papillon

**Si tu modifies...** → **Ça affecte...**

| Fichier modifié | Impact |
|-----------------|--------|
| `ocr.py` | Frontend `api.scanTicket()` |
| `ocr_service.py` | API OCR, Batch processing |
| `rapidocr_engine.py` | Toutes les extractions OCR |
| `groq_parser.py` | Catégorisation automatique |
| `model.py` | API OCR, Frontend (types) |

## Frontend associé

- `frontend/src/api.ts` - `api.scanTicket(file)`
- `frontend/src/components/dashboard/ScannerModal.tsx`
- `frontend/src/components/transactions/TransactionFormFields.tsx`

## Worker Multi-processus

Le service utilise `ProcessPoolExecutor` pour le traitement par lot :

- Nombre de workers = `get_optimal_workers(len(tickets))`
- Chaque processus crée sa propre instance OCRService
- `multiprocessing.freeze_support()` activé pour Windows