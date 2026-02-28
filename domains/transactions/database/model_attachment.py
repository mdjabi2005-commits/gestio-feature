"""
Modèle pour les pièces jointes des transactions.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TransactionAttachment(BaseModel):
    """Fichier attaché à une transaction."""

    id: Optional[int] = None
    transaction_id: int = Field(..., description="ID de la transaction parente")
    file_name: str = Field(..., description="Nom original du fichier")
    file_type: Optional[str] = Field(None, description="Extension du fichier")
    upload_date: datetime = Field(default_factory=datetime.now)
