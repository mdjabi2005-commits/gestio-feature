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
    La validation et la normalisation sont assurées par Pydantic.
    """

    # ── Champs obligatoires ─────────────────────────────────
    type: str = Field(..., description="Type (Dépense/Revenu)")
    date: DateType = Field(..., description="Date de la transaction")
    categorie: str = Field("Non catégorisé", description="Catégorie principale")
    montant: float = Field(..., description="Montant en euros", ge=0)

    # ── Champs optionnels ───────────────────────────────────
    id: Optional[int] = Field(None, description="ID (DB)")
    sous_categorie: Optional[str] = Field(None, description="Sous-catégorie")
    description: Optional[str] = Field(None, description="Description libre")
    source: str = Field(DEFAULT_SOURCE, description="Source de la transaction")
    date_fin: Optional[DateType] = Field(None, description="Date de fin")
    external_id: Optional[str] = Field(None, description="ID externe")
    echeance_id: Optional[int] = Field(None, description="ID de l'échéance liée")
    compte_id: Optional[int] = Field(None, description="ID du compte")
    has_attachments: bool = Field(False, description="Indicateur pièces jointes")
    attachment: Optional[str] = Field(
        None, description="Chemin de la pièce jointe principale"
    )

    # ── Validators ──────────────────────────────────────────

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, v: Any) -> str:
        if not isinstance(v, str):
            raise ValueError(f"Type invalide: {v!r}")
        mapping = {
            "depense": TYPE_DEPENSE,
            "dépense": TYPE_DEPENSE,
            "expense": TYPE_DEPENSE,
            "revenu": TYPE_REVENU,
            "income": TYPE_REVENU,
        }
        normalized = mapping.get(v.strip().lower(), v.strip())
        if normalized not in TRANSACTION_TYPES:
            raise ValueError(
                f"Type '{normalized}' invalide. Acceptés : {TRANSACTION_TYPES}"
            )
        return normalized

    @field_validator("montant", mode="before")
    @classmethod
    def normalize_montant(cls, v: Any) -> float:
        try:
            value = abs(float(v))
        except (ValueError, TypeError):
            raise ValueError(f"Montant invalide: {v!r}")
        return round(value, 2)

    @field_validator("categorie", mode="before")
    @classmethod
    def normalize_categorie(cls, v: Any) -> str:
        if not v or not str(v).strip():
            return "Autre"
        return str(v).strip().capitalize()

    @field_validator("sous_categorie", "description", "date_fin", mode="before")
    @classmethod
    def empty_string_to_none(cls, v: Any) -> Optional[str]:
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        return str(v).strip()

    @field_validator("has_attachments", mode="before")
    @classmethod
    def normalize_has_attachments(cls, v: Any) -> bool:
        return bool(v)

    @field_validator("source", mode="before")
    @classmethod
    def normalize_source(cls, v: Any) -> str:
        if not v or not str(v).strip():
            return DEFAULT_SOURCE
        normalized = str(v).strip().lower()
        if normalized not in TRANSACTION_SOURCES:
            return normalized
        return normalized

    @model_validator(mode="after")
    def validate_date_not_future(self) -> "Transaction":
        import logging
        from datetime import date as today_date

        if self.date and self.date > today_date.today():
            logging.getLogger(__name__).warning(
                f"Transaction avec date future: {self.date} (autorisé pour les échéances)"
            )
        return self

    # ── Méthode DB ──────────────────────────────────────────

    def to_db_dict(self) -> dict:
        """Dict prêt pour l'insertion/mise à jour en base de données."""
        return {
            "type": self.type,
            "categorie": self.categorie,
            "sous_categorie": self.sous_categorie,
            "description": self.description,
            "montant": self.montant,
            "date": self.date.isoformat() if self.date else None,
            "source": self.source,
            "date_fin": self.date_fin.isoformat() if self.date_fin else None,
            "external_id": self.external_id,
            "echeance_id": self.echeance_id,
            "compte_id": self.compte_id,
            "attachment": self.attachment,
        }

    # ── Config ──────────────────────────────────────────────

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
            }
        }
    }
