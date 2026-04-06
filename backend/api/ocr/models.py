"""OCR API Models - Pydantic models for OCR endpoints."""

from datetime import date as date_type
from typing import List, Optional

from pydantic import BaseModel

from backend.domains.transactions.model import Transaction


class OCRScanResponse(BaseModel):
    transaction: Transaction
    warnings: List[str] = []
    raw_ocr_text: Optional[str] = None
    archived_path: Optional[str] = None


class BatchScanResponse(BaseModel):
    results: List[OCRScanResponse]


class IncomeSplitDTO(BaseModel):
    categorie: str
    sous_categorie: str
    montant: float
    description: str


class IncomeScanResponse(BaseModel):
    total_net: float
    date: date_type
    suggested_splits: List[IncomeSplitDTO]
    archived_path: Optional[str] = None
    raw_text: Optional[str] = None
