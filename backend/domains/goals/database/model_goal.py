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
    montant_cible: float = Field(..., ge=0, description="Montant cible à atteindre")
    date_fin: Optional[date] = Field(
        None, description="Date finale pour atteindre l'objectif"
    )
    categorie: str = Field(..., description="Catégorie liée (depuis goals.yaml)")
    description: Optional[str] = Field(None, description="Description")
    statut: str = Field("active", description="Statut (active, completed, archived)")
    poids_allocation: float = Field(
        1.0, ge=0, description="Poids pour la répartition pondérée de l'épargne"
    )
    date_creation: Optional[date] = Field(None, description="Date de création")
    date_debut: Optional[date] = Field(
        None, description="Date de début de l'objectif (pour calcul)"
    )
    montant_mensuel: Optional[float] = Field(
        None, description="Montant mensuel théorique basé sur le salary plan"
    )

    model_config = ConfigDict(
        extra="ignore",
        json_schema_extra={
            "example": {
                "nom": "Vacances 2026",
                "montant_cible": 2000.0,
                "date_debut": "2026-01-01",
                "date_fin": "2026-12-31",
                "categorie": "ÉpargneVacances",
                "description": "Pour les vacances d'été 2026",
                "statut": "active",
                "poids_allocation": 50.0,
            }
        },
    )


class GoalWithProgress(Goal):
    """Goal avec métriques de progression"""

    montant_actuel: float = Field(
        0.0, description="Montant actuel cumulé depuis création (transactions réelles)"
    )
    progression_pourcentage: float = Field(
        0.0, description="Pourcentage de progression"
    )
    projection_date: Optional[date] = Field(None, description="Date estimée d'atteinte")
    montant_mensuel_calcule: Optional[float] = Field(
        None, description="Montant mensuel calculé depuis le salary plan"
    )

    model_config = ConfigDict(extra="ignore")
