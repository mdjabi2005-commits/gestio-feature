"""
Repository pour les Récurrences
Gère l'accès aux données de la table 'recurrences'
"""

import logging
import sqlite3
from typing import List

from shared.database.connection import get_db_connection, close_connection
from .model_recurrence import Recurrence

logger = logging.getLogger(__name__)


class RecurrenceRepository:
    def __init__(self, db_path: str = None):
        self.db_path = db_path

    def get_all_recurrences(self) -> List[Recurrence]:
        """Récupère toutes les récurrences."""
        conn = None
        recurrences = []
        try:
            conn = get_db_connection(db_path=self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute("SELECT * FROM recurrences ORDER BY montant DESC")
            rows = cursor.fetchall()

            for row in rows:
                recurrences.append(Recurrence(**dict(row)))

            logger.info(f"Récupération de {len(recurrences)} récurrences réussie")
            return recurrences
        except sqlite3.Error as e:
            logger.error(f"Erreur lors de la récupération des récurrences: {e}")
            return []
        finally:
            close_connection(conn)

    def add_recurrence(self, recurrence: Recurrence) -> bool:
        """Ajoute une nouvelle récurrence."""
        conn = None
        try:
            logger.info(f"Ajout d'une récurrence : {recurrence.description} ({recurrence.montant}€)")
            conn = get_db_connection(db_path=self.db_path)
            cursor = conn.cursor()

            cursor.execute("""
                           INSERT INTO recurrences (type, categorie, sous_categorie, montant,
                                                    frequence, date_debut, date_fin, description,
                                                    statut, date_creation)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, Datetime('now'))
                           """, (
                               recurrence.type,
                               recurrence.categorie,
                               recurrence.sous_categorie,
                               recurrence.montant,
                               recurrence.frequence,
                               recurrence.date_debut,
                               recurrence.date_fin,
                               recurrence.description,
                               recurrence.statut
                           ))

            conn.commit()
            logger.info(f"✅ Récurrence ajoutée avec succès")
            return True
        except sqlite3.Error as e:
            from config.logging_config import log_error
            log_error(e, "Erreur lors de l'ajout de la récurrence")
            return False
        finally:
            close_connection(conn)

    def update_recurrence(self, recurrence: Recurrence) -> bool:
        """Met à jour une récurrence existante."""
        if not recurrence.id:
            logger.warning("Tentative de mise à jour sans ID")
            return False

        conn = None
        try:
            logger.info(f"Mise à jour de la récurrence ID {recurrence.id}")
            conn = get_db_connection(db_path=self.db_path)
            cursor = conn.cursor()

            cursor.execute("""
                           UPDATE recurrences
                           SET type              = ?,
                               categorie         = ?,
                               sous_categorie    = ?,
                               montant           = ?,
                               frequence         = ?,
                               date_debut        = ?,
                               date_fin          = ?,
                               description       = ?,
                               statut            = ?,
                               date_modification = Datetime('now')
                           WHERE id = ?
                           """, (
                               recurrence.type,
                               recurrence.categorie,
                               recurrence.sous_categorie,
                               recurrence.montant,
                               recurrence.frequence,
                               recurrence.date_debut,
                               recurrence.date_fin,
                               recurrence.description,
                               recurrence.statut,
                               recurrence.id
                           ))

            conn.commit()
            logger.info(f"✅ Récurrence ID {recurrence.id} mise à jour avec succès")
            return True
        except sqlite3.Error as e:
            from config.logging_config import log_error
            log_error(e, f"Erreur lors de la mise à jour de la récurrence (ID: {recurrence.id})")
            return False
        finally:
            close_connection(conn)

    def delete_recurrence(self, recurrence_id: int) -> bool:
        """Supprime une récurrence."""
        conn = None
        try:
            logger.info(f"Suppression de la récurrence ID {recurrence_id}")
            conn = get_db_connection(db_path=self.db_path)
            cursor = conn.cursor()

            cursor.execute("DELETE FROM recurrences WHERE id = ?", (recurrence_id,))
            conn.commit()
            logger.info(f"✅ Récurrence ID {recurrence_id} supprimée avec succès")
            return True
        except sqlite3.Error as e:
            from config.logging_config import log_error
            log_error(e, f"Erreur lors de la suppression de la récurrence (ID: {recurrence_id})")
            return False
        finally:
            close_connection(conn)

    def migrate_from_echeances(self) -> dict:
        """
        Migre les données de l'ancienne table 'echeances' vers 'recurrences'.
        Retourne un bilan de la migration.
        """
        conn = None
        stats = {"migrated": 0, "errors": 0, "skipped": 0}

        try:
            logger.info("🚀 Début de la migration depuis 'echeances'...")
            conn = get_db_connection(db_path=self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # 1. Vérifier si la table echeances existe
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='echeances'")
            if not cursor.fetchone():
                logger.warning("Table 'echeances' introuvable. Migration annulée.")
                return stats

            # 2. Lire les données de echeances
            cursor.execute("SELECT * FROM echeances")
            echeances = cursor.fetchall()
            logger.info(f"Trouvé {len(echeances)} enregistrements dans 'echeances'")

            # 3. Insérer dans recurrences
            for ech in echeances:
                try:
                    # Vérifier doublons (basique: même description et montant)
                    cursor.execute(
                        "SELECT id FROM recurrences WHERE description = ? AND montant = ?",
                        (ech['description'], ech['montant'])
                    )
                    if cursor.fetchone():
                        logger.info(f"Doublon ignoré : {ech['description']}")
                        stats["skipped"] += 1
                        continue

                    # Mappage des champs
                    cursor.execute("""
                                   INSERT INTO recurrences (type, categorie, sous_categorie, montant,
                                                            frequence, date_debut, description, statut, date_creation)
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, Datetime('now'))
                                   """, (
                                       ech['type'],
                                       ech['categorie'],
                                       ech['sous_categorie'],
                                       ech['montant'],
                                       ech['recurrence'],  # mapping direct
                                       ech['date_echeance'],  # mapping date_echeance -> date_debut
                                       ech['description'],
                                       ech['statut'] or 'active'
                                   ))
                    stats["migrated"] += 1

                except Exception as e:
                    logger.error(f"❌ Erreur migration ligne {dict(ech)}: {e}")
                    stats["errors"] += 1

            conn.commit()
            logger.info(f"✅ Migration terminée: {stats}")
            return stats

        except sqlite3.Error as e:
            from config.logging_config import log_error
            log_error(e, "Erreur globale migration")
            return stats
        finally:
            close_connection(conn)
