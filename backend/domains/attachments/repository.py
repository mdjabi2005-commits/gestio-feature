"""
Repository pour les pièces jointes des transactions.
"""

import logging
from typing import List, Optional

from sqlcipher3 import dbapi2 as sqlcipher

from backend.shared.database.base_repository import BaseRepository
from backend.domains.attachments.model import TransactionAttachment

logger = logging.getLogger(__name__)


class AttachmentRepository(BaseRepository[TransactionAttachment]):
    table_name = "transaction_attachments"
    model_class = TransactionAttachment

    def get_attachments_by_transaction(
        self, transaction_id: int
    ) -> List[TransactionAttachment]:
        return self.get_where("transaction_id = ?", (transaction_id,))

    def get_attachments_by_echeance(
        self, echeance_id: int
    ) -> List[TransactionAttachment]:
        return self.get_where("echeance_id = ?", (echeance_id,))

    def get_attachments_by_objectif(
        self, objectif_id: int
    ) -> List[TransactionAttachment]:
        return self.get_where("objectif_id = ?", (objectif_id,))

    # Alias de compatibilité
    def get_attachment_by_id(
        self, attachment_id: int
    ) -> Optional[TransactionAttachment]:
        return self.get_by_id(attachment_id)

    # Alias de compatibilité supportant conn
    def add_attachment(
        self, attachment: TransactionAttachment, conn: Optional[sqlcipher.Connection] = None
    ) -> Optional[int]:
        return self.add(attachment, conn=conn)

    # Alias de compatibilité
    def delete_attachment(self, attachment_id: int) -> bool:
        return self.delete(attachment_id)


attachment_repository = AttachmentRepository()
