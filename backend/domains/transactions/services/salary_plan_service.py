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
    """
    Charge un plan de salaire depuis un fichier YAML.

    Args:
        filename: Nom du fichier YAML dans config/

    Returns:
        Dictionnaire du plan de salaire

    Raises:
        FileNotFoundError: Si le fichier n'existe pas
        SalaryPlanError: Si le YAML est invalide
    """
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
    """
    Valide un plan de salaire.

    Args:
        plan: Dictionnaire du plan de salaire

    Returns:
        True si valide

    Raises:
        SalaryPlanError: Si le plan est invalide
    """
    # On ignore le nom et le salaire de référence lors de la validation des règles métier
    total_percent = 0
    allocations = plan.get("allocations", [])
    if not allocations:
        raise SalaryPlanError("Au moins une allocation est requise")

    total_percent = 0
    for alloc in allocations:
        if alloc.get("type") == "percent":
            total_percent += alloc.get("value", 0)

    if total_percent >= 100:
        raise SalaryPlanError(
            f"La somme des pourcentages ({total_percent}%) doit être inférieure à 100% "
            f"pour permettre le reliquat vers '{plan.get('default_remainder_category', 'Épargne')}'"
        )

    available_categories = get_categories()
    for alloc in allocations:
        category = alloc.get("category")
        if category not in available_categories:
            logger.warning(
                f"Catégorie '{category}' non trouvée dans categories.yaml, elle sera créée"
            )

    return True


def apply_salary_split(
    net_amount: float,
    payroll_date: str,
    plan: Optional[Dict[str, Any]] = None,
    attachment: Optional[str] = None,
) -> List[Transaction]:
    """
    Applique le plan de salaire pour générer une liste de transactions.

    Args:
        net_amount: Montant net du salaire
        payroll_date: Date de la fiche de paie (YYYY-MM-DD)
        plan: Plan de salaire optionnel (sinon utilise le default)

    Returns:
        Liste de transactions pré-splitées

    Raises:
        SalaryPlanError: Si le plan est invalide
    """
    if plan is None:
        plan = load_salary_plan()

    validate_salary_plan(plan)

    transactions = []
    remaining = net_amount
    default_category = plan.get("default_remainder_category", "Épargne")

    allocations = plan.get("allocations", [])

    for allocation in allocations:
        category = allocation.get("category")
        alloc_type = allocation.get("type", "percent")
        value = allocation.get("value", 0)

        if alloc_type == "percent":
            amount = remaining * (value / 100)
        elif alloc_type == "fixed":
            amount = min(value, remaining)
        else:
            logger.warning(f"Type d'allocation inconnu: {alloc_type}, ignoré")
            continue

        amount = round(amount, 2)

        sub_distribution_mode = allocation.get("sub_distribution_mode", "equal")
        sub_allocations = allocation.get("sub_allocations", [])

        if sub_distribution_mode == "manual" and sub_allocations:
            total_sub_percent = sum(sub.get("value", 0) for sub in sub_allocations)
            if total_sub_percent > 100:
                logger.warning(
                    f"Total des sous-allocations ({total_sub_percent}%) > 100%, ajustement appliqué"
                )

            for sub_alloc in sub_allocations:
                sub_name = sub_alloc.get("name")
                sub_value = sub_alloc.get("value", 0)
                sub_amount = (
                    round(amount * (sub_value / 100), 2) if total_sub_percent > 0 else 0
                )

                if sub_amount > 0:
                    transactions.append(
                        Transaction(
                            type="depense",
                            categorie=category,
                            sous_categorie=sub_name,
                            montant=sub_amount,
                            date=payroll_date,
                            description=f"Salaire - {sub_name}",
                            source="salary_split",
                            attachment=attachment,
                            has_attachments=bool(attachment),
                        )
                    )

            leftover = round(
                amount
                - sum(t.montant for t in transactions if t.categorie == category),
                2,
            )
            if leftover > 0:
                first_sub = sub_allocations[0].get("name") if sub_allocations else None
                if first_sub:
                    for t in transactions:
                        if t.categorie == category and t.sous_categorie == first_sub:
                            t.montant = round(t.montant + leftover, 2)
                            break

        else:
            subcats = get_subcategories(category)
            if subcats:
                sub_amount = round(amount / len(subcats), 2)
                for subcat in subcats:
                    if sub_amount > 0:
                        transactions.append(
                            Transaction(
                                type="depense",
                                categorie=category,
                                sous_categorie=subcat,
                                montant=sub_amount,
                                date=payroll_date,
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
                        date=payroll_date,
                        description="Salaire",
                        source="salary_split",
                        attachment=attachment,
                        has_attachments=bool(attachment),
                    )
                )

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
    """
    Retourne la liste des plans de salaire disponibles.

    Returns:
        Liste des noms de fichiers de plans
    """
    config_dir = _PROJECT_ROOT / "config"
    if not config_dir.exists():
        return []

    plans = []
    for f in config_dir.glob("salary_plan*.yaml"):
        plans.append(f.name)

    return plans
