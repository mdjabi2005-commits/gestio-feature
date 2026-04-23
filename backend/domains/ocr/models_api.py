"""OCR API Models - Pydantic models for OCR endpoints."""

from datetime import date as date_type
from typing import List, Optional

from pydantic import BaseModel, field_validator, model_validator
from backend.domains.transactions.model import Transaction


class OCRScanResponse(BaseModel):
    transaction: Transaction
    warnings: List[str] = []
    raw_ocr_text: Optional[str] = None
    archived_path: Optional[str] = None

    @model_validator(mode="after")
    def compute_warnings(self) -> "OCRScanResponse":
        w = []
        t = self.transaction
        if t.montant == 0.0:
            w.append("montant non trouvé dans le ticket")
        if not t.date:
            w.append("date non trouvée dans le ticket")
        if not t.categorie or t.categorie == "Non catégorisé":
            w.append("catégorie non identifiée")
        if not t.sous_categorie:
            w.append("sous-catégorie non identifiée")
        
        # Merge with existing warnings if any
        if not self.warnings:
            self.warnings = w
        else:
            self.warnings.extend(w)
        return self

class OCRConfigResponse(BaseModel):
    api_key: str = ""

class OCRConfigUpdate(BaseModel):
    api_key: str

    @field_validator("api_key")
    @classmethod
    def validate_api_key(cls, v: str) -> str:
        if v and not v.startswith("gsk_"):
            raise ValueError("Clé API Groq invalide (doit commencer par 'gsk_')")
        return v


class BatchScanResponse(BaseModel):
    results: List[OCRScanResponse]



