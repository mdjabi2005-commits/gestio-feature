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
│   ├── pdfplumber_engine.py # Moteur PDF (pdfplumber) - Fiches de paie
│   ├── groq_parser.py        # Parser LLM (Groq/Llama-3)
│   ├── parser.py             # Parsers montant/date
│   └── hardware_utils.py     # Détection CPU optimal
└── database/
    └── model.py              # Modèle Transaction

backend/domains/transactions/services/
└── salary_plan_service.py    # Service de split des revenus

config/
└── salary_plan_default.yaml   # Plan de salaire par défaut
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
        FrontIncome[Frontend<br/>api.scanIncome()]
    end
    
    subgraph API
        POST_SCAN["POST /api/ocr/scan"]
        POST_INCOME["POST /api/ocr/scan-income"]
        GET_PLANS["GET /api/ocr/salary-plans"]
    end
    
    subgraph OCR Service
        OCR[OCRService]
        Engine[RapidOCREngine]
    end
    
    subgraph PDF Engine
        PDFEngine[PDFPlumberEngine]
    end
    
    subgraph Salary Plan Service
        SalaryPlan[salary_plan_service]
    end
    
    subgraph Config
        SalaryPlanYAML[salary_plan_default.yaml]
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
    
    OCR --> TxRepo
    TxRepo -->|INSERT| DB
    
    OCR -->|Transaction| POST_SCAN
    POST_SCAN -->|JSON| Front
    
    FrontIncome -->|HTTP FormData PDF| POST_INCOME
    POST_INCOME --> PDFEngine
    PDFEngine -->|extract| PDF[(PDF<br/>fiche de paie)]
    PDFEngine -->|net, date| SalaryPlan
    
    SalaryPlan --> SalaryPlanYAML
    SalaryPlanYAML -->|plan| SalaryPlan
    
    SalaryPlan -->|splits| POST_INCOME
    POST_INCOME -->|IncomeScanResponse| FrontIncome
```

## Endpoints

| Methode | Path | Entrée | Sortie |
|---------|------|--------|---------|
| `POST` | `/api/ocr/scan` | `UploadFile` (image) | `OCRScanResponse` |
| `POST` | `/api/ocr/scan-income` | `UploadFile` (PDF) | `IncomeScanResponse` |
| `GET` | `/api/budgets/salary-plans` | - | `SalaryPlanResponse[]` |
| `POST` | `/api/budgets/salary-plans` | `dict` (plan) | `SalaryPlanResponse` |

## Sortie (OCRScanResponse)

```python
class OCRScanResponse(BaseModel):
    transaction: Transaction    # Transaction pré-remplie
    warnings: List[str]        # ex: ["montant non trouvé", "catégorie non identifiée"]
    raw_ocr_text: Optional[str]  # Texte brut OCR pour debug
```

## Sortie (IncomeScanResponse)

```python
class IncomeSplitDTO(BaseModel):
    categorie: str
    sous_categorie: Optional[str] = None
    montant: float
    description: str


class IncomeScanResponse(BaseModel):
    total_net: float              # Montant net extrait du PDF
    date: date                    # Date de la fiche de paie
    suggested_splits: List[IncomeSplitDTO]  # Splits pré-splités
    raw_text: Optional[str]      # Texte brut pour debug
```

## Sortie (SalaryPlanResponse)

```python
class SalaryPlanResponse(BaseModel):
    name: str                     # Nom du plan
    is_active: bool               # Plan actif
    default_remainder_category: str  # Catégorie pour le reliquat (Épargne)
    allocations: List[dict]       # Liste des allocations
    available_plans: List[str]   # Plans disponibles
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
| Format PDF non supporté | 400 | "Format non supporté. Formats acceptés: pdf" |
| PDF non installlé | 500 | "pdfplumber n'est pas installé..." |
| Montant net non trouvé | 400 | "Montant net non trouvé dans la fiche de paie" |
| Somme allocations >= 100% | 400 | "La somme des pourcentages...doit être inférieure à 100%" |
| OCR échoue | 500 | "Échec du scan: ..." |
| Données incomplètes | 200 | `warnings` contient ["montant non trouvé", ...] |

## Effet papillon

**Si tu modifies...** → **Ça affecte...**

| Fichier modifié | Impact |
|-----------------|--------|
| `ocr.py` | Frontend `api.scanTicket()`, `api.scanIncome()` |
| `ocr_service.py` | API OCR, Batch processing |
| `rapidocr_engine.py` | Toutes les extractions OCR images |
| `pdfplumber_engine.py` | Extraction PDF fiches de paie |
| `salary_plan_service.py` | Split des revenus |
| `salary_plan_default.yaml` | Plan de répartition par défaut |
| `groq_parser.py` | Catégorisation automatique |
| `model.py` | API OCR, Frontend (types) |

## Frontend associé

- `frontend/src/api.ts` - `api.scanTicket(file)`, `api.scanIncome(file)`, `api.getSalaryPlans()`
- `frontend/src/components/dashboard/ScannerModal.tsx`
- `frontend/src/components/transactions/TransactionFormFields.tsx`

## Worker Multi-processus

Le service utilise `ProcessPoolExecutor` pour le traitement par lot :

- Nombre de workers = `get_optimal_workers(len(tickets))`
- Chaque processus crée sa propre instance OCRService
- `multiprocessing.freeze_support()` activé pour Windows