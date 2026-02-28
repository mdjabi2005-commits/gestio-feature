"""
Recurrence Service - Unified recurrence operations

Handles automatic generation of recurring transactions and echeances management.
Consolidates recurrence.py + recurrence_generation.py for better maintainability.
"""

from datetime import timedelta, date
from typing import List, Dict

from dateutil.parser import parse
from dateutil.relativedelta import relativedelta

from config.logging_config import get_logger
from shared.database.connection import get_db_connection

logger = get_logger(__name__)

# Mapping unifié fréquence → relativedelta (accepte toutes les variantes)
FREQ_DELTAS = {
    'quotidien': timedelta(days=1),
    'quotidienne': timedelta(days=1),
    'hebdomadaire': timedelta(weeks=1),
    'mensuel': relativedelta(months=1),
    'mensuelle': relativedelta(months=1),
    'trimestriel': relativedelta(months=3),
    'trimestrielle': relativedelta(months=3),
    'semestriel': relativedelta(months=6),
    'semestrielle': relativedelta(months=6),
    'annuel': relativedelta(years=1),
    'annuelle': relativedelta(years=1),
}


# ==============================
# 🔄 RECURRENCE GENERATION
# ==============================

def generate_occurrences_for_recurrence(
        recurrence_id: int,
        start_date: date,
        end_date: date
) -> List[Dict]:
    """
    Génère les occurrences d'une récurrence entre deux dates.

    IMPORTANT : Génère SEULEMENT les occurrences passées (<=aujourd'hui),
    pas les futures.

    Args:
        recurrence_id: ID de la récurrence dans la table recurrences
        start_date: Date de début de génération
        end_date: Date de fin de génération (généralement aujourd'hui)

    Returns:
        Liste de dictionnaires représentant les transactions à créer
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Récupérer la récurrence
    # noinspection SqlNoDataSourceInspection
    rec = cursor.execute("""
                         SELECT type,
                                categorie,
                                sous_categorie,
                                montant,
                                date_debut,
                                date_fin,
                                frequence,
                                description
                         FROM recurrences
                         WHERE id = ?
                           AND statut = 'active'
                         """, (recurrence_id,)).fetchone()

    conn.close()

    if not rec:
        return []

    type_rec, categorie, sous_categorie, montant, date_debut_str, date_fin_str, frequence, description = rec

    # Convertir dates
    date_debut = parse(date_debut_str).date()
    date_fin_rec = parse(date_fin_str).date() if date_fin_str else None

    # IMPORTANT : Ne générer que jusqu'à aujourd'hui (pas de futures)
    today = date.today()
    end_date = min(end_date, today)

    # Générer occurrences
    occurrences = []
    current_date = max(date_debut, start_date)

    while current_date <= end_date:
        # Vérifier si on dépasse la date de fin de la récurrence
        if date_fin_rec and current_date > date_fin_rec:
            break

        occurrences.append({
            'type': type_rec,
            'categorie': categorie,
            'sous_categorie': sous_categorie or '',
            'montant': montant,
            'date': current_date.isoformat(),
            'source': 'récurrente_auto',
            'description': description or f'Récurrence auto - {categorie}'
        })

        # Calculer prochaine occurrence via mapping unifié
        delta = FREQ_DELTAS.get(frequence.lower())
        if not delta:
            logger.warning(f"Fréquence inconnue '{frequence}' pour récurrence ID {recurrence_id}")
            break
        current_date += delta

    return occurrences


def backfill_all_recurrences() -> int:
    """
    Génère toutes les occurrences manquantes pour toutes les récurrences actives.

    IMPORTANT : Ne génère que les transactions PASSÉES (jusqu'à aujourd'hui).

    Returns:
        Nombre de transactions créées
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Récupérer toutes les récurrences actives
    # noinspection SqlNoDataSourceInspection
    recurrences = cursor.execute("""
                                 SELECT id, date_debut, date_fin
                                 FROM recurrences
                                 WHERE statut = 'active'
                                 """).fetchall()

    today = date.today()
    total_created = 0

    for rec_id, date_debut_str, date_fin_str in recurrences:
        date_debut = parse(date_debut_str).date()

        occurrences = generate_occurrences_for_recurrence(rec_id, date_debut, today)

        for occ in occurrences:
            # Check if transaction already exists
            # noinspection SqlNoDataSourceInspection
            existing = cursor.execute("""
                                      SELECT id
                                      FROM transactions
                                      WHERE categorie = ?
                                        AND sous_categorie = ?
                                        AND date = ?
                                        AND source = 'récurrente_auto'
                                      """, (occ['categorie'], occ['sous_categorie'], occ['date'])).fetchone()

            if not existing:
                # noinspection SqlNoDataSourceInspection
                cursor.execute("""
                               INSERT INTO transactions
                                   (type, categorie, sous_categorie, montant, date, source, description)
                               VALUES (?, ?, ?, ?, ?, 'récurrente_auto', ?)
                               """, (
                                   occ['type'],
                                   occ['categorie'],
                                   occ['sous_categorie'],
                                   occ['montant'],
                                   occ['date'],
                                   occ['description']
                               ))
                total_created += 1

    conn.commit()
    conn.close()

    logger.info(f"Backfill completed: {total_created} transactions created")
    return total_created


def backfill_recurrences_to_today() -> None:
    """
    Génère automatiquement toutes les transactions récurrentes jusqu'à aujourd'hui.

    Wrapper simplifié pour backfill_all_recurrences().

    Returns:
        None
    """
    count = backfill_all_recurrences()
    logger.info(f"Recurrence backfill completed: {count} transactions created")


