"""
API des Échéances
Expose les échéances au frontend
"""

from fastapi import APIRouter, HTTPException
from typing import List
from datetime import date
from dateutil.relativedelta import relativedelta

from backend.domains.transactions.database.model_echeance import Echeance
from backend.domains.transactions.database.repository_echeance import EcheanceRepository
from backend.domains.transactions.echeance.echeance_service import (
    calculate_next_occurrence,
    backfill_echeances,
)
from backend.shared.database import db_transaction

router = APIRouter(prefix="/api/echeances", tags=["echeances"])
repo = EcheanceRepository()


def _get_paid_this_month() -> set:
    """Récupère les IDs des échéances payées ce mois."""
    today = date.today()
    month_start = today.replace(day=1).isoformat()
    month_end = (
        (today.replace(day=28) + relativedelta(months=1)).replace(day=1).isoformat()
    )

    with db_transaction() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT echeance_id FROM transactions WHERE date >= ? AND date < ? AND echeance_id IS NOT NULL",
            (month_start, month_end),
        )
        return {row["echeance_id"] for row in cursor.fetchall()}


def _get_paid_dates_map() -> dict:
    """Récupère un dictionnaire {echeance_id: [dates_payées]}."""
    with db_transaction() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT echeance_id, date FROM transactions WHERE echeance_id IS NOT NULL"
        )
        res = {}
        for row in cursor.fetchall():
            eid = row["echeance_id"]
            d = row["date"][:10]
            if eid not in res:
                res[eid] = []
            res[eid].append(d)
        return res


class EcheanceResponse:
    """Format de réponse attendu par le frontend."""

    def __init__(self, echeance: Echeance, is_paid: bool = False):
        next_date = calculate_next_occurrence(echeance)
        today = date.today()

        self.id = str(echeance.id) if echeance.id else ""
        self.name = echeance.description or echeance.nom or ""
        self.category = echeance.categorie
        self.sous_categorie = echeance.sous_categorie or ""
        self.categoryType = echeance.sous_categorie or ""
        self.date = next_date.strftime("%d %b.") if next_date else ""
        self.daysRemaining = (next_date - today).days if next_date else 0
        self.amount = echeance.montant
        self.type = "income" if echeance.type == "Revenu" else "expense"
        self.frequence = echeance.frequence
        self.date_debut = echeance.date_debut.isoformat() if echeance.date_debut else ""
        self.date_fin = echeance.date_fin.isoformat() if echeance.date_fin else None
        self.description = echeance.description or ""
        self.date_prevue = next_date.isoformat() if next_date else ""

        if is_paid:
            self.status = "paid"
        elif echeance.statut == "active":
            self.status = "overdue" if (next_date and next_date < today) else "pending"
        else:
            self.status = "paid"

        self.paymentMethod = (
            "automatic"
            if echeance.frequence
            in [
                "mensuel",
                "mensuelle",
                "annuel",
                "annuelle",
                "trimestriel",
                "trimestrielle",
            ]
            else "manual"
        )


@router.get("/")
async def get_echeances():
    """Récupère toutes les échéances actives."""
    try:
        echeances = repo.get_all()
        paid_ids = _get_paid_this_month()
        return [
            EcheanceResponse(e, is_paid=e.id in paid_ids).__dict__ for e in echeances
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calendar")
async def get_calendar_echeances():
    """Récupère les occurrences d'échéances sur plusieurs mois pour le calendrier."""
    try:
        today = date.today()
        start_month = today - relativedelta(months=6)
        end_month = today + relativedelta(months=24)

        paid_map = _get_paid_dates_map()
        all_occurrences = []

        current = start_month.replace(day=1)
        while current <= end_month:
            occ = repo.get_occurrences_for_month(current.year, current.month)
            for o in occ:
                iso_date = o["date"][:10]
                echeance_id = o["id"]
                is_paid = echeance_id in paid_map and iso_date in paid_map[echeance_id]

                status = (
                    "paid"
                    if is_paid
                    else ("overdue" if iso_date < today.isoformat() else "pending")
                )

                all_occurrences.append(
                    {
                        "id": f"{echeance_id}-{iso_date}",
                        "echeance_base_id": echeance_id,
                        "name": o["nom"],
                        "category": o["categorie"],
                        "sous_categorie": o.get("sous_categorie", ""),
                        "categoryType": o.get("sous_categorie", ""),
                        "date": date.fromisoformat(iso_date).strftime("%d %b."),
                        "date_prevue": iso_date,
                        "date_debut": o.get("date_debut", iso_date),
                        "date_fin": o.get("date_fin"),
                        "amount": o["montant"],
                        "type": "income" if o["type"] == "Revenu" else "expense",
                        "status": status,
                        "frequence": o["frequence"],
                        "paymentMethod": "automatic"
                        if o["frequence"]
                        in ["mensuel", "mensuelle", "annuel", "annuelle"]
                        else "manual",
                    }
                )

            current += relativedelta(months=1)

        return all_occurrences
    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=int)
async def add_echeance(echeance: Echeance):
    """Créer une nouvelle échéance."""
    try:
        echeance_id = repo.add(echeance)
        if echeance_id == 0:
            raise HTTPException(
                status_code=400, detail="Échec de l'ajout de l'échéance"
            )
        backfill_echeances(months_back=1)
        return echeance_id
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{echeance_id}", response_model=Echeance)
async def update_echeance(echeance_id: int, echeance: Echeance):
    """Met à jour une échéance."""
    try:
        echeance.id = echeance_id
        success = repo.update(echeance)
        if not success:
            raise HTTPException(status_code=404, detail="Échéance non trouvée")
        return echeance
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{echeance_id}")
async def delete_echeance(echeance_id: int):
    """Supprime une échéance."""
    try:
        success = repo.delete(echeance_id)
        if not success:
            raise HTTPException(status_code=404, detail="Échéance non trouvée")
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
