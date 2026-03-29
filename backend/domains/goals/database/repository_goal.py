"""
Repository pour les Goals - Objectifs d'épargne
"""

import logging
import sqlite3
from datetime import date, datetime
from typing import List, Optional
from dateutil.relativedelta import relativedelta

from backend.shared.database import db_transaction
from .model_goal import Goal, GoalWithProgress

logger = logging.getLogger(__name__)


class GoalRepository:
    def __init__(self, db_path: str = None):
        self.db_path = db_path

    def get_all(self) -> List[Goal]:
        """Récupère tous les objectifs."""
        with db_transaction(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM goals WHERE statut != 'archived' ORDER BY date_creation DESC"
            )
            goals = []
            for row in cursor.fetchall():
                try:
                    goals.append(Goal.model_validate(dict(row)))
                except Exception as e:
                    logger.error(f"Error validating goal row: {e}")
            return goals

    def get_all_with_progress(self) -> List[GoalWithProgress]:
        """Récupère tous les objectifs avec leur progression."""
        goals = self.get_all()
        return [self._add_progress(goal) for goal in goals]

    def get_by_id(self, goal_id: int) -> Optional[Goal]:
        """Récupère un objectif par son ID."""
        with db_transaction(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM goals WHERE id = ?", (goal_id,))
            row = cursor.fetchone()
            if row:
                return Goal.model_validate(dict(row))
            return None

    def get_by_id_with_progress(self, goal_id: int) -> Optional[GoalWithProgress]:
        """Récupère un objectif avec sa progression."""
        goal = self.get_by_id(goal_id)
        if goal:
            return self._add_progress(goal)
        return None

    def add(self, goal: Goal) -> Optional[int]:
        """Ajoute un nouvel objectif."""
        query = """
            INSERT INTO goals (nom, montant_cible, date_echeance, categorie, description, statut, poids_allocation, date_creation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """

        try:
            with db_transaction(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    query,
                    (
                        goal.nom,
                        goal.montant_cible,
                        goal.date_echeance.isoformat() if goal.date_echeance else None,
                        goal.categorie,
                        goal.description,
                        goal.statut,
                        goal.poids_allocation,
                        datetime.now().date().isoformat(),
                    ),
                )
                new_id = cursor.lastrowid
                logger.info(f"Goal added: ID {new_id}")
                return new_id
        except sqlite3.Error as e:
            logger.error(f"Erreur SQL add goal: {e}")
            return None

    def update(self, goal_id: int, goal_data: dict) -> bool:
        """Met à jour un objectif existant."""
        if not goal_id:
            return False

        query = """
            UPDATE goals
            SET nom = ?, montant_cible = ?, date_echeance = ?, categorie = ?, description = ?, statut = ?, poids_allocation = ?, date_modification = ?
            WHERE id = ?
        """

        try:
            with db_transaction(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    query,
                    (
                        goal_data.get("nom"),
                        goal_data.get("montant_cible"),
                        goal_data.get("date_echeance").isoformat()
                        if goal_data.get("date_echeance")
                        else None,
                        goal_data.get("categorie"),
                        goal_data.get("description"),
                        goal_data.get("statut"),
                        goal_data.get("poids_allocation"),
                        datetime.now().isoformat(),
                        goal_id,
                    ),
                )
                return cursor.rowcount > 0
        except sqlite3.Error as e:
            logger.error(f"Erreur SQL update goal: {e}")
            return False

    def delete(self, goal_id: int) -> bool:
        """Supprime un objectif."""
        try:
            with db_transaction(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM goals WHERE id = ?", (goal_id,))
                return cursor.rowcount > 0
        except sqlite3.Error as e:
            logger.error(f"Erreur SQL delete goal: {e}")
            return False

    def _add_progress(self, goal: Goal) -> GoalWithProgress:
        """Calcule les métriques de progression pour un objectif."""
        today = datetime.now().date()

        # Montant actuel : somme des transactions depuis la création
        montant_actuel = self._calculate_montant_actuel(goal)

        # Montant mensuel : moyenne des 3 derniers mois
        montant_mensuel = self._calculate_montant_mensuel(goal)

        # Pourcentage de progression
        progression = (
            (montant_actuel / goal.montant_cible * 100)
            if goal.montant_cible > 0
            else 0.0
        )

        # Projection de la date d'atteinte
        projection_date = None
        if montant_mensuel > 0 and goal.montant_cible > montant_actuel:
            remaining = goal.montant_cible - montant_actuel
            months_needed = remaining / montant_mensuel
            projection_date = today + relativedelta(months=int(months_needed))

        return GoalWithProgress(
            **goal.model_dump(),
            montant_actuel=round(montant_actuel, 2),
            montant_mensuel=round(montant_mensuel, 2),
            progression_pourcentage=round(progression, 1),
            projection_date=projection_date,
        )

    def _calculate_montant_actuel(self, goal: Goal) -> float:
        """Calcule le montant actuel depuis la création de l'objectif."""
        if not goal.date_creation:
            return 0.0

        with db_transaction(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT COALESCE(SUM(montant), 0) as total
                FROM transactions
                WHERE categorie = ? AND date >= ?
                """,
                (goal.categorie, goal.date_creation.isoformat()),
            )
            result = cursor.fetchone()
            return float(result["total"]) if result else 0.0

    def _calculate_montant_mensuel(self, goal: Goal) -> float:
        """Calcule la moyenne mensuelle des 3 derniers mois."""
        if not goal.date_creation:
            return 0.0

        today = datetime.now().date()
        three_months_ago = today - relativedelta(months=3)
        start_of_month = today.replace(day=1)

        with db_transaction(self.db_path) as conn:
            cursor = conn.cursor()

            # Get transactions from the last 3 months
            cursor.execute(
                """
                SELECT COALESCE(SUM(montant), 0) as total, COUNT(DISTINCT strftime('%Y-%m', date)) as months
                FROM transactions
                WHERE categorie = ? AND date >= ?
                """,
                (goal.categorie, three_months_ago.isoformat()),
            )
            result = cursor.fetchone()

            if result and result["months"] > 0:
                return float(result["total"]) / result["months"]
            return 0.0


goal_repository = GoalRepository()
