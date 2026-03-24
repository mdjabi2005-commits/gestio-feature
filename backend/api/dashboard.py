from fastapi import APIRouter, HTTPException
from backend.domains.transactions.database.repository import TransactionRepository
from backend.shared.utils.categories_loader import get_category_config, get_subcategories
from datetime import date
import traceback

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])
repo = TransactionRepository()


@router.get("/")
async def get_summary():
    try:
        transactions = repo.get_all()

        total_revenus = sum(t.montant for t in transactions if t.type == "Revenu")
        total_depenses = sum(t.montant for t in transactions if t.type == "Dépense")
        solde = total_revenus - total_depenses

        # Last 30 days history for BalanceChart
        today = date.today()
        from datetime import timedelta

        history = []

        # Ensure transactions are sorted by date
        sorted_trans = sorted(
            transactions, key=lambda x: x.date if hasattr(x, "date") else ""
        )

        category_data = {} # Renamed from 'categories'
        sub_category_data = {} # New structure for subcategories
        for t in transactions:
            if t.type == "Dépense":
                category_data[t.categorie] = category_data.get(t.categorie, 0) + t.montant
                if t.sous_categorie:
                    if t.categorie not in sub_category_data:
                        sub_category_data[t.categorie] = {}
                    sub_category_data[t.categorie][t.sous_categorie] = sub_category_data[t.categorie].get(t.sous_categorie, 0) + t.montant


        # Calculate daily totals
        for i in range(29, -1, -1):
            day = today - timedelta(days=i)
            day_str = day.isoformat()

            # Cumulative total up to this day
            revenus_up_to = sum(
                t.montant for t in transactions if t.type == "Revenu" and t.date <= day
            )
            depenses_up_to = sum(
                t.montant for t in transactions if t.type == "Dépense" and t.date <= day
            )

            # Day specific totals
            jour_revenus = sum(
                t.montant for t in transactions if t.type == "Revenu" and t.date == day
            )
            jour_depenses = sum(
                t.montant for t in transactions if t.type == "Dépense" and t.date == day
            )

            history.append(
                {
                    "date": day_str,
                    "solde": revenus_up_to - depenses_up_to,
                    "revenus": jour_revenus,
                    "depenses": jour_depenses,
                }
            )

        # Category breakdown with subcategories
        breakdown = []
        for k, v in category_data.items():
            # Get category config (color, icon, subcategories)
            config = get_category_config(k)
            main_color = config.get("color", "#6b7280")
            main_icon = config.get("icon", "help-circle")
            
            # Subcategories breakdown
            sub_breakdown = []
            if k in sub_category_data:
                # Get subcategories config from YAML
                subs_config = get_subcategories(k)
                yaml_subs = {}
                for s in subs_config:
                    if isinstance(s, dict):
                        yaml_subs[s.get("name", "")] = s.get("color")
                    elif isinstance(s, str):
                        yaml_subs[s] = None
                
                for sub_k, sub_v in sub_category_data[k].items():
                    sub_color = yaml_subs.get(sub_k) or main_color # Fallback to main color
                    sub_breakdown.append(
                        {"nom": sub_k, "valeur": sub_v, "montant": sub_v, "couleur": sub_color, "pourcentage": int((sub_v / v * 100)) if v > 0 else 0}
                    )

            breakdown.append(
                {
                    "nom": k,
                    "valeur": v,
                    "montant": v,
                    "couleur": main_color,
                    "icone": main_icon,
                    "pourcentage": int((v / total_depenses * 100))
                    if total_depenses > 0
                    else 0,
                    "enfants": sub_breakdown,
                }
            )

        return {
            "total_revenus": total_revenus,
            "total_depenses": total_depenses,
            "solde": solde,
            "repartition_categories": breakdown,
            "historique": history,
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
