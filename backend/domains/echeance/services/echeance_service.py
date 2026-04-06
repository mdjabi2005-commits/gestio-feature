"""
Echeance Service - Gestion des échéances

Fonctions de maintenance, de rafraîchissement et de backfill des échéances.
Fonctions helper pour construire les réponses JSON.
"""

from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
import logging
from typing import List, Dict, Set, Optional

from sqlcipher3 import dbapi2 as sqlcipher

from backend.shared.database import db_transaction
from backend.shared.database.connection import get_db_connection, close_connection
from backend.domains.echeance.database.model import Echeance

logger = logging.getLogger(__name__)

AUTOMATIC_FREQUENCIES = {
    "mensuel",
    "mensuelle",
    "annuel",
    "annuelle",
    "trimestriel",
    "trimestrielle",
}

FREQ_DELTAS = {
    "quotidien": timedelta(days=1),
    "quotidienne": timedelta(days=1),
    "hebdomadaire": timedelta(weeks=1),
    "mensuel": relativedelta(months=1),
    "mensuelle": relativedelta(months=1),
    "trimestriel": relativedelta(months=3),
    "trimestrielle": relativedelta(months=3),
    "semestriel": relativedelta(months=6),
    "semestrielle": relativedelta(months=6),
    "annuel": relativedelta(years=1),
    "annuelle": relativedelta(years=1),
    "unique": None,
}


def cleanup_past_echeances() -> int:
    """
    Supprime les échéances passées (ponctuelles expirées).
    """
    today = date.today()

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Mark ponctuelles as expired if their debut date is past
        cursor.execute(
            """
            UPDATE echeances
            SET statut = 'expirée'
            WHERE date_debut < ?
              AND type_echeance = 'ponctuelle'
              AND statut = 'active'
        """,
            (today.isoformat(),),
        )

        expired_prevues = cursor.rowcount

        conn.commit()
        conn.close()

        logger.info(f"Cleanup: {expired_prevues} prévues expirées")
        return expired_prevues

    except Exception as e:
        logger.error(f"Erreur cleanup_past_echeances: {e}")
        if conn:
            conn.close()
        return 0


def backfill_echeances(months_back: int = 3) -> int:
    """
    Génère les transactions manquantes depuis les modèles echeances.

    Lit les modèles actifs dans echeances, calcule les occurrences dues
    entre date_debut et aujourd'hui + months_back, et insère dans transactions
    si pas déjà présentes.

    Args:
        months_back: Nombre de mois à regarder en arrière (défaut: 3)

    Returns:
        Nombre de transactions créées
    """
    today = date.today()
    end_date = today + relativedelta(months=months_back)

    conn = None
    try:
        conn = get_db_connection()
        conn.row_factory = sqlcipher.Row
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM echeances WHERE statut = 'active'")
        rows = cursor.fetchall()

        created_count = 0

        for row in rows:
            try:
                echeance = Echeance(**dict(row))
            except Exception as e:
                logger.warning(f"Erreur parsing échéance {row['id']}: {e}")
                continue

            delta = FREQ_DELTAS.get(echeance.frequence.lower())

            start = echeance.date_debut if echeance.date_debut else today
            current = start

            while current <= end_date:
                if current > today:
                    break

                if echeance.date_fin and current > echeance.date_fin:
                    break

                # Deduplication: use echeance_id and date instead of categorie
                cursor.execute(
                    """
                    SELECT id FROM transactions
                    WHERE echeance_id = ?
                      AND date = ?
                    """,
                    (
                        echeance.id,
                        current.isoformat(),
                    ),
                )

                if not cursor.fetchone():
                    cursor.execute(
                        """
                        INSERT INTO transactions
                        (type, categorie, sous_categorie, montant, date, source, description, echeance_id)
                        VALUES (?, ?, ?, ?, ?, 'echeance', ?, ?)
                        """,
                        (
                            echeance.type,
                            echeance.categorie,
                            echeance.sous_categorie or "",
                            echeance.montant,
                            current.isoformat(),
                            echeance.description or echeance.nom,
                            echeance.id,
                        ),
                    )
                    created_count += 1

                if delta is None:
                    break
                current += delta

        conn.commit()
        conn.close()

        logger.info(f"Backfill: {created_count} transactions créées")
        return created_count

    except Exception as e:
        logger.error(f"Erreur backfill_echeances: {e}")
        if conn:
            conn.close()
        return 0


def refresh_echeances() -> None:
    """
    Rafraîchit les échéances : nettoie les passées et génère les transactions manquantes.

    Cette fonction doit être appelée au démarrage de l'application.
    """
    cleanup_past_echeances()
    backfill_echeances(months_back=1)
    logger.info("Echeances refreshed")


def calculate_next_occurrence(echeance: Echeance) -> date:
    """
    Calcule la prochaine occurrence d'une échéance depuis aujourd'hui.

    Args:
        echeance: Modèle d'échéance

    Returns:
        Prochaine date d'échéance
    """
    today = date.today()
    delta = FREQ_DELTAS.get(echeance.frequence.lower())

    if echeance.frequence.lower() == "unique":
        return echeance.date_debut if echeance.date_debut else today

    if not delta:
        return today

    current = echeance.date_debut if echeance.date_debut else today

    while current < today:
        if echeance.date_fin and current > echeance.date_fin:
            return today
        current += delta

    return current


def get_payment_method(frequence: str) -> str:
    """Détermine si le paiement est automatique selon la fréquence."""
    return "automatic" if frequence.lower() in AUTOMATIC_FREQUENCIES else "manual"


def get_paid_this_month() -> Set[int]:
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


def get_paid_dates_map() -> Dict[str, List[str]]:
    """Récupère un dictionnaire {echeance_id: [dates_payées]}."""
    with db_transaction() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT echeance_id, date FROM transactions WHERE echeance_id IS NOT NULL"
        )
        res: Dict[str, List[str]] = {}
        for row in cursor.fetchall():
            eid = str(row["echeance_id"])
            d = row["date"][:10]
            res.setdefault(eid, []).append(d)
        return res


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
