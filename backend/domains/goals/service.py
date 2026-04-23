"""
Service pour les Goals - Logique métier des objectifs d'épargne
"""

import logging
from datetime import datetime
from typing import List, Optional
from dateutil.relativedelta import relativedelta

from backend.domains.budgets.service import load_salary_plan, SalaryPlanError
from backend.domains.goals.model import Goal, GoalWithProgress
from backend.domains.goals.repository import goal_repository

logger = logging.getLogger(__name__)


class GoalService:
    def __init__(self):
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

    def invalidate_cache(self):
        """Invalide le cache du plan de salaire."""
        self._salary_plan_cache = None

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
            months = max(1, months)
            montant_cible_calcule = round(montant_mensuel * months, 2)
        else:
            montant_cible_calcule = goal.montant_cible

        montant_actuel = goal_repository.get_montant_actuel(goal)

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

    def get_all_with_progress(self) -> List[GoalWithProgress]:
        """Récupère tous les objectifs avec leur progression."""
        goals = goal_repository.get_all()
        salary_plan = self._get_salary_plan()
        return [self._add_progress(goal, goals, salary_plan) for goal in goals]

    def get_by_id_with_progress(self, goal_id: int) -> Optional[GoalWithProgress]:
        """Récupère un objectif avec sa progression."""
        goal = goal_repository.get_by_id(goal_id)
        if goal:
            salary_plan = self._get_salary_plan()
            all_goals = goal_repository.get_all()
            return self._add_progress(goal, all_goals, salary_plan)
        return None

    def get_monthly_progress(self, goal_id: int) -> List[dict]:
        """Récupère la progression mensuelle théorique vs réelle d'un objectif."""
        goal = goal_repository.get_by_id(goal_id)
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

        while current_date <= end_date and current_date <= datetime.now().date():
            month_key = current_date.strftime("%Y-%m")
            cumulative_theoretical += montant_mensuel

            month_real = goal_repository.get_montant_realise_pour_mois(
                goal.categorie, current_date
            )
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


goal_service = GoalService()
