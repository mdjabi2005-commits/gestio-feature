"""
Modèle de Récurrence
"""

from datetime import date
from typing import Optional, Literal

# noinspection PyUnresolvedReferences
from pydantic import BaseModel, Field, field_validator


class Recurrence(BaseModel):
    """
    Modèle représentant une transaction récurrente (abonnement, loyer, etc.)
    Correspond à la table 'recurrences'
    """

    id: Optional[int] = Field(None, description="ID unique de la récurrence")

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
    sous_categorie: Optional[str] = Field(None, description="Sous-catégorie optionnelle")

    montant: float = Field(..., gt=0, description="Montant de la récurrence")

    frequence: str = Field(..., description="Fréquence (Mensuel, Annuel, etc.)")

    date_debut: date = Field(..., description="Date de début de la récurrence")
    date_fin: Optional[date] = Field(None, description="Date de fin (si arrêtée)")

    description: Optional[str] = Field(None, description="Description ou notes")

    statut: str = Field("active", description="Statut (active, inactive, archivée)")

    date_creation: Optional[str] = Field(None, description="Date de création de l'enregistrement")
    date_modification: Optional[str] = Field(None, description="Date de dernière modification")

    @property
    def cout_annuel(self) -> float:
        """Calcule le coût annuel basé sur le montant et la fréquence."""
        multipliers = {
            'quotidien': 365, 'quotidienne': 365,
            'hebdomadaire': 52,
            'mensuel': 12, 'mensuelle': 12,
            'trimestriel': 4, 'trimestrielle': 4,
            'semestriel': 2, 'semestrielle': 2,
            'annuel': 1, 'annuelle': 1
        }
        multiplier = multipliers.get(self.frequence.lower(), 0)
        return self.montant * multiplier

    @property
    def cout_mensuel(self) -> float:
        """Calcule le coût mensuel ramené."""
        return self.cout_annuel / 12

    def generate_occurrences(self, end_date: date) -> list:
        """
        Génère les occurrences passées jusqu'à une date donnée.
        Inclut la première occurrence (date_debut).
        
        Args:
            end_date: Date limite de génération (ex: aujourd'hui)
            
        Returns:
            Liste de dicts représentant les transactions générées
        """
        from dateutil.relativedelta import relativedelta
        import logging

        occurrences = []
        current_date = self.date_debut

        # Si date_fin définie et passée, on s'arrête à date_fin
        limit_date = end_date
        if self.date_fin and self.date_fin < limit_date:
            limit_date = self.date_fin

        # Mapping fréquence -> relativedelta
        freq_map = {
            'mensuel': relativedelta(months=1),
            'mensuelle': relativedelta(months=1),
            'annuel': relativedelta(years=1),
            'annuelle': relativedelta(years=1),
            'hebdomadaire': relativedelta(weeks=1),
            'trimestriel': relativedelta(months=3),
            'trimestrielle': relativedelta(months=3),
        }

        delta = freq_map.get(self.frequence.lower())
        if not delta:
            logging.warning(f"Fréquence inconnue pour récurrence ID {self.id}: {self.frequence}")
            return []

        # Génération
        while current_date <= limit_date:
            occurrences.append({
                'date': current_date,
                'montant': self.montant,
                'type': self.type,
                'categorie': self.categorie,
                'sous_categorie': self.sous_categorie,
                'description': f"{self.description} (Récurrence)",
                'recurrence_id': self.id,
                'source': 'recurrence_generated'
            })
            current_date += delta

        return occurrences

    class Config:
        json_schema_extra = {
            "example": {
                "type": "Dépense",
                "categorie": "Loisir",
                "sous_categorie": "Streaming",
                "montant": 13.49,
                "frequence": "Mensuel",
                "date_debut": "2024-01-01",
                "description": "Netflix Premium",
                "statut": "active"
            }
        }
