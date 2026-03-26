"""
Echeance Service - Gestion des échéances

Fonctions de maintenance et de rafraîchissement des échéances.
"""

from datetime import date
import logging

from backend.shared.database.connection import get_db_connection, close_connection

logger = logging.getLogger(__name__)


def cleanup_past_echeances() -> int:
    """
    Supprime les échéances passées (récurrentes et prévues).

    Returns:
        Nombre d'échéances supprimées/marquées
    """
    today = date.today()

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            DELETE FROM echeances
            WHERE date_prevue < ?
              AND type_echeance = 'recurrente'
        """,
            (today.isoformat(),),
        )

        deleted_recurrentes = cursor.rowcount

        cursor.execute(
            """
            UPDATE echeances
            SET statut = 'expirée'
            WHERE date_prevue < ?
              AND type_echeance = 'ponctuelle'
              AND statut = 'active'
        """,
            (today.isoformat(),),
        )

        expired_prevues = cursor.rowcount

        conn.commit()
        conn.close()

        logger.info(
            f"Cleanup: {deleted_recurrentes} récurrentes supprimées, {expired_prevues} prévues expirées"
        )
        return deleted_recurrentes + expired_prevues

    except Exception as e:
        logger.error(f"Erreur cleanup_past_echeances: {e}")
        if conn:
            conn.close()
        return 0


def refresh_echeances() -> None:
    """
    Rafraîchit les échéances : nettoie les passées.

    Cette fonction doit être appelée au démarrage de l'application.
    """
    cleanup_past_echeances()
    logger.info("Echeances refreshed")