# ==============================
# 📅 ECHEANCES MANAGEMENT
# ==============================

def generate_future_occurrences(months_ahead: int = 12) -> int:
    """
    Génère les occurrences futures pour toutes les récurrences actives.

    Args:
        months_ahead: Nombre de mois à l'avance à générer

    Returns:
        Nombre de transactions créées
    """
    today = date.today()
    end_date = today + relativedelta(months=months_ahead)

    conn = get_db_connection()
    cursor = conn.cursor()

    # noinspection SqlNoDataSourceInspection
    recurrences = cursor.execute("""
                                 SELECT id
                                 FROM recurrences
                                 WHERE statut = 'active'
                                 """).fetchall()

    total_created = 0

    for (rec_id,) in recurrences:
        occurrences = generate_occurrences_for_recurrence(rec_id, today, end_date)

        for occ in occurrences:
            # noinspection SqlNoDataSourceInspection
            existing = cursor.execute("""
                                      SELECT id
                                      FROM transactions
                                      WHERE categorie = ?
                                        AND sous_categorie = ?
                                        AND date = ?
                                        AND source = 'récurrente'
                                      """, (occ['categorie'], occ['sous_categorie'], occ['date'])).fetchone()

            if not existing:
                # noinspection SqlNoDataSourceInspection
                cursor.execute("""
                               INSERT INTO transactions
                                   (type, categorie, sous_categorie, montant, date, source, description)
                               VALUES (?, ?, ?, ?, ?, ?, ?)
                               """, (
                                   occ['type'],
                                   occ['categorie'],
                                   occ['sous_categorie'],
                                   occ['montant'],
                                   occ['date'],
                                   occ['source'],
                                   occ['description']
                               ))
                total_created += 1

    conn.commit()
    conn.close()

    logger.info(f"Future generation completed: {total_created} transactions created")
    return total_created


def sync_recurrences_to_echeances() -> int:
    """
    Synchronise les récurrences actives vers la table echeances.

    Returns:
        Nombre d'échéances créées
    """
    today = date.today()
    fin_mois_suivant = (today.replace(day=1) + relativedelta(months=2)) - timedelta(days=1)

    conn = get_db_connection()
    cursor = conn.cursor()

    # noinspection SqlNoDataSourceInspection
    recurrences = cursor.execute("""
                                 SELECT id,
                                        type,
                                        categorie,
                                        sous_categorie,
                                        montant,
                                        date_debut,
                                        date_fin,
                                        frequence,
                                        description
                                 FROM recurrences
                                 WHERE statut = 'active'
                                 """).fetchall()

    total_created = 0

    for rec in recurrences:
        rec_id, type_rec, categorie, sous_cat, montant, date_debut_str, date_fin_str, frequence, description = rec

        date_debut = parse(date_debut_str).date()
        date_fin_rec = parse(date_fin_str).date() if date_fin_str else None

        current = date_debut
        while current <= fin_mois_suivant:
            if current >= today:
                if date_fin_rec and current > date_fin_rec:
                    break

                # noinspection SqlNoDataSourceInspection
                existing = cursor.execute("""
                                          SELECT id
                                          FROM echeances
                                          WHERE categorie = ?
                                            AND date_echeance = ?
                                            AND type_echeance = 'récurrente'
                                            AND recurrence_id = ?
                                          """, (categorie, current.isoformat(), rec_id)).fetchone()

                if not existing:
                    # noinspection SqlNoDataSourceInspection
                    cursor.execute("""
                                   INSERT INTO echeances
                                   (type, categorie, sous_categorie, montant, date_echeance,
                                    type_echeance, description, statut, recurrence_id)
                                   VALUES (?, ?, ?, ?, ?, 'récurrente', ?, 'active', ?)
                                   """, (
                                       type_rec,
                                       categorie,
                                       sous_cat or '',
                                       montant,
                                       current.isoformat(),
                                       description or f'Récurrence {frequence}',
                                       rec_id
                                   ))
                    total_created += 1

            delta = FREQ_DELTAS.get(frequence.lower())
            if not delta:
                logger.warning(f"Fréquence inconnue '{frequence}' pour récurrence ID {rec_id}")
                break
            current += delta

    conn.commit()
    conn.close()

    logger.info(f"Sync recurrences to echeances: {total_created} created")
    return total_created


def cleanup_past_echeances() -> int:
    """
    Supprime les échéances passées (récurrentes et prévues).

    Returns:
        Nombre d'échéances supprimées
    """
    today = date.today()

    conn = get_db_connection()
    cursor = conn.cursor()

    # noinspection SqlNoDataSourceInspection
    cursor.execute("""
                   DELETE
                   FROM echeances
                   WHERE date_echeance < ?
                     AND type_echeance = 'récurrente'
                   """, (today.isoformat(),))

    deleted_recurrentes = cursor.rowcount

    # noinspection SqlNoDataSourceInspection
    cursor.execute("""
                   UPDATE echeances
                   SET statut = 'expirée'
                   WHERE date_echeance < ?
                     AND type_echeance = 'prévue'
                     AND statut = 'active'
                   """, (today.isoformat(),))

    expired_prevues = cursor.rowcount

    conn.commit()
    conn.close()

    logger.info(f"Cleanup: {deleted_recurrentes} récurrentes supprimées, {expired_prevues} prévues expirées")
    return deleted_recurrentes + expired_prevues


def refresh_echeances() -> None:
    """
    Rafraîchit les échéances: nettoie les passées et synchronise les récurrences.

    Cette fonction doit être appelée au démarrage de l'application.
    """
    cleanup_past_echeances()
    sync_recurrences_to_echeances()
    logger.info("Echeances refreshed")
