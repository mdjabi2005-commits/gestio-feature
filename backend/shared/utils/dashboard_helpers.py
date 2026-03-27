"""Dashboard helpers - Fonctions utilitaires pour le dashboard."""

from datetime import date
from typing import List, Dict, Any

from backend.shared.database import db_transaction
from backend.shared.utils.categories_loader import (
    get_category_config,
    get_subcategories,
)


def get_month_range() -> tuple[str, str]:
    """Retourne (début, fin) du mois courant."""
    today = date.today()
    start = today.replace(day=1).isoformat()
    end = (today.replace(day=28).month % 12 + 1, 1)
    if today.month == 12:
        end = (today.year + 1, 1, 1)
    else:
        end = (today.year, today.month + 1, 1)
    from datetime import datetime

    end = datetime(*end).isoformat()
    return start, end


def get_paid_echeance_ids() -> set:
    """IDs des échéances payées ce mois."""
    start, end = get_month_range()
    with db_transaction() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT echeance_id FROM transactions WHERE date >= ? AND date < ? AND echeance_id IS NOT NULL",
            (start, end),
        )
        return {r["echeance_id"] for r in cursor.fetchall()}


def get_active_echeances() -> List[dict]:
    """Échéances actives depuis la DB."""
    with db_transaction() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM echeances WHERE statut = 'active' ORDER BY date_debut ASC"
        )
        return [dict(r) for r in cursor.fetchall()]


def dict_to_echeance(data: dict) -> "Echeance":
    """Convertit dict vers Echeance."""
    from backend.domains.transactions.database.model_echeance import Echeance

    return Echeance(
        id=data.get("id"),
        nom=data.get("nom", ""),
        type=data.get("type", "Dépense"),
        categorie=data.get("categorie", ""),
        sous_categorie=data.get("sous_categorie"),
        montant=float(data.get("montant", 0)),
        frequence=data.get("frequence", "mensuel"),
        date_debut=date.fromisoformat(data["date_debut"])
        if data.get("date_debut")
        else date.today(),
        date_fin=date.fromisoformat(data["date_fin"]) if data.get("date_fin") else None,
        description=data.get("description"),
        statut=data.get("statut", "active"),
        type_echeance=data.get("type_echeance", "recurrente"),
    )


def build_type_breakdown(t_type: str, color: str, data_by_type: dict) -> dict:
    """Construit la breakdown pour un type (Revenu/Dépense)."""
    nodes = []
    total = data_by_type[t_type]["total"]

    for cat_name, cat_val in data_by_type[t_type]["categories"].items():
        cfg = get_category_config(cat_name)
        sub_nodes = []

        if cat_name in data_by_type[t_type]["subs"]:
            subs_cfg = get_subcategories(cat_name)
            yaml_subs = {
                s.get("name", "") if isinstance(s, dict) else s: (
                    s.get("color") if isinstance(s, dict) else None
                )
                for s in subs_cfg
            }
            for sub_name, sub_val in data_by_type[t_type]["subs"][cat_name].items():
                sub_nodes.append(
                    {
                        "nom": sub_name,
                        "valeur": sub_val,
                        "montant": sub_val,
                        "couleur": yaml_subs.get(sub_name)
                        or cfg.get("color", "#6b7280"),
                        "pourcentage": int((sub_val / cat_val * 100))
                        if cat_val > 0
                        else 0,
                    }
                )

        nodes.append(
            {
                "nom": cat_name,
                "valeur": cat_val,
                "montant": cat_val,
                "couleur": cfg.get("color", "#6b7280"),
                "icone": cfg.get("icon", "help-circle"),
                "enfants": sub_nodes,
                "pourcentage": int((cat_val / total * 100)) if total > 0 else 0,
            }
        )

    return {
        "nom": t_type,
        "valeur": total,
        "montant": total,
        "couleur": color,
        "icone": "plus-circle" if t_type == "Revenu" else "minus-circle",
        "enfants": nodes,
        "pourcentage": 50,
    }


