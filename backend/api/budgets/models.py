"""Budget API Models - Pydantic models for budget endpoints."""

from typing import List, Optional
from pydantic import BaseModel


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
