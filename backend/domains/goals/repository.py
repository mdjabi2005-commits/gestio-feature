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

    def update(self, goal_id: int, goal_data: dict) -> bool:
        """Met à jour un objectif existant."""
        if not goal_id:
            return False

        if 'date_debut' in goal_data and goal_data['date_debut']:
            goal_data['date_debut'] = goal_data['date_debut'].isoformat()
        if 'date_fin' in goal_data and goal_data['date_fin']:
            goal_data['date_fin'] = goal_data['date_fin'].isoformat()
        
        goal_data['date_modification'] = datetime.now().isoformat()
        
        # We need to invalidate cache in service, but service handles it now, or API will call it.
        # Actually API will call goal_service.invalidate_cache()
        return self.update_by_id(goal_id, goal_data)

    def get_montant_actuel(self, goal: Goal) -> float:
        """Calcule le montant actuel depuis le début de l'objectif (transactions réelles)."""
        start_date = goal.date_debut or goal.date_creation
        if not start_date:
            return 0.0

        from backend.domains.transactions.repository import transaction_repository
        
        result = transaction_repository.get_time_filtered(
            start_date=start_date,
            date_column="date",
            where="categorie = ?",
            params=(goal.categorie,),
            base_query="SELECT COALESCE(SUM(montant), 0) as total FROM transactions",
            raw=True,
            fetch_one=True
        )
        return float(result.get("total", 0.0)) if result else 0.0

    def get_montant_realise_pour_mois(self, categorie: str, current_date: date) -> float:
        """Récupère le montant total des transactions pour un mois donné."""
        from backend.domains.transactions.repository import transaction_repository
        
        result = transaction_repository.get_time_filtered(
            start_date=current_date,
            end_date=current_date + relativedelta(months=1),
            date_column="date",
            where="categorie = ?",
            params=(categorie,),
            base_query="SELECT COALESCE(SUM(montant), 0) as total FROM transactions",
            end_inclusive=False,
            raw=True,
            fetch_one=True
        )
        return float(result.get("total", 0.0)) if result else 0.0


goal_repository = GoalRepository()
