"""OCR API Models - Pydantic models for OCR endpoints."""

from datetime import date as date_type
from typing import List, Optional

from pydantic import BaseModel

from backend.domains.transactions.database.model import Transaction


class OCRScanResponse(BaseModel):
    transaction: Transaction
    warnings: List[str] = []
    raw_ocr_text: Optional[str] = None


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


class SalaryPlanItem(BaseModel):
    categorie: str
    montant: float
    type: str
    sub_distribution_mode: str
    sub_allocations: Optional[List[dict]] = None


class SalaryPlanResponse(BaseModel):
    id: Optional[int] = None
    nom: str
    is_active: bool
    reference_salary: float = 0.0
    default_remainder_category: str
    items: List[SalaryPlanItem]
    available_plans: List[str] = []
