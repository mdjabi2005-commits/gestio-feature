"""
Repository pour les Échéances
Gère l'accès aux données de la table 'echeances'
"""

import logging
from datetime import date, timedelta, datetime
from typing import List, Optional
from dateutil.relativedelta import relativedelta

from sqlcipher3 import dbapi2 as sqlcipher

from backend.shared.database import db_transaction
from backend.shared.database.base_repository import BaseRepository
from backend.domains.echeance.model import Echeance

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


class EcheanceRepository(BaseRepository[Echeance]):
    table_name = "echeances"
    model_class = Echeance

    def _get_insert_data(self, echeance: Echeance) -> dict:
        """Sérialise en excluant l'ID et formatant les dates."""
        d = echeance.model_dump(exclude={'id'}, exclude_none=True)
        if d.get('date_debut'): d['date_debut'] = d['date_debut'].isoformat()
        if d.get('date_fin'): d['date_fin'] = d['date_fin'].isoformat()
        d['date_creation'] = datetime.now().isoformat()
        return d

    def get_all(self) -> List[Echeance]:
        """Récupère toutes les échéances actives."""
        return self.get_where("statut = 'active'", order_by="date_debut ASC")

    def get_all_raw(self) -> List[dict]:
        """Récupère toutes les échéances actives sous forme de dictionnaires."""
        return self.get_where_raw("statut = 'active'", order_by="date_debut ASC")

    def add(self, echeance: Echeance, conn=None) -> int:
        """Ajoute une nouvelle échéance et retourne son ID."""
        logger.info(f"Ajout d'une échéance : {echeance.nom} ({echeance.montant}€)")
        try:
            return super().add(echeance, conn=conn) or 0
        except Exception as e:
            from backend.config.logging_config import log_error
            log_error(e, "Erreur lors de l'ajout de l'échéance")
            return 0

    def update(self, echeance: Echeance) -> bool:
        """Met à jour une échéance existante."""
        if not echeance.id:
            logger.warning("Tentative de mise à jour sans ID")
            return False

        logger.info(f"Mise à jour de l'échéance ID {echeance.id}")
        
        d = echeance.model_dump(exclude={'id'})
        if d.get('date_debut'): d['date_debut'] = d['date_debut'].isoformat()
        if d.get('date_fin'): d['date_fin'] = d['date_fin'].isoformat()
        d['date_modification'] = datetime.now().isoformat()

        try:
            success = self.update_by_id(echeance.id, d)
            if success:
                logger.info(f"Échéance ID {echeance.id} mise à jour avec succès")
            return success
        except Exception as e:
            from backend.config.logging_config import log_error
            log_error(e, f"Erreur lors de la mise à jour de l'échéance (ID: {echeance.id})")
            return False

    def delete(self, echeance_id: int, conn=None) -> bool:
        """Supprime une échéance et ses transactions générées."""
        logger.info(f"Suppression de l'échéance ID {echeance_id}")
        
        try:
            with self._get_conn(conn) as c:
                # Delete related transactions first (using same connection)
                cursor = c.cursor()
                cursor.execute("DELETE FROM transactions WHERE echeance_id = ?", (echeance_id,))
                transactions_deleted = cursor.rowcount
                
                # Delete the echeance
                cursor.execute("DELETE FROM echeances WHERE id = ?", (echeance_id,))
                success = cursor.rowcount > 0
                
            logger.info(f"Échéance ID {echeance_id} supprimée ({transactions_deleted} transactions)")
            return success
        except Exception as e:
            from backend.config.logging_config import log_error
            log_error(e, f"Erreur lors de la suppression de l'échéance (ID: {echeance_id})")
            return False

    def get_occurrences_for_month(self, year: int, month: int) -> List[dict]:
        """Calcule les occurrences d'échéance pour un mois donné."""
        from calendar import monthrange

        try:
            _, last_day = monthrange(year, month)
            month_start = date(year, month, 1)
            month_end = date(year, month, last_day)

            # Get raw objects since we don't need Pydantic models here really, 
            # but using models ensures correct typing logic (as the previous version did).
            echeances = self.get_all()

            occurrences = []
            limit_date = month_end

            for echeance in echeances:
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

        except Exception as e:
            logger.error(f"Erreur lors du calcul des occurrences: {e}")
            return []
