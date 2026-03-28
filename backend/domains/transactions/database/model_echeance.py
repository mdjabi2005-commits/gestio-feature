"""
Modèle d'Échéance
Représente une transaction prévue (loyer, salaire, abonnement, etc.)
"""

from datetime import date
from typing import Optional, Literal

from pydantic import BaseModel, Field, field_validator, ConfigDict


class Echeance(BaseModel):
    """
    Modèle représentant une échéance (récurrente ou ponctuelle).
    Correspond à la table 'echeances'.
    """

    # ── Champs ──────────────────────────────────────────────
    id: Optional[int] = Field(None, description="ID unique")
    nom: str = Field(..., description="Nom (ex: Loyer, Netflix)")
    type: Literal["revenu", "depense"] = Field(..., description="Type")
    categorie: str = Field(..., description="Catégorie principale")
    sous_categorie: Optional[str] = Field(None, description="Sous-catégorie")
    montant: float = Field(..., gt=0, description="Montant")
    frequence: str = Field(..., description="Fréquence (mensuel, annuel, etc.)")
    date_debut: date = Field(..., description="Date de début")
    date_fin: Optional[date] = Field(None, description="Date de fin")
    description: Optional[str] = Field(None, description="Description ou notes")
    statut: str = Field("active", description="Statut (active, inactive)")
    type_echeance: str = Field("recurrente", description="Type (recurrente, ponctuelle)")
    objectif_id: Optional[int] = Field(None, description="ID de l'objectif lié")

    # ── Validators ──────────────────────────────────────────

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, v: str) -> str:
        if not isinstance(v, str):
            return v
        normalized = v.strip().lower()
        if normalized == "revenu" or normalized == "revenue":
            return "revenu"
        if normalized in {"depense", "dépense", "expense"}:
            return "depense"
        return v

    # ── Propriétés calculées ────────────────────────────────

    @property
    def cout_annuel(self) -> float:
        multipliers = {
            "quotidien": 365, "quotidienne": 365,
            "hebdomadaire": 52,
            "mensuel": 12, "mensuelle": 12,
            "trimestriel": 4, "trimestrielle": 4,
            "semestriel": 2, "semestrielle": 2,
            "annuel": 1, "annuelle": 1,
        }
        return self.montant * multipliers.get(self.frequence.lower(), 0)

    @property
    def cout_mensuel(self) -> float:
        return self.cout_annuel / 12

    # ── Config ──────────────────────────────────────────────

    model_config = ConfigDict(
        extra="ignore",
        json_schema_extra={
            "example": {
                "nom": "Netflix",
                "type": "depense",
                "categorie": "Loisirs",
                "sous_categorie": "Streaming",
                "montant": 13.49,
                "frequence": "mensuel",
                "date_debut": "2024-01-01",
                "description": "Netflix Premium",
                "statut": "active",
            }
        }
    )
