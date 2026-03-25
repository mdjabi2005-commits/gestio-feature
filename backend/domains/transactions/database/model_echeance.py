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

    id: Optional[int] = Field(None, description="ID unique de l'échéance")

    nom: str = Field(..., description="Nom de l'échéance (ex: Loyer, Netflix)")

    type: Literal["Revenu", "Dépense"] = Field(..., description="Type de transaction")

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, v: str) -> str:
        if not isinstance(v, str):
            return v
        normalized = v.strip().lower()
        if normalized == "revenu":
            return "Revenu"
        if normalized in {"depense", "dépense"}:
            return "Dépense"
        return v

    @classmethod
    def capitalize_type(cls, v: str) -> str:
        if isinstance(v, str):
            return v.capitalize()
        return v

    categorie: str = Field(..., description="Catégorie principale")
    sous_categorie: Optional[str] = Field(
        None, description="Sous-catégorie optionnelle"
    )

    montant: float = Field(..., gt=0, description="Montant de l'échéance")

    frequence: str = Field(..., description="Fréquence (mensuel, annuel, etc.)")

    date_prevue: date = Field(..., description="Prochaine date d'échéance")
    date_debut: date = Field(..., description="Date de début")
    date_fin: Optional[date] = Field(None, description="Date de fin (si arrêtée)")

    description: Optional[str] = Field(None, description="Description ou notes")

    statut: str = Field("active", description="Statut (active, inactive, expirée)")

    type_echeance: str = Field(
        "recurrente", description="Type (recurrente, ponctuelle)"
    )

    recurrence_id: Optional[str] = Field(None, description="ID source pour migration")

    date_creation: Optional[str] = Field(None, description="Date de création")
    date_modification: Optional[str] = Field(None, description="Date de modification")

    @property
    def cout_annuel(self) -> float:
        """Calcule le coût annuel basé sur le montant et la fréquence."""
        multipliers = {
            "quotidien": 365,
            "quotidienne": 365,
            "hebdomadaire": 52,
            "mensuel": 12,
            "mensuelle": 12,
            "trimestriel": 4,
            "trimestrielle": 4,
            "semestriel": 2,
            "semestrielle": 2,
            "annuel": 1,
            "annuelle": 1,
        }
        multiplier = multipliers.get(self.frequence.lower(), 0)
        return self.montant * multiplier

    @property
    def cout_mensuel(self) -> float:
        """Calcule le coût mensuel ramené."""
        return self.cout_annuel / 12

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "nom": "Netflix",
                "type": "Dépense",
                "categorie": "Loisir",
                "sous_categorie": "Streaming",
                "montant": 13.49,
                "frequence": "mensuel",
                "date_prevue": "2024-02-01",
                "date_debut": "2024-01-01",
                "description": "Netflix Premium",
                "statut": "active",
                "type_echeance": "recurrente",
            }
        }
    )