def build_echeances_list(rows: List[dict], paid_ids: set) -> List[dict]:
    """Liste des prochaines échéances avec statut."""
    from backend.domains.transactions.echeance.echeance_service import (
        calculate_next_occurrence,
    )

    today = date.today()
    result = []

    for row in rows:
        echeance = dict_to_echeance(row)
        next_dt = calculate_next_occurrence(echeance)
        eid = row["id"]

        status = (
            "paid" if eid in paid_ids else ("overdue" if next_dt < today else "active")
        )
        result.append(
            {
                "id": eid,
                "nom": row.get("nom", ""),
                "montant": row["montant"],
                "date_prevue": next_dt.isoformat(),
                "categorie": row["categorie"],
                "sous_categorie": row.get("sous_categorie", ""),
                "type": row["type"],
                "statut": status,
                "frequence": row.get("frequence", "mensuel"),
                "date_debut": row.get("date_debut", ""),
                "date_fin": row.get("date_fin"),
                "description": row.get("description", ""),
            }
        )

    return sorted(result, key=lambda x: x["date_prevue"])[:10]


def build_budget_summary() -> dict:
    """Calcule le résumé des budgets."""
    from backend.domains.budgets.repository import budget_repository

    budgets = budget_repository.get_all()
    cats = {b.categorie: b.montant_max for b in budgets}

    if not cats:
        return {"total_budget_prevu": 0, "total_consomme": 0, "repartition_budget": []}

    start, end = get_month_range()
    with db_transaction() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT categorie, SUM(montant) as total FROM transactions WHERE type = 'Dépense' AND date >= ? AND date < ? GROUP BY categorie",
            (start, end),
        )
        expenses = {r[0]: r[1] for r in cursor.fetchall()}

    total_prev = sum(cats.values())
    total_cons = sum(expenses.get(c, 0) for c in cats)
    return {
        "total_budget_prevu": round(total_prev, 2),
        "total_consomme": round(total_cons, 2),
        "repartition_budget": [
            {"nom": c, "budget": b, "depense_reelle": expenses.get(c, 0)}
            for c, b in cats.items()
        ],
    }


def build_daily_history(transactions: List) -> List[dict]:
    """Construit l'historique quotidien pour le graphique de solde."""
    daily: Dict[str, Dict[str, float]] = {}
    for t in transactions:
        day = str(t.date)[:10]
        if day not in daily:
            daily[day] = {"revenus": 0.0, "depenses": 0.0}
        if t.type == "Revenu":
            daily[day]["revenus"] += t.montant
        else:
            daily[day]["depenses"] += t.montant

    history, running = [], 0.0
    for day in sorted(daily.keys()):
        running += daily[day]["revenus"] - daily[day]["depenses"]
        history.append(
            {
                "date": day,
                "revenus": daily[day]["revenus"],
                "depenses": daily[day]["depenses"],
                "solde": round(running, 2),
            }
        )
    return history


def aggregate_by_type(transactions: List) -> Dict:
    """Agrège les transactions par type (Revenu/Dépense)."""
    data = {
        "Revenu": {"total": 0, "categories": {}, "subs": {}},
        "Dépense": {"total": 0, "categories": {}, "subs": {}},
    }
    for t in transactions:
        if t.type not in data:
            continue
        data[t.type]["total"] += t.montant
        data[t.type]["categories"][t.categorie] = (
            data[t.type]["categories"].get(t.categorie, 0) + t.montant
        )
        if t.sous_categorie:
            if t.categorie not in data[t.type]["subs"]:
                data[t.type]["subs"][t.categorie] = {}
            data[t.type]["subs"][t.categorie][t.sous_categorie] = (
                data[t.type]["subs"][t.categorie].get(t.sous_categorie, 0) + t.montant
            )
    return data
