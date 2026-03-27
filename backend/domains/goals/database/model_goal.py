"""
Modèle Goal - Objectifs d'épargne
"""

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class Goal(BaseModel):
    """Objectif d'épargne"""

    id: Optional[int] = Field(None, description="ID unique")
    nom: str = Field(..., description="Nom de l'objectif")
    montant_cible: float = Field(..., gt=0, description="Montant cible à atteindre")
    date_echeance: Optional[date] = Field(
        None, description="Date limite pour atteindre l'objectif"
    )
    categorie: str = Field(..., description="Catégorie liée (depuis goals.yaml)")
    description: Optional[str] = Field(None, description="Description")
    statut: str = Field("active", description="Statut (active, completed, archived)")
    date_creation: Optional[date] = Field(None, description="Date de création")

    model_config = ConfigDict(
        extra="ignore",
        json_schema_extra={
            "example": {
                "nom": "Vacances 2026",
                "montant_cible": 2000.0,
                "date_echeance": "2026-12-31",
                "categorie": "ÉpargneVacances",
                "description": "Pour les vacances d'été 2026",
                "statut": "active",
            }
        },
    )


class GoalWithProgress(Goal):
    """Goal avec métriques de progression"""

    montant_actuel: float = Field(
        0.0, description="Montant actuel cumulé depuis création"
    )
    montant_mensuel: float = Field(
        0.0, description="Moyenne mensuelle des 3 derniers mois"
    )
    progression_pourcentage: float = Field(
        0.0, description="Pourcentage de progression"
    )
    projection_date: Optional[date] = Field(None, description="Date estimée d'atteinte")

    model_config = ConfigDict(extra="ignore")
