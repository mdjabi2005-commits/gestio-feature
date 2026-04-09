"""
Repository pour les Goals - Objectifs d'épargne
"""

import logging
from datetime import date, datetime
from typing import List, Optional
from dateutil.relativedelta import relativedelta

from sqlcipher3 import dbapi2 as sqlcipher

from backend.shared.database import db_transaction
from backend.shared.database.base_repository import BaseRepository
from backend.domains.budgets.service import (
    load_salary_plan,
    SalaryPlanError,
)
from backend.domains.goals.model import Goal, GoalWithProgress

logger = logging.getLogger(__name__)


class GoalRepository(BaseRepository[Goal]):
    table_name = "goals"
    model_class = Goal

    def __init__(self, db_path: str = None):
        super().__init__(db_path)
        self._salary_plan_cache = None

    def _get_salary_plan(self) -> dict:
        """Récupère le salary plan (avec cache)."""
        if self._salary_plan_cache is None:
            try:
                self._salary_plan_cache = load_salary_plan()
            except SalaryPlanError as e:
                logger.warning(f"Salary plan non disponible: {e}")
                self._salary_plan_cache = {
                    "reference_salary": 0,
                    "allocations": [],
                    "default_remainder_category": "Épargne",
                }
        return self._salary_plan_cache

    def _get_insert_data(self, goal: Goal) -> dict:
        """Sérialise en excluant l'ID et formatant les dates."""
        d = goal.model_dump(exclude={'id'})
        if d.get('date_debut'): d['date_debut'] = d['date_debut'].isoformat()
        if d.get('date_fin'): d['date_fin'] = d['date_fin'].isoformat()
        if d.get('date_creation'):
            d['date_creation'] = d['date_creation'].isoformat()
        else:
            d['date_creation'] = datetime.now().date().isoformat()
        return d

    def get_all(self) -> List[Goal]:
        """Récupère tous les objectifs non archivés."""
        return self.get_where("statut != 'archived'", order_by="date_creation DESC")

    def get_all_with_progress(self) -> List[GoalWithProgress]:
        """Récupère tous les objectifs avec leur progression."""
        goals = self.get_all()
        salary_plan = self._get_salary_plan()
        return [self._add_progress(goal, goals, salary_plan) for goal in goals]

    def get_by_id_with_progress(self, goal_id: int) -> Optional[GoalWithProgress]:
        """Récupère un objectif avec sa progression."""
        goal = self.get_by_id(goal_id)
        if goal:
            salary_plan = self._get_salary_plan()
            all_goals = self.get_all()
            return self._add_progress(goal, all_goals, salary_plan)
        return None

    def update(self, goal_id: int, goal_data: dict) -> bool:
        """Met à jour un objectif existant."""
        if not goal_id:
            return False

        # Format dates
        if 'date_debut' in goal_data and goal_data['date_debut']:
            goal_data['date_debut'] = goal_data['date_debut'].isoformat()
        if 'date_fin' in goal_data and goal_data['date_fin']:
            goal_data['date_fin'] = goal_data['date_fin'].isoformat()
        
        goal_data['date_modification'] = datetime.now().isoformat()

        success = self.update_by_id(goal_id, goal_data)
        if success:
            self._salary_plan_cache = None
        return success

    def delete(self, goal_id: int, conn: Optional[sqlcipher.Connection] = None) -> bool:
        """Supprime un objectif et vide le cache."""
        success = super().delete(goal_id, conn=conn)
        if success:
            self._salary_plan_cache = None
        return success

    def _calculate_epargne_mensuelle(self, salary_plan: dict) -> float:
        """Calcule l'enveloppe d'épargne mensuelle depuis le salary plan."""
        reference = salary_plan.get("reference_salary", 0)
        if reference <= 0:
            return 0.0

        allocations = salary_plan.get("allocations", [])
        total_percent = sum(
            a.get("value", 0) for a in allocations if a.get("type") == "percent"
        )

        epargne_percent = max(0, 100 - total_percent)
        return round(reference * epargne_percent / 100, 2)

    def _calculate_weights(self, goals: List[Goal]) -> dict:
        """Calcule les poids normalisés pour chaque objectif."""
        active_goals = [g for g in goals if g.statut != "archived"]
        if not active_goals:
            return {}

        total_weights = sum(g.poids_allocation for g in active_goals)
        if total_weights <= 0:
            total_weights = len(active_goals)

        weights = {}
        for goal in active_goals:
            weights[goal.id] = goal.poids_allocation / total_weights

        return weights

    def _add_progress(
        self, goal: Goal, all_goals: List[Goal], salary_plan: dict
    ) -> GoalWithProgress:
        """Calcule les métriques de progression pour un objectif."""
        today = datetime.now().date()

        epargne_mensuelle = self._calculate_epargne_mensuelle(salary_plan)

        if goal.poids_allocation and goal.poids_allocation > 100:
            logger.warning(
                f"Goal {goal.id}: poids_allocation={goal.poids_allocation}% > 100%"
            )

        if goal.date_debut and goal.date_fin and goal.date_debut > goal.date_fin:
            logger.warning(
                f"Goal {goal.id}: date_debut ({goal.date_debut}) > date_fin ({goal.date_fin})"
            )

        start_date = goal.date_debut or goal.date_creation

        montant_mensuel = round(
            epargne_mensuelle * (goal.poids_allocation or 0) / 100, 2
        )

        if goal.date_fin and start_date:
            months = (goal.date_fin.year - start_date.year) * 12 + (
                goal.date_fin.month - start_date.month
            )
            # Ensure safe handling if dates are strings (they shouldn't be since Pydantic parses them)
            months = max(1, months)
            montant_cible_calcule = round(montant_mensuel * months, 2)
        else:
            montant_cible_calcule = goal.montant_cible

        montant_actuel = self._calculate_montant_actuel(goal)

        progression = (
            (montant_actuel / montant_cible_calcule * 100)
            if montant_cible_calcule > 0
            else 0.0
        )

        projection_date = None
        if montant_mensuel > 0 and montant_cible_calcule > montant_actuel:
            remaining = montant_cible_calcule - montant_actuel
            months_needed = remaining / montant_mensuel
            projection_date = today + relativedelta(months=int(months_needed))

        return GoalWithProgress(
            **goal.model_dump(exclude={"montant_cible", "montant_mensuel"}),
            montant_actuel=round(montant_actuel, 2),
            montant_cible=montant_cible_calcule,
            progression_pourcentage=round(progression, 1),
            projection_date=projection_date,
            montant_mensuel=montant_mensuel,
            montant_mensuel_calcule=montant_mensuel,
        )

    def _calculate_montant_actuel(self, goal: Goal) -> float:
        """Calcule le montant actuel depuis le début de l'objectif (transactions réelles)."""
        start_date = goal.date_debut or goal.date_creation
        if not start_date:
            return 0.0

        with db_transaction(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT COALESCE(SUM(montant), 0) as total
                FROM transactions
                WHERE categorie = ? AND date >= ?
                """,
                (goal.categorie, start_date.isoformat() if hasattr(start_date, 'isoformat') else start_date),
            )
            result = cursor.fetchone()
            return float(result["total"]) if result else 0.0

    def get_monthly_progress(self, goal_id: int) -> List[dict]:
        """Récupère la progression mensuelle théorique vs réelle d'un objectif."""
        goal = self.get_by_id(goal_id)
        if not goal:
            return []

        salary_plan = self._get_salary_plan()
        epargne_mensuelle = self._calculate_epargne_mensuelle(salary_plan)
        montant_mensuel = round(
            epargne_mensuelle * (goal.poids_allocation or 0) / 100, 2
        )

        start_date = goal.date_debut or goal.date_creation
        if not start_date:
            return []

        end_date = goal.date_fin or (start_date + relativedelta(months=12))

        months = []
        current_date = start_date
        cumulative_theoretical = 0.0
        cumulative_real = 0.0

        with db_transaction(self.db_path) as conn:
            cursor = conn.cursor()
            while current_date <= end_date and current_date <= datetime.now().date():
                month_key = current_date.strftime("%Y-%m")

                cumulative_theoretical += montant_mensuel

                cursor.execute(
                    """
                    SELECT COALESCE(SUM(montant), 0) as total
                    FROM transactions
                    WHERE categorie = ? AND date >= ? AND date < ?
                    """,
                    (
                        goal.categorie,
                        start_date.isoformat() if hasattr(start_date, 'isoformat') else start_date,
                        (current_date + relativedelta(months=1)).isoformat(),
                    ),
                )
                result = cursor.fetchone()
                month_real = float(result["total"]) if result else 0.0
                cumulative_real += month_real

                months.append(
                    {
                        "month": month_key,
                        "theoretical": round(cumulative_theoretical, 2),
                        "real": round(cumulative_real, 2),
                    }
                )

                current_date += relativedelta(months=1)

        return months


goal_repository = GoalRepository()
