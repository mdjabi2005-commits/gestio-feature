"""
Salary Plan Service - Gestion des plans de répartition de salaire

Ce service gère :
- Le chargement des plans de salaire depuis les fichiers YAML
- La validation des règles (somme < 100%)
- L'application du split sur un salaire net
"""

import logging
import os
from pathlib import Path
from typing import List, Optional, Dict, Any

import yaml

from backend.domains.transactions.model import Transaction
from backend.shared.utils.categories_loader import get_subcategories, get_categories

logger = logging.getLogger(__name__)

_PROJECT_ROOT = Path(__file__).parent.parent.parent


class SalaryPlanError(Exception):
    """Exception levée pour les erreurs de plan de salaire."""

    pass


def _get_config_path(filename: str = "salary_plan_default.yaml") -> Path:
    """Retourne le chemin du fichier de configuration."""
    return _PROJECT_ROOT / "config" / filename


def load_salary_plan(filename: str = "salary_plan_default.yaml") -> Dict[str, Any]:
    """Charge un plan de salaire depuis un fichier YAML."""
    config_path = _get_config_path(filename)
    if not config_path.exists():
        raise FileNotFoundError(f"Salary plan non trouvé : {config_path}")

    try:
        with open(config_path, encoding="utf-8") as f:
            data = yaml.safe_load(f)
        if not data or "salary_plan" not in data:
            raise SalaryPlanError("Format YAML invalide : clé 'salary_plan' manquante")
        return data["salary_plan"]
    except yaml.YAMLError as e:
        raise SalaryPlanError(f"Erreur parsing YAML : {e}")


def validate_salary_plan(plan: Dict[str, Any]) -> bool:
    """Valide un plan de salaire."""
    allocations = plan.get("allocations", [])
    if not allocations:
        raise SalaryPlanError("Au moins une allocation est requise")

    total_percent = sum(
        a.get("value", 0) for a in allocations if a.get("type") == "percent"
    )
    if total_percent >= 100:
        raise SalaryPlanError(
            f"La somme des pourcentages ({total_percent}%) doit être inférieure à 100% "
            f"pour permettre le reliquat vers '{plan.get('default_remainder_category', 'Épargne')}'"
        )

    available_categories = get_categories()
    for alloc in allocations:
        category = alloc.get("category")
        if category not in available_categories:
            logger.warning(f"Catégorie '{category}' non trouvée dans categories.yaml")

    return True


def _calculate_allocation_amount(remaining: float, allocation: dict) -> float:
    """Calcule le montant d'une allocation."""
    alloc_type = allocation.get("type", "percent")
    value = allocation.get("value", 0)

    if alloc_type == "percent":
        return round(remaining * (value / 100), 2)
    elif alloc_type == "fixed":
        return round(min(value, remaining), 2)
    else:
        logger.warning(f"Type d'allocation inconnu: {alloc_type}")
        return 0




def apply_salary_split(
    net_amount: float,
    plan: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """Applique le plan de salaire pour générer une répartition théorique (allocations)."""
    if plan is None:
        plan = load_salary_plan()

    validate_salary_plan(plan)

    allocations = []
    remaining = net_amount
    default_category = plan.get("default_remainder_category", "Épargne")

    for allocation in plan.get("allocations", []):
        category = allocation.get("category")
        amount = _calculate_allocation_amount(remaining, allocation)

        allocations.append({
            "categorie": category,
            "montant": amount,
        })
        remaining = round(remaining - amount, 2)

    if remaining > 0:
        allocations.append({
            "categorie": default_category,
            "montant": round(remaining, 2),
        })

    logger.info(
        f"Salary split calculé théoriquement: {net_amount}€ → {len(allocations)} allocations"
    )
    return allocations

def get_available_plans() -> List[str]:
    """Retourne la liste des plans de salaire disponibles."""
    config_dir = _PROJECT_ROOT / "config"
    if not config_dir.exists():
        return []
    return [f.name for f in config_dir.glob("salary_plan*.yaml")]


SALARY_PLAN_PATH = _get_config_path("salary_plan_default.yaml")


def generate_budgets_from_plan(plan_data: Dict[str, Any]) -> None:
    """Génère les budgets depuis le salary plan."""
    from backend.domains.budgets.model import Budget
    from backend.domains.budgets.repository import budget_repository
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


def save_plan_to_yaml(plan_data: Dict[str, Any]) -> None:
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
