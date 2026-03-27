from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel, Field
from backend.domains.budgets.model import Budget
from backend.domains.budgets.repository import budget_repository
from backend.domains.transactions.database.schema import init_budgets_table

init_budgets_table()

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


class BudgetCreate(BaseModel):
    categorie: str = Field(..., description="Catégorie principale")
    montant_max: float = Field(..., description="Budget mensuel max", ge=0)


@router.get("/", response_model=List[Budget])
async def get_budgets():
    return budget_repository.get_all()


@router.post("/", response_model=Budget)
async def upsert_budget(data: BudgetCreate):
    budget = Budget(categorie=data.categorie, montant_max=data.montant_max)
    result = budget_repository.upsert(budget)
    if not result:
        raise HTTPException(status_code=400, detail="Échec upsert budget")
    return result


@router.delete("/{budget_id}")
async def delete_budget(budget_id: int):
    success = budget_repository.delete(budget_id)
    if not success:
        raise HTTPException(status_code=404, detail="Budget non trouvé")
    return {"message": "Budget supprimé"}
