"""
Dashboard API - Endpoint principal pour les statistiques et vues agrégées.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional

from backend.domains.transactions.repository import TransactionRepository
from backend.domains.echeance.service import refresh_echeances
from backend.shared.utils.dashboard_helpers import (
    build_daily_history,
    aggregate_by_type,
    build_type_breakdown,
    get_paid_echeance_ids,
    get_active_echeances,
    build_echeances_list,
    build_budget_summary,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])
repo = TransactionRepository()


@router.get("/categories")
async def get_all_categories():
    from backend.shared.utils.categories_loader import _load

    return _load().get("categories", [])


@router.get("/")
async def get_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
):
    try:
        refresh_echeances()

        from datetime import date

        sd = date.fromisoformat(start_date) if start_date else None
        ed = date.fromisoformat(end_date) if end_date else None

        txs = repo.get_filtered(start_date=sd, end_date=ed, category=category)

        revenus = sum(t.montant for t in txs if t.type == "revenu")
        depenses = sum(t.montant for t in txs if t.type == "depense")

        history = build_daily_history(txs)
        data_by_type = aggregate_by_type(txs)

        breakdown = [
            build_type_breakdown("revenu", "#10b981", data_by_type),
            build_type_breakdown("depense", "#f43f5e", data_by_type),
        ]

        paid_ids = get_paid_echeance_ids()
        echeance_rows = get_active_echeances()
        prochaines = build_echeances_list(echeance_rows, paid_ids)

        return {
            "total_revenus": revenus,
            "total_depenses": depenses,
            "solde": revenus - depenses,
            "repartition_categories": breakdown,
            "historique": history,
            "prochaines_echeances": prochaines,
            "budget_summary": build_budget_summary(),
        }
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(500, str(e))
