import logging
from typing import List, Optional

from backend.shared.database.base_repository import BaseRepository
from backend.domains.budgets.model import Budget
from sqlcipher3 import dbapi2 as sqlcipher

logger = logging.getLogger(__name__)


class BudgetRepository(BaseRepository[Budget]):
    table_name = "budgets"
    model_class = Budget

    def _get_insert_data(self, model: Budget) -> dict:
        return model.to_db_dict()

    def get_all(self) -> List[Budget]:
        # Surcharge pour inclure le tri par catégorie
        return super().get_all(order_by="categorie ASC")

    def get_by_category(self, categorie: str) -> Optional[Budget]:
        return self.get_one_where("categorie = ?", (categorie,))

    def upsert(self, budget: Budget) -> Optional[Budget]:
        try:
            existing = self.get_by_category(budget.categorie)
            if existing:
                success = self.update_by_id(
                    existing.id, {"montant_max": round(budget.montant_max, 2)}
                )
                if not success:
                    return None
            else:
                self.add(budget)
            return self.get_by_category(budget.categorie)
        except sqlcipher.Error as e:
            logger.error(f"Erreur upsert budget: {e}")
            return None


budget_repository = BudgetRepository()
