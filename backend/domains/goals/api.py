"""
API Goals - Endpoints pour les objectifs d'épargne
"""

import logging
from typing import List

from fastapi import APIRouter, HTTPException

from backend.domains.goals.model import Goal, GoalWithProgress
from backend.domains.goals.repository import goal_repository
from backend.domains.goals.service import goal_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/goals", tags=["goals"])


@router.get("/", response_model=List[GoalWithProgress])
async def get_goals():
    """Récupère tous les objectifs avec leur progression."""
    try:
        return goal_service.get_all_with_progress()
    except Exception as e:
        logger.error(f"Erreur get_goals: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{goal_id}", response_model=GoalWithProgress)
async def get_goal(goal_id: int):
    """Récupère un objectif par son ID avec sa progression."""
    try:
        goal = goal_service.get_by_id_with_progress(goal_id)
        if not goal:
            raise HTTPException(status_code=404, detail="Objectif non trouvé")
        return goal
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur get_goal: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=int)
async def create_goal(goal: Goal):
    """Crée un nouvel objectif."""
    try:
        goal_id = goal_repository.add(goal)
        if not goal_id:
            raise HTTPException(status_code=400, detail="Échec de la création")
        goal_service.invalidate_cache()
        return goal_id
    except Exception as e:
        logger.error(f"Erreur create_goal: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{goal_id}", response_model=GoalWithProgress)
async def update_goal(goal_id: int, goal: Goal):
    """Met à jour un objectif existant."""
    try:
        goal_data = goal.model_dump()
        success = goal_repository.update(goal_id, goal_data)
        if not success:
            raise HTTPException(status_code=404, detail="Objectif non trouvé")
        goal_service.invalidate_cache()
        updated_goal = goal_service.get_by_id_with_progress(goal_id)
        return updated_goal
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur update_goal: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{goal_id}")
async def delete_goal(goal_id: int):
    """Supprime un objectif."""
    try:
        success = goal_repository.delete(goal_id)
        if not success:
            raise HTTPException(status_code=404, detail="Objectif non trouvé")
        goal_service.invalidate_cache()
        return {"status": "success", "message": "Objectif supprimé"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur delete_goal: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{goal_id}/monthly-progress")
async def get_goal_monthly_progress(goal_id: int):
    """Récupère la progression mensuelle théorique vs réelle d'un objectif."""
    try:
        goal = goal_repository.get_by_id(goal_id)
        if not goal:
            raise HTTPException(status_code=404, detail="Objectif non trouvé")
        progress = goal_service.get_monthly_progress(goal_id)
        return progress
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur get_goal_monthly_progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))
