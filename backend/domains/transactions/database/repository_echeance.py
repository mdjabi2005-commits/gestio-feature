"""
Repository pour les Échéances
Gère l'accès aux données de la table 'echeances'
"""

import logging
import sqlite3
from datetime import date, timedelta
from typing import List, Optional
from dateutil.relativedelta import relativedelta
from dateutil.parser import parse

from backend.shared.database.connection import get_db_connection, close_connection
from .model_echeance import Echeance

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
        conn = None
        echeances = []
        try:
            conn = get_db_connection(db_path=self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute(
                "SELECT * FROM echeances WHERE statut = 'active' ORDER BY date_debut ASC"
            )
            rows = cursor.fetchall()

            for row in rows:
                echeances.append(Echeance(**dict(row)))

            logger.info(f"Récupération de {len(echeances)} échéances réussie")
            return echeances
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des échéances: {e}")
            return []
        finally:
            close_connection(conn)

    def get_all_raw(self) -> List[dict]:
        """Récupère toutes les échéances actives sous forme de dictionnaires."""
        conn = None
        try:
            conn = get_db_connection(db_path=self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute(
                "SELECT * FROM echeances WHERE statut = 'active' ORDER BY date_debut ASC"
            )
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des échéances: {e}")
            return []
        finally:
            close_connection(conn)

    def add(self, echeance: Echeance) -> bool:
        """Ajoute une nouvelle échéance."""
        conn = None
        try:
            logger.info(f"Ajout d'une échéance : {echeance.nom} ({echeance.montant}€)")
            conn = get_db_connection(db_path=self.db_path)
            cursor = conn.cursor()

            cursor.execute(
                """
                INSERT INTO echeances (nom, type, categorie, sous_categorie, montant,
                    frequence, date_debut, date_fin, description,
                    statut, type_echeance, date_creation)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, Datetime('now'))
            """,
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
                ),
            )

            conn.commit()
            logger.info(f"✅ Échéance ajoutée avec succès")
            return True
        except sqlite3.Error as e:
            from backend.config.logging_config import log_error

            log_error(e, "Erreur lors de l'ajout de l'échéance")
            return False
        finally:
            close_connection(conn)

    def update(self, echeance: Echeance) -> bool:
        """Met à jour une échéance existante."""
        if not echeance.id:
            logger.warning("Tentative de mise à jour sans ID")
            return False

        conn = None
        try:
            logger.info(f"Mise à jour de l'échéance ID {echeance.id}")
            conn = get_db_connection(db_path=self.db_path)
            cursor = conn.cursor()

            cursor.execute(
                """
                UPDATE echeances
                SET nom = ?, type = ?, categorie = ?, sous_categorie = ?,
                    montant = ?, frequence = ?, date_debut = ?,
                    date_fin = ?, description = ?, statut = ?, type_echeance = ?,
                    date_modification = Datetime('now')
                WHERE id = ?
            """,
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
                    echeance.id,
                ),
            )

            conn.commit()
            logger.info(f"✅ Échéance ID {echeance.id} mise à jour avec succès")
            return True
        except sqlite3.Error as e:
            from backend.config.logging_config import log_error

            log_error(
                e, f"Erreur lors de la mise à jour de l'échéance (ID: {echeance.id})"
            )
            return False
        finally:
            close_connection(conn)

    def delete(self, echeance_id: int) -> bool:
        """Supprime une échéance et ses transactions générées (cascade)."""
        conn = None
        try:
            logger.info(f"Suppression de l'échéance ID {echeance_id}")
            conn = get_db_connection(db_path=self.db_path)
            cursor = conn.cursor()

            # Delete associated transactions first
            cursor.execute(
                "DELETE FROM transactions WHERE echeance_id = ?", (echeance_id,)
            )
            transactions_deleted = cursor.rowcount

            # Delete the echeance itself
            cursor.execute("DELETE FROM echeances WHERE id = ?", (echeance_id,))

            conn.commit()
            logger.info(
                f"✅ Échéance ID {echeance_id} supprimée ({transactions_deleted} transactions)"
            )
            return True
        except sqlite3.Error as e:
            from backend.config.logging_config import log_error

            log_error(
                e, f"Erreur lors de la suppression de l'échéance (ID: {echeance_id})"
            )
            return False
        finally:
            close_connection(conn)



    def get_occurrences_for_month(self, year: int, month: int) -> List[dict]:
        """
        Calcule les occurrences d'échéance pour un mois donné.

        Si date_fin est NULL, projette jusqu'à fin année+1 (limite de sécurité).
        Si date_fin est présent, ne pas dépasser cette date.

        Args:
            year: Année cible
            month: Mois cible (1-12)

        Returns:
            Liste de dictionnaires représentant les occurrences du mois
        """
        conn = None
        try:
            conn = get_db_connection(db_path=self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute("""
                SELECT * FROM echeances 
                WHERE statut = 'active'
            """)
            rows = cursor.fetchall()

            occurrences = []

            from calendar import monthrange

            _, last_day = monthrange(year, month)
            month_start = date(year, month, 1)
            month_end = date(year, month, last_day)

            limit_date = month_end

            for row in rows:
                echeance = Echeance(**dict(row))

                if echeance.date_fin and echeance.date_fin < month_start:
                    continue

                current = echeance.date_debut

                if echeance.date_fin:
                    effective_limit = min(limit_date, echeance.date_fin)
                else:
                    effective_limit = date(year + 1, 12, 31)

                delta = FREQ_DELTAS.get(echeance.frequence.lower())
                if not delta:
                    logger.warning(
                        f"Fréquence inconnue pour échéance {echeance.nom}: {echeance.frequence}"
                    )
                    continue

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
                                "date_debut": echeance.date_debut.isoformat() if echeance.date_debut else None,
                                "date_fin": echeance.date_fin.isoformat() if echeance.date_fin else None,
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

        except sqlite3.Error as e:
            logger.error(f"Erreur lors du calcul des occurrences: {e}")
            return []
        finally:
            close_connection(conn)
