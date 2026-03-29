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

AUTOMATIC_FREQUENCIES = {
    "mensuel",
    "mensuelle",
    "annuel",
    "annuelle",
    "trimestriel",
    "trimestrielle",
}


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
            res.setdefault(eid, []).append(d)
        return res


def _get_payment_method(frequence: str) -> str:
    """Détermine si le paiement est automatique selon la fréquence."""
    return "automatic" if frequence.lower() in AUTOMATIC_FREQUENCIES else "manual"


def _build_echeance_response(echeance: Echeance, is_paid: bool = False) -> dict:
    """Construit la réponse JSON pour une échéance."""
    next_date = calculate_next_occurrence(echeance)
    today = date.today()

    status = (
        "paid"
        if is_paid
        else (
            "overdue"
            if echeance.statut == "active" and next_date and next_date < today
            else "pending"
            if echeance.statut == "active"
            else "paid"
        )
    )

    return {
        "id": str(echeance.id) if echeance.id else "",
        "nom": echeance.description or echeance.nom or "",
        "categorie": echeance.categorie,
        "sous_categorie": echeance.sous_categorie or "",
        "categoryType": echeance.sous_categorie or "",
        "date": next_date.strftime("%d %b.") if next_date else "",
        "daysRemaining": (next_date - today).days if next_date else 0,
        "montant": echeance.montant,
        "type": echeance.type,
        "frequence": echeance.frequence,
        "date_debut": echeance.date_debut.isoformat() if echeance.date_debut else "",
        "date_fin": echeance.date_fin.isoformat() if echeance.date_fin else None,
        "description": echeance.description or "",
        "date_prevue": next_date.isoformat() if next_date else "",
        "statut": status,
        "paymentMethod": _get_payment_method(echeance.frequence),
        "statut_base": echeance.statut,
    }


def _build_calendar_occurrence(o: dict, today: date, paid_map: dict) -> dict:
    """Construit une occurrence de calendrier."""
    iso_date = o["date"][:10]
    echeance_id = o["id"]
    is_paid = echeance_id in paid_map and iso_date in paid_map[echeance_id]

    status = (
        "paid"
        if is_paid
        else ("overdue" if iso_date < today.isoformat() else "pending")
    )

    return {
        "id": f"{echeance_id}-{iso_date}",
        "echeance_base_id": echeance_id,
        "nom": o["nom"],
        "categorie": o["categorie"],
        "sous_categorie": o.get("sous_categorie", ""),
        "categoryType": o.get("sous_categorie", ""),
        "date": date.fromisoformat(iso_date).strftime("%d %b."),
        "date_prevue": iso_date,
        "date_debut": o.get("date_debut", iso_date),
        "date_fin": o.get("date_fin"),
        "montant": o["montant"],
        "type": o["type"],
        "statut": status,
        "frequence": o["frequence"],
        "paymentMethod": _get_payment_method(o["frequence"]),
        "statut_base": o.get("statut", "active"),
    }


@router.get("/")
async def get_echeances():
    """Récupère toutes les échéances actives."""
    try:
        echeances = repo.get_all()
        paid_ids = _get_paid_this_month()
        return [
            _build_echeance_response(e, is_paid=e.id in paid_ids) for e in echeances
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
            occurrences = repo.get_occurrences_for_month(current.year, current.month)
            all_occurrences.extend(
                _build_calendar_occurrence(o, today, paid_map) for o in occurrences
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
