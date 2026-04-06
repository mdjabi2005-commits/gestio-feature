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

from backend.domains.transactions.database.model import Transaction
from backend.shared.utils.categories_loader import get_subcategories, get_categories

logger = logging.getLogger(__name__)

_PROJECT_ROOT = Path(__file__).parent.parent.parent.parent


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


def _create_subcategory_transactions(
    category: str,
    amount: float,
    date: str,
    sub_allocations: list,
    attachment: Optional[str],
    sub_distribution_mode: str,
) -> List[Transaction]:
    """Crée les transactions pour les sous-catégories."""
    transactions = []

    if sub_distribution_mode == "manual" and sub_allocations:
        total_pct = sum(s.get("value", 0) for s in sub_allocations)
        if total_pct > 100:
            logger.warning(f"Total sous-allocations ({total_pct}%) > 100%")

        for sub in sub_allocations:
            sub_name = sub.get("name")
            sub_val = sub.get("value", 0)
            sub_amt = round(amount * (sub_val / 100), 2) if total_pct > 0 else 0

            if sub_amt > 0:
                transactions.append(
                    Transaction(
                        type="depense",
                        categorie=category,
                        sous_categorie=sub_name,
                        montant=sub_amt,
                        date=date,
                        description=f"Salaire - {sub_name}",
                        source="salary_split",
                        attachment=attachment,
                        has_attachments=bool(attachment),
                    )
                )
    else:
        subcats = get_subcategories(category)
        if subcats:
            sub_amt = round(amount / len(subcats), 2)
            for subcat in subcats:
                transactions.append(
                    Transaction(
                        type="depense",
                        categorie=category,
                        sous_categorie=subcat,
                        montant=sub_amt,
                        date=date,
                        description=f"Salaire - {subcat}",
                        source="salary_split",
                        attachment=attachment,
                        has_attachments=bool(attachment),
                    )
                )
        else:
            transactions.append(
                Transaction(
                    type="depense",
                    categorie=category,
                    sous_categorie="Autre",
                    montant=amount,
                    date=date,
                    description="Salaire",
                    source="salary_split",
                    attachment=attachment,
                    has_attachments=bool(attachment),
                )
            )

    return transactions


def apply_salary_split(
    net_amount: float,
    payroll_date: str,
    plan: Optional[Dict[str, Any]] = None,
    attachment: Optional[str] = None,
) -> List[Transaction]:
    """Applique le plan de salaire pour générer une liste de transactions."""
    if plan is None:
        plan = load_salary_plan()

    validate_salary_plan(plan)

    transactions = []
    remaining = net_amount
    default_category = plan.get("default_remainder_category", "Épargne")

    for allocation in plan.get("allocations", []):
        category = allocation.get("category")
        amount = _calculate_allocation_amount(remaining, allocation)

        sub_transactions = _create_subcategory_transactions(
            category,
            amount,
            payroll_date,
            allocation.get("sub_allocations", []),
            attachment,
            allocation.get("sub_distribution_mode", "equal"),
        )
        transactions.extend(sub_transactions)
        remaining = round(remaining - amount, 2)

    if remaining > 0:
        transactions.append(
            Transaction(
                type="depense",
                categorie=default_category,
                sous_categorie="Divers",
                montant=round(remaining, 2),
                date=payroll_date,
                description="Salaire - Reliquat",
                source="salary_split",
                attachment=attachment,
                has_attachments=bool(attachment),
            )
        )

    logger.info(
        f"Salary split appliqué: {net_amount}€ → {len(transactions)} transactions"
    )
    return transactions


def get_available_plans() -> List[str]:
    """Retourne la liste des plans de salaire disponibles."""
    config_dir = _PROJECT_ROOT / "config"
    if not config_dir.exists():
        return []
    return [f.name for f in config_dir.glob("salary_plan*.yaml")]
