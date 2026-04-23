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
from backend.domains.echeance.model import Echeance

logger = logging.getLogger(__name__)

AUTOMATIC_FREQUENCIES = {
    "mensuel",
    "annuel",
    "trimestriel",
}

FREQ_DELTAS = {
    "quotidien": timedelta(days=1),
    "hebdomadaire": timedelta(weeks=1),
    "mensuel": relativedelta(months=1),
    "trimestriel": relativedelta(months=3),
    "semestriel": relativedelta(months=6),
    "annuel": relativedelta(years=1),
    "unique": None,
}


def cleanup_echeances() -> int:
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
        logger.error(f"Erreur cleanup_echeances: {e}")
        if conn:
            conn.close()
        return 0


def _generate_transactions_for_echeance(echeance: Echeance, cursor, today: date, end_date: date) -> int:
    """Génère les transactions manquantes pour une échéance spécifique."""
    delta = FREQ_DELTAS.get(echeance.frequence.lower())
    start = echeance.date_debut if echeance.date_debut else today
    current = start
    created_count = 0

    while current <= end_date:
        if current > today:
            break

        if echeance.date_fin and current > echeance.date_fin:
            break

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

    return created_count


def backfill_echeances(months_back: int = 3) -> int:
    """
    Génère les transactions manquantes depuis les modèles echeances.
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
                created_count += _generate_transactions_for_echeance(echeance, cursor, today, end_date)
            except Exception as e:
                logger.warning(f"Erreur parsing échéance {row['id']}: {e}")
                continue

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
    cleanup_echeances()
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
    
    if echeance.frequence == "unique":
        return echeance.date_debut if echeance.date_debut else today

    delta = FREQ_DELTAS[echeance.frequence]
    current = echeance.date_debut if echeance.date_debut else today

    while current < today:
        if echeance.date_fin and current > echeance.date_fin:
            return today
        current += delta

    return current



