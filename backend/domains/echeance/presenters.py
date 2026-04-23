"""
Presenters pour les Échéances.
Ce fichier contient les fonctions de formatage des données pour le frontend.
"""

from datetime import date
from typing import Dict, List

from backend.domains.echeance.model import Echeance
from backend.domains.echeance.service import calculate_next_occurrence, AUTOMATIC_FREQUENCIES


def get_payment_method(frequence: str) -> str:
    """Détermine si le paiement est automatique selon la fréquence."""
    return "automatic" if frequence.lower() in AUTOMATIC_FREQUENCIES else "manual"


def build_echeance_response(echeance: Echeance, is_paid: bool = False) -> dict:
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
        "paymentMethod": get_payment_method(echeance.frequence),
        "statut_base": echeance.statut,
    }


def build_calendar_occurrence(o: dict, today: date, paid_map: dict) -> dict:
    """Construit une occurrence de calendrier."""
    iso_date = o["date"][:10]
    echeance_id = str(o["id"])
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
        "paymentMethod": get_payment_method(o["frequence"]),
        "statut_base": o.get("statut", "active"),
    }
