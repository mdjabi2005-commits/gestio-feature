"""
API des Échéances
Expose les échéances au frontend
"""

from fastapi import APIRouter, HTTPException
from typing import List
from datetime import date, timedelta
import sqlite3

from backend.domains.transactions.database.model_echeance import Echeance
from backend.domains.transactions.database.repository_echeance import EcheanceRepository
from backend.domains.transactions.echeance.echeance_service import (
    calculate_next_occurrence,
    backfill_echeances,
)
from backend.shared.database.connection import get_db_connection, close_connection

router = APIRouter(prefix="/api/echeances", tags=["echeances"])
repo = EcheanceRepository()


class EcheanceResponse:
    """Format de réponse attendu par le frontend."""

    def __init__(self, echeance: Echeance, is_paid: bool = False):
        self.id = str(echeance.id) if echeance.id else ""
        self.name = echeance.description or echeance.nom or ""
        self.category = echeance.categorie
        self.sous_categorie = echeance.sous_categorie or ""
        self.categoryType = echeance.sous_categorie or ""

        # Calculate next occurrence dynamically
        next_date = calculate_next_occurrence(echeance)
        self.date = next_date.strftime("%d %b.") if next_date else ""

        # Calculate days remaining
        today = date.today()
        if next_date:
            delta = (next_date - today).days
            self.daysRemaining = delta
        else:
            self.daysRemaining = 0

        self.amount = echeance.montant
        self.type = "income" if echeance.type == "Revenu" else "expense"
        self.frequence = echeance.frequence
        self.date_debut = echeance.date_debut.isoformat() if echeance.date_debut else ""
        self.date_fin = echeance.date_fin.isoformat() if echeance.date_fin else None
        self.description = echeance.description or ""
        self.date_prevue = next_date.isoformat() if next_date else ""

        # Smart status: use is_paid flag from transaction check
        if is_paid:
            self.status = "paid"
        elif echeance.statut == "active":
            if next_date and next_date < today:
                self.status = "overdue"
            else:
                self.status = "pending"
        else:
            self.status = "paid"

        # Map payment method from frequence
        if echeance.frequence in [
            "mensuel",
            "mensuelle",
            "annuel",
            "annuelle",
            "trimestriel",
            "trimestrielle",
        ]:
            self.paymentMethod = "automatic"
        else:
            self.paymentMethod = "manual"


def _check_paid_this_month(echeances: list) -> dict:
    """Check which echeances have a matching transaction this month."""
    today = date.today()
    month_start = today.replace(day=1).isoformat()
    if today.month == 12:
        month_end = today.replace(year=today.year + 1, month=1, day=1).isoformat()
    else:
        month_end = today.replace(month=today.month + 1, day=1).isoformat()

    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT echeance_id FROM transactions
        WHERE date >= ? AND date < ? AND echeance_id IS NOT NULL
    """,
        (month_start, month_end),
    )
    paid_ids = {row["echeance_id"] for row in cursor.fetchall()}
    close_connection(conn)

    return {e.id: True for e in echeances if e.id in paid_ids}


@router.get("/")
async def get_echeances():
    """Récupère toutes les échéances actives."""
    try:
        echeances = repo.get_all()
        paid_map = _check_paid_this_month(echeances)
        return [
            EcheanceResponse(e, is_paid=paid_map.get(e.id, False)).__dict__
            for e in echeances
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=int)
async def add_echeance(echeance: Echeance):
    """Créer une nouvelle échéance (modèle)."""
    try:
        echeance_id = repo.add(echeance)
        backfill_echeances(months_back=1)
        return echeance_id
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{echeance_id}", response_model=Echeance)
async def update_echeance(echeance_id: int, echeance: Echeance):
    """Met à jour une échéance (modèle)."""
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
    """Supprime une échéance (modèle)."""
    try:
        success = repo.delete(echeance_id)
        if not success:
            raise HTTPException(status_code=404, detail="Échéance non trouvée")
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
