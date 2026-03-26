from fastapi import APIRouter, HTTPException
from typing import Optional, List
from backend.domains.transactions.database.repository import TransactionRepository
from backend.domains.transactions.database.repository_echeance import EcheanceRepository
from backend.domains.transactions.echeance.echeance_service import refresh_echeances
from backend.shared.utils.categories_loader import (
    get_category_config,
    get_subcategories,
)
from backend.shared.database.connection import get_db_connection, close_connection
from datetime import date
import traceback
import sqlite3

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])
repo = TransactionRepository()
echeance_repo = EcheanceRepository()


@router.get("/")
async def get_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
):
    try:
        refresh_echeances()

        transactions = repo.get_filtered(
            start_date=start_date, end_date=end_date, category=category
        )

        total_revenus = sum(t.montant for t in transactions if t.type == "Revenu")
        total_depenses = sum(t.montant for t in transactions if t.type == "Dépense")
        solde = total_revenus - total_depenses

        # Last 30 days history for BalanceChart
        today = date.today()
        from datetime import timedelta

        # Build daily historique for BalanceChart (last 90 days)
        daily: dict = {}
        for t in transactions:
            day = str(t.date)[:10]  # YYYY-MM-DD
            if day not in daily:
                daily[day] = {"revenus": 0.0, "depenses": 0.0}
            if t.type == "Revenu":
                daily[day]["revenus"] += t.montant
            else:
                daily[day]["depenses"] += t.montant

        history = []
        running_solde = 0.0
        for day in sorted(daily.keys()):
            running_solde += daily[day]["revenus"] - daily[day]["depenses"]
            history.append(
                {
                    "date": day,
                    "revenus": daily[day]["revenus"],
                    "depenses": daily[day]["depenses"],
                    "solde": round(running_solde, 2),
                }
            )

        # Aggregate data for both Revenu and Dépense
        data_by_type = {
            "Revenu": {"total": 0, "categories": {}, "subs": {}},
            "Dépense": {"total": 0, "categories": {}, "subs": {}},
        }

        for t in transactions:
            if t.type in data_by_type:
                data_by_type[t.type]["total"] += t.montant
                data_by_type[t.type]["categories"][t.categorie] = (
                    data_by_type[t.type]["categories"].get(t.categorie, 0) + t.montant
                )

                if t.sous_categorie:
                    if t.categorie not in data_by_type[t.type]["subs"]:
                        data_by_type[t.type]["subs"][t.categorie] = {}
                    data_by_type[t.type]["subs"][t.categorie][t.sous_categorie] = (
                        data_by_type[t.type]["subs"][t.categorie].get(
                            t.sous_categorie, 0
                        )
                        + t.montant
                    )

        # Helper to build breakdown for a type
        def build_type_breakdown(t_type, color):
            type_nodes = []
            type_total = data_by_type[t_type]["total"]

            for cat_name, cat_val in data_by_type[t_type]["categories"].items():
                config = get_category_config(cat_name)
                cat_color = config.get("color", "#6b7280")
                cat_icon = config.get("icon", "help-circle")

                sub_nodes = []
                if cat_name in data_by_type[t_type]["subs"]:
                    # Get subcategories config
                    subs_config = get_subcategories(cat_name)
                    yaml_subs = {
                        s.get("name", "") if isinstance(s, dict) else s: (
                            s.get("color") if isinstance(s, dict) else None
                        )
                        for s in subs_config
                    }

                    for sub_name, sub_val in data_by_type[t_type]["subs"][
                        cat_name
                    ].items():
                        sub_nodes.append(
                            {
                                "nom": sub_name,
                                "valeur": sub_val,
                                "montant": sub_val,
                                "couleur": yaml_subs.get(sub_name) or cat_color,
                                "pourcentage": int((sub_val / cat_val * 100))
                                if cat_val > 0
                                else 0,
                            }
                        )

                type_nodes.append(
                    {
                        "nom": cat_name,
                        "valeur": cat_val,
                        "montant": cat_val,
                        "couleur": cat_color,
                        "icone": cat_icon,
                        "enfants": sub_nodes,
                        "pourcentage": int((cat_val / type_total * 100))
                        if type_total > 0
                        else 0,
                    }
                )

            return {
                "nom": t_type,
                "valeur": type_total,
                "montant": type_total,
                "couleur": color,
                "icone": "plus-circle" if t_type == "Revenu" else "minus-circle",
                "enfants": type_nodes,
                "pourcentage": 50,  # Balanced view for the roots
            }

        # Build final 3-layer breakdown
        # The Sunburst top level will be Revenus and Dépenses
        breakdown = [
            build_type_breakdown("Revenu", "#10b981"),  # Green
            build_type_breakdown("Dépense", "#f43f5e"),  # Red
        ]

        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, nom, montant, date_prevue, categorie, type, statut 
            FROM echeances 
            WHERE statut = 'active' 
            ORDER BY date_prevue ASC
        """)
        prochaines = [dict(row) for row in cursor.fetchall()]
        close_connection(conn)

        return {
            "total_revenus": total_revenus,
            "total_depenses": total_depenses,
            "solde": solde,
            "repartition_categories": breakdown,
            "historique": history,
            "prochaines_echeances": prochaines,
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
