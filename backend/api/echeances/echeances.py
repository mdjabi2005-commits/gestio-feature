"""
API des Échéances
Expose les échéances au frontend
"""

from fastapi import APIRouter, HTTPException
from typing import List
from datetime import date, timedelta

from backend.domains.transactions.database.model_echeance import Echeance
from backend.domains.transactions.database.repository_echeance import EcheanceRepository

router = APIRouter(prefix="/api/echeances", tags=["echeances"])
repo = EcheanceRepository()


class EcheanceResponse:
    """Format de réponse attendu par le frontend."""

    def __init__(self, echeance: Echeance):
        self.id = str(echeance.id) if echeance.id else ""
        self.name = echeance.description or echeance.nom or ""
        self.category = echeance.categorie
        self.categoryType = echeance.sous_categorie or ""
        self.date = (
            echeance.date_prevue.strftime("%d %b.") if echeance.date_prevue else ""
        )

        # Calculate days remaining
        today = date.today()
        if echeance.date_prevue:
            delta = (echeance.date_prevue - today).days
            self.daysRemaining = delta
        else:
            self.daysRemaining = 0

        self.amount = echeance.montant
        self.type = "income" if echeance.type == "Revenu" else "expense"

        # Map status
        if echeance.statut == "active":
            if echeance.date_prevue and echeance.date_prevue < today:
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


@router.get("/")
async def get_echeances():
    """Récupère toutes les échéances actives."""
    try:
        echeances = repo.get_all()
        return [EcheanceResponse(e).__dict__ for e in echeances]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
