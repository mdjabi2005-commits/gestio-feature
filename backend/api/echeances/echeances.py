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
        self.frequence = echeance.frequence
        self.date_debut = echeance.date_debut.isoformat() if echeance.date_debut else ""
        self.date_fin = echeance.date_fin.isoformat() if echeance.date_fin else None
        self.description = echeance.description or ""
        self.date_prevue = echeance.date_prevue.isoformat() if echeance.date_prevue else ""

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


@router.post("/", response_model=int)
async def add_echeance(echeance: Echeance):
    """Créer une nouvelle échéance (modèle)."""
    try:
        echeance_id = repo.add(echeance)
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
