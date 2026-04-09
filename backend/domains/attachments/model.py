"""Modèle pour les pièces jointes des transactions et échéances."""

from typing import Optional

from pydantic import BaseModel, Field


class TransactionAttachment(BaseModel):
    """Fichier attaché à une transaction ou une échéance."""

    id: Optional[int] = None
    transaction_id: Optional[int] = Field(
        None, description="ID de la transaction parente"
    )
    echeance_id: Optional[int] = Field(None, description="ID de l'échéance parente")
    objectif_id: Optional[int] = Field(None, description="ID de l'objectif parent")
    file_path: str = Field(..., description="Chemin de stockage local du fichier")
