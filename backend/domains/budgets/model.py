from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class Budget(BaseModel):
    id: Optional[int] = Field(None, description="ID (DB)")
    categorie: str = Field(..., description="Catégorie principale")
    montant_max: float = Field(..., description="Budget mensuel max", ge=0)
    date_creation: Optional[datetime] = Field(None, description="Date de création")

    def to_db_dict(self) -> dict:
        return {
            "categorie": self.categorie.strip().capitalize(),
            "montant_max": round(self.montant_max, 2),
            "date_creation": (self.date_creation or datetime.now()).isoformat(),
        }
