from fastapi import APIRouter, HTTPException
from typing import List, Optional
import logging
import yaml
from pathlib import Path
from pydantic import BaseModel, Field

from backend.domains.budgets.model import Budget
from backend.domains.budgets.repository import budget_repository
from backend.domains.transactions.database.schema import init_budgets_table
from backend.domains.transactions.services.salary_plan_service import (
    SalaryPlanError,
    get_available_plans,
    load_salary_plan,
    validate_salary_plan,
)
from .models import SalaryPlanItem, SalaryPlanResponse

logger = logging.getLogger(__name__)

init_budgets_table()

router = APIRouter(prefix="/api/budgets", tags=["budgets"])

SALARY_PLAN_PATH = (
    Path(__file__).parent.parent.parent / "config" / "salary_plan_default.yaml"
)


class BudgetCreate(BaseModel):
    categorie: str = Field(..., description="Catégorie principale")
    montant_max: float = Field(..., description="Budget mensuel max", ge=0)


def _load_yaml_plan() -> dict:
    """Charge le salary plan depuis le fichier YAML."""
    try:
        return load_salary_plan()
    except FileNotFoundError:
        return {}


def _build_plan_response(plan: dict) -> SalaryPlanResponse:
    """Construit la réponse SalaryPlanResponse."""
    items = [
        SalaryPlanItem(
            categorie=a.get("category", ""),
            montant=a.get("value", 0),
            type=a.get("type", "percent"),
            sub_distribution_mode=a.get("sub_distribution_mode", "equal"),
            sub_allocations=a.get("sub_allocations"),
        )
        for a in plan.get("allocations", [])
    ]
    return SalaryPlanResponse(
        id=1,
        nom=plan.get("name", "Plan"),
        is_active=plan.get("is_active", True),
        reference_salary=plan.get("reference_salary", 0),
        default_remainder_category=plan.get("default_remainder_category", "Épargne"),
        items=items,
        available_plans=get_available_plans(),
    )


def _generate_budgets_from_plan(plan_data: dict) -> None:
    """Génère les budgets depuis le salary plan."""
    from backend.shared.utils.categories_loader import get_subcategories

    ref = plan_data.get("reference_salary", 0.0)
    if ref <= 0:
        return

    for item in plan_data.get("items", []):
        val = item.get("montant", 0)
        category = item.get("categorie")
        alloc_type = item.get("type")
        sub_allocations = item.get("sub_allocations", [])

        category_amount = val if alloc_type == "fixed" else (ref * (val / 100))
        if category_amount <= 0:
            continue

        if sub_allocations and len(sub_allocations) > 0:
            total_sub_pct = sum(s.get("value", 0) for s in sub_allocations)
            for sub in sub_allocations:
                sub_name = sub.get("name")
                sub_pct = sub.get("value", 0)
                sub_amount = (
                    round(category_amount * (sub_pct / total_sub_pct), 2)
                    if total_sub_pct > 0
                    else 0
                )
                if sub_amount > 0 and sub_name:
                    budget_repository.upsert(
                        Budget(
                            categorie=f"{category} > {sub_name}", montant_max=sub_amount
                        )
                    )
        else:
            budget_repository.upsert(
                Budget(categorie=category, montant_max=round(category_amount, 2))
            )


def _save_plan_to_yaml(plan_data: dict) -> None:
    """Sauvegarde le salary plan dans le fichier YAML."""
    ref = plan_data.get("reference_salary", 0.0)
    storage = {
        "name": plan_data.get("nom", "Plan"),
        "is_active": plan_data.get("is_active", True),
        "reference_salary": ref,
        "default_remainder_category": plan_data.get(
            "default_remainder_category", "Épargne"
        ),
        "allocations": [
            {
                "category": i.get("categorie"),
                "value": i.get("montant"),
                "type": i.get("type"),
                "sub_distribution_mode": i.get("sub_distribution_mode"),
                "sub_allocations": i.get("sub_allocations"),
            }
            for i in plan_data.get("items", [])
        ],
    }
    with open(SALARY_PLAN_PATH, "w", encoding="utf-8") as f:
        yaml.dump(
            {"salary_plan": storage}, f, allow_unicode=True, default_flow_style=False
        )


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


@router.get("/salary-plans", response_model=List[SalaryPlanResponse])
async def get_salary_plan():
    try:
        plan = _load_yaml_plan()
        return [_build_plan_response(plan)]
    except Exception as e:
        logger.error(f"Error loading salary plan: {e}")
        raise HTTPException(500, str(e))


@router.post("/salary-plans", response_model=SalaryPlanResponse)
async def save_salary_plan(plan_data: dict):
    try:
        # Convert items to allocations for validation (map 'montant' to 'value')
        plan_for_validation = {
            **plan_data,
            "allocations": [
                {
                    "category": i.get("categorie"),
                    "value": i.get("montant", 0),
                    "type": i.get("type", "percent"),
                    "sub_distribution_mode": i.get("sub_distribution_mode", "equal"),
                    "sub_allocations": i.get("sub_allocations"),
                }
                for i in plan_data.get("items", [])
            ],
        }
        validate_salary_plan(plan_for_validation)
        _generate_budgets_from_plan(plan_data)
        _save_plan_to_yaml(plan_data)

        ref = plan_data.get("reference_salary", 0.0)
        return SalaryPlanResponse(
            id=1,
            nom=plan_data.get("nom", "Plan"),
            is_active=plan_data.get("is_active", True),
            reference_salary=ref,
            default_remainder_category=plan_data.get(
                "default_remainder_category", "Épargne"
            ),
            items=[SalaryPlanItem(**i) for i in plan_data.get("items", [])],
            available_plans=get_available_plans(),
        )
    except SalaryPlanError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error(f"Error saving salary plan: {e}")
        raise HTTPException(500, str(e))


@router.put("/salary-plans/{plan_id}", response_model=SalaryPlanResponse)
async def update_salary_plan(plan_id: int, plan_data: dict):
    plan_data["id"] = plan_id
    return await save_salary_plan(plan_data)


@router.delete("/salary-plans/{plan_id}")
async def delete_salary_plan(plan_id: int):
    try:
        default_plan = {
            "salary_plan": {
                "name": "Plan par défaut",
                "is_active": False,
                "reference_salary": 0,
                "default_remainder_category": "Épargne",
                "allocations": [],
            }
        }
        with open(SALARY_PLAN_PATH, "w", encoding="utf-8") as f:
            yaml.dump(default_plan, f, allow_unicode=True, default_flow_style=False)
        return {"status": "success", "message": "Salary plan supprimé"}
    except Exception as e:
        logger.error(f"Error deleting salary plan: {e}")
        raise HTTPException(500, str(e))
