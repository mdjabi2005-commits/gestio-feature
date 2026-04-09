"""
API des Échéances
Expose les échéances au frontend
"""

from fastapi import APIRouter, HTTPException
from typing import List
from datetime import date
from dateutil.relativedelta import relativedelta

from backend.domains.echeance.model import Echeance
from backend.domains.echeance.repository import EcheanceRepository
from backend.domains.echeance.service import (
    calculate_next_occurrence,
    backfill_echeances,
    get_paid_this_month,
    get_paid_dates_map,
    build_echeance_response,
    build_calendar_occurrence,
)

router = APIRouter(prefix="/api/echeances", tags=["echeances"])
repo = EcheanceRepository()


@router.get("/")
async def get_echeances():
    """Récupère toutes les échéances actives."""
    try:
        echeances = repo.get_all()
        paid_ids = get_paid_this_month()
        return [build_echeance_response(e, is_paid=e.id in paid_ids) for e in echeances]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calendar")
async def get_calendar_echeances():
    """Récupère les occurrences d'échéances sur plusieurs mois pour le calendrier."""
    try:
        today = date.today()
        start_month = today - relativedelta(months=6)
        end_month = today + relativedelta(months=24)
        paid_map = get_paid_dates_map()

        all_occurrences = []
        current = start_month.replace(day=1)

        while current <= end_month:
            occurrences = repo.get_occurrences_for_month(current.year, current.month)
            all_occurrences.extend(
                build_calendar_occurrence(o, today, paid_map) for o in occurrences
            )
            current += relativedelta(months=1)

        return all_occurrences
    except Exception as e:
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
