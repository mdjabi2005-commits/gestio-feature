"""
Repository pour les Échéances
Gère l'accès aux données de la table 'echeances'
"""

import logging
from datetime import date, timedelta
from typing import List, Optional
from dateutil.relativedelta import relativedelta

from sqlcipher3 import dbapi2 as sqlcipher

from backend.shared.database import db_transaction
from .model import Echeance

logger = logging.getLogger(__name__)

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
}


class EcheanceRepository:
    def __init__(self, db_path: str = None):
        self.db_path = db_path

    def get_all(self) -> List[Echeance]:
        """Récupère toutes les échéances actives."""
        with db_transaction(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM echeances WHERE statut = 'active' ORDER BY date_debut ASC"
            )
            echeances = []
            for row in cursor.fetchall():
                try:
                    echeances.append(Echeance.model_validate(dict(row)))
                except Exception as e:
                    logger.error(f"Error validating echeance row: {e}")
            return echeances

    def get_all_raw(self) -> List[dict]:
        """Récupère toutes les échéances actives sous forme de dictionnaires."""
        with db_transaction(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM echeances WHERE statut = 'active' ORDER BY date_debut ASC"
            )
            return [dict(row) for row in cursor.fetchall()]

    def add(self, echeance: Echeance) -> int:
        """Ajoute une nouvelle échéance et retourne son ID."""
        logger.info(f"Ajout d'une échéance : {echeance.nom} ({echeance.montant}€)")
        query = """
            INSERT INTO echeances (nom, type, categorie, sous_categorie, montant,
                frequence, date_debut, date_fin, description, statut, type_echeance, objectif_id, date_creation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, Datetime('now'))
        """

        try:
            with db_transaction(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    query,
                    (
                        echeance.nom,
                        echeance.type,
                        echeance.categorie,
                        echeance.sous_categorie,
                        echeance.montant,
                        echeance.frequence,
                        echeance.date_debut,
                        echeance.date_fin,
                        echeance.description,
                        echeance.statut,
                        echeance.type_echeance,
                        echeance.objectif_id,
                    ),
                )
                echeance_id = cursor.lastrowid
            logger.info(f"Échéance ajoutée avec succès (ID: {echeance_id})")
            return echeance_id
        except sqlcipher.Error as e:
            from backend.config.logging_config import log_error

            log_error(e, "Erreur lors de l'ajout de l'échéance")
            return 0

    def update(self, echeance: Echeance) -> bool:
        """Met à jour une échéance existante."""
        if not echeance.id:
            logger.warning("Tentative de mise à jour sans ID")
            return False

        logger.info(f"Mise à jour de l'échéance ID {echeance.id}")
        query = """
            UPDATE echeances
            SET nom=?, type=?, categorie=?, sous_categorie=?, montant=?,
                frequence=?, date_debut=?, date_fin=?, description=?,
                statut=?, type_echeance=?, objectif_id=?, date_modification=Datetime('now')
            WHERE id=?
        """

        try:
            with db_transaction(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    query,
                    (
                        echeance.nom,
                        echeance.type,
                        echeance.categorie,
                        echeance.sous_categorie,
                        echeance.montant,
                        echeance.frequence,
                        echeance.date_debut,
                        echeance.date_fin,
                        echeance.description,
                        echeance.statut,
                        echeance.type_echeance,
                        echeance.objectif_id,
                        echeance.id,
                    ),
                )
            logger.info(f"Échéance ID {echeance.id} mise à jour avec succès")
            return True
        except sqlcipher.Error as e:
            from backend.config.logging_config import log_error

            log_error(
                e, f"Erreur lors de la mise à jour de l'échéance (ID: {echeance.id})"
            )
            return False

    def delete(self, echeance_id: int) -> bool:
        """Supprime une échéance et ses transactions générées."""
        logger.info(f"Suppression de l'échéance ID {echeance_id}")
        query = "DELETE FROM transactions WHERE echeance_id = ?"

        try:
            with db_transaction(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(query, (echeance_id,))
                transactions_deleted = cursor.rowcount
                cursor.execute("DELETE FROM echeances WHERE id = ?", (echeance_id,))
            logger.info(
                f"Échéance ID {echeance_id} supprimée ({transactions_deleted} transactions)"
            )
            return True
        except sqlcipher.Error as e:
            from backend.config.logging_config import log_error

            log_error(
                e, f"Erreur lors de la suppression de l'échéance (ID: {echeance_id})"
            )
            return False

    def get_occurrences_for_month(self, year: int, month: int) -> List[dict]:
        """Calcule les occurrences d'échéance pour un mois donné."""
        from calendar import monthrange

        try:
            _, last_day = monthrange(year, month)
            month_start = date(year, month, 1)
            month_end = date(year, month, last_day)

            with db_transaction(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM echeances WHERE statut = 'active'")
                rows = cursor.fetchall()

            occurrences = []
            limit_date = month_end

            for row in rows:
                try:
                    echeance = Echeance.model_validate(dict(row))
                except Exception as e:
                    logger.error(f"Error validating echeance instance: {e}")
                    continue

                if echeance.date_fin and echeance.date_fin < month_start:
                    continue

                current = echeance.date_debut
                delta = FREQ_DELTAS.get(echeance.frequence.lower())

                if not delta:
                    logger.warning(f"Fréquence inconnue: {echeance.frequence}")
                    continue

                effective_limit = (
                    min(limit_date, echeance.date_fin)
                    if echeance.date_fin
                    else date(year + 1, 12, 31)
                )

                while current <= effective_limit:
                    if current >= month_start and current <= month_end:
                        occurrences.append(
                            {
                                "id": echeance.id,
                                "nom": echeance.nom,
                                "type": echeance.type,
                                "categorie": echeance.categorie,
                                "sous_categorie": echeance.sous_categorie,
                                "montant": echeance.montant,
                                "date": current.isoformat(),
                                "date_debut": echeance.date_debut.isoformat()
                                if echeance.date_debut
                                else None,
                                "date_fin": echeance.date_fin.isoformat()
                                if echeance.date_fin
                                else None,
                                "description": echeance.description,
                                "frequence": echeance.frequence,
                                "type_echeance": echeance.type_echeance,
                            }
                        )

                    if current >= month_end:
                        break
                    current += delta
                    if current > effective_limit:
                        break

            return sorted(occurrences, key=lambda x: x["date"])

        except sqlcipher.Error as e:
            logger.error(f"Erreur lors du calcul des occurrences: {e}")
            return []
