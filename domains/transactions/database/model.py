"""
Domaine Transactions - Modèle

Tous les types de transactions (OCR, CSV, Manuelles)
convergent vers ce modèle unique (clés en français).

Pydantic v2 assure la validation et la normalisation à l'instanciation.
Utiliser Transaction.model_validate(data) pour valider un dict.
Utiliser transaction.to_db_dict() pour obtenir le dict prêt pour la DB.
"""

from datetime import date as DateType
from typing import Optional, Any

from pydantic import BaseModel, Field, field_validator, model_validator

from .constants import (
    TYPE_DEPENSE,
    TYPE_REVENU,
    TRANSACTION_TYPES,
    SOURCE_DEFAULT,
    TRANSACTION_SOURCES,
)

DEFAULT_TYPE = TYPE_DEPENSE
DEFAULT_SOURCE = SOURCE_DEFAULT


class Transaction(BaseModel):
    """
    Modèle unique pour toutes les transactions.
    La validation et la normalisation sont assurées par Pydantic à l'instanciation.
    """

    # Champs obligatoires
    type: str = Field(..., description="Type (Dépense/Revenu/Transfert+/Transfert-)")
    date: DateType = Field(..., description="Date de la transaction")

    # Champs avec valeurs par défaut
    categorie: str = Field("Non catégorisé", description="Catégorie principale")
    montant: float = Field(..., description="Montant en euros", ge=0)

    # Champs optionnels
    sous_categorie: Optional[str] = Field(None, description="Sous-catégorie")
    description: Optional[str] = Field(None, description="Description libre")
    source: str = Field(DEFAULT_SOURCE, description="Source de la transaction")
    recurrence: Optional[str] = Field(None, description="Fréquence récurrence")
    date_fin: Optional[DateType] = Field(None, description="Date de fin")
    compte_iban: Optional[str] = Field(None, description="IBAN du compte")
    external_id: Optional[str] = Field(None, description="ID externe")
    id: Optional[int] = Field(None, description="ID (DB)")

    # ----------------------------------------------------------
    # VALIDATORS — normalisent les données à l'instanciation
    # ----------------------------------------------------------

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, v: Any) -> str:
        """Normalise les variantes de type (EN/FR, casse) vers la valeur canonique."""
        if not isinstance(v, str):
            raise ValueError(f"Type invalide: {v!r}")
        mapping = {
            "depense": TYPE_DEPENSE,
            "dépense": TYPE_DEPENSE,
            "expense": TYPE_DEPENSE,
            "revenu":  TYPE_REVENU,
            "income":  TYPE_REVENU,
        }
        normalized = mapping.get(v.strip().lower(), v.strip())
        if normalized not in TRANSACTION_TYPES:
            raise ValueError(
                f"Type '{normalized}' invalide. Valeurs acceptées : {TRANSACTION_TYPES}"
            )
        return normalized

    @field_validator("montant", mode="before")
    @classmethod
    def normalize_montant(cls, v: Any) -> float:
        """Convertit et force le montant en valeur absolue positive."""
        try:
            value = abs(float(v))
        except (ValueError, TypeError):
            raise ValueError(f"Montant invalide: {v!r}")
        if value < 0:
            raise ValueError("Le montant doit être positif ou nul")
        return round(value, 2)

    @field_validator("categorie", mode="before")
    @classmethod
    def normalize_categorie(cls, v: Any) -> str:
        """Normalise la catégorie en Title Case."""
        if not v or not str(v).strip():
            return "Autre"
        return str(v).strip().title()

    @field_validator("sous_categorie", "description", mode="before")
    @classmethod
    def empty_string_to_none(cls, v: Any) -> Optional[str]:
        """Convertit les chaînes vides en None."""
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        return str(v).strip()

    @field_validator("source", mode="before")
    @classmethod
    def normalize_source(cls, v: Any) -> str:
        """Normalise la source et applique la valeur par défaut si vide."""
        if not v or not str(v).strip():
            return DEFAULT_SOURCE
        normalized = str(v).strip().lower()
        if normalized not in TRANSACTION_SOURCES:
            # Source inconnue tolérée (pas bloquante) mais loguée
            return normalized
        return normalized

    @model_validator(mode="after")
    def validate_date_not_future(self) -> "Transaction":
        """Vérifie que la date n'est pas dans le futur."""
        from datetime import date as today_date
        if self.date and self.date > today_date.today():
            raise ValueError(f"La date {self.date} ne peut pas être dans le futur")
        return self

    # ----------------------------------------------------------
    # MÉTHODE DB — prépare le dict pour SQLite sans model_dump()
    # ----------------------------------------------------------

    def to_db_dict(self) -> dict:
        """
        Retourne un dict prêt pour l'insertion/mise à jour en base de données.
        Les données sont déjà normalisées par les validators.
        N'utilise pas model_dump() — accès direct aux attributs.
        """
        date_str = self.date.isoformat() if self.date else None
        date_fin_str = self.date_fin.isoformat() if self.date_fin else None

        return {
            "type":           self.type,
            "categorie":      self.categorie,
            "sous_categorie": self.sous_categorie,
            "description":    self.description,
            "montant":        self.montant,
            "date":           date_str,
            "source":         self.source,
            "recurrence":     self.recurrence,
            "date_fin":       date_fin_str,
            "compte_iban":    self.compte_iban,
            "external_id":    self.external_id,
        }

    model_config = {
        "json_schema_extra": {
            "example": {
                "type": "Dépense",
                "categorie": "Alimentation",
                "sous_categorie": "Restaurant",
                "montant": 42.50,
                "date": "2024-02-04",
                "description": "Déjeuner chez Pizza Hut",
                "source": "manual",
                "compte_iban": "FR761234...",
            }
        }
    }
