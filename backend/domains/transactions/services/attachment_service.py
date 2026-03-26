"""
Service de gestion des pièces jointes.
Le fichier est retrouvé par recherche dans SORTED_DIR / REVENUS_TRAITES.
"""

import logging
import shutil
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Any

from backend.config.paths import SORTED_DIR, REVENUS_TRAITES
from backend.domains.transactions.database.model_attachment import TransactionAttachment
from backend.domains.transactions.database.repository_attachment import (
    attachment_repository,
)

logger = logging.getLogger(__name__)


class AttachmentService:
    def add_attachment(
        self,
        transaction_id: int,
        file_content: bytes,
        filename: str,
        category: str = "Autre",
        subcategory: str = "",
        transaction_type: str = "Dépense",
    ) -> bool:
        """
        Sauvegarde le fichier dans le dossier organisé et enregistre les métadonnées en BDD.
        """
        try:
            root_dir = (
                Path(REVENUS_TRAITES)
                if transaction_type.lower() == "revenu"
                else Path(SORTED_DIR)
            )
            target_dir = root_dir / self._sanitize(category)
            if subcategory and subcategory.strip():
                target_dir = target_dir / self._sanitize(subcategory)
            target_dir.mkdir(parents=True, exist_ok=True)

            unique_name = (
                f"{int(datetime.now().timestamp())}_{self._sanitize_filename(filename)}"
            )
            target_path = target_dir / unique_name

            target_path.write_bytes(file_content)

            attachment = TransactionAttachment(
                transaction_id=transaction_id,
                file_name=unique_name,
                file_path=str(target_path),
                file_type=Path(filename).suffix.lower(),
            )
            new_id = attachment_repository.add_attachment(attachment)
            if new_id:
                logger.info(f"Attachment ajouté: {unique_name} (ID: {new_id})")
                return True
            logger.error("Echec DB, fichier sauvegardé mais orphelin")
            if target_path.exists():
                target_path.unlink()
            return False

        except Exception as e:
            logger.error(f"Erreur add_attachment: {e}")
            return False

    def add_attachment_to_echeance(
        self, echeance_id: int, file_content: bytes, filename: str
    ) -> bool:
        """
        Sauvegarde un fichier pour une échéance.
        """
        try:
            target_dir = Path(SORTED_DIR) / "Echeances"
            target_dir.mkdir(parents=True, exist_ok=True)

            unique_name = f"echeance_{echeance_id}_{int(datetime.now().timestamp())}_{self._sanitize_filename(filename)}"
            target_path = target_dir / unique_name

            target_path.write_bytes(file_content)

            attachment = TransactionAttachment(
                echeance_id=echeance_id,
                file_name=unique_name,
                file_path=str(target_path),
                file_type=Path(filename).suffix.lower(),
            )
            new_id = attachment_repository.add_attachment(attachment)
            if new_id:
                logger.info(f"Attachment échéance ajouté: {unique_name} (ID: {new_id})")
                return True
            logger.error("Echec DB, fichier sauvegardé mais orphelin")
            if target_path.exists():
                target_path.unlink()
            return False

        except Exception as e:
            logger.error(f"Erreur add_attachment_to_echeance: {e}")
            return False

    @staticmethod
    def find_file(file_name: str) -> Optional[Path]:
        """Cherche un fichier par son nom dans SORTED_DIR et REVENUS_TRAITES."""
        for root in (Path(SORTED_DIR), Path(REVENUS_TRAITES)):
            if not root.exists():
                continue
            matches = list(root.rglob(file_name))
            if matches:
                return matches[0]
        return None

    def get_attachments(self, transaction_id: int) -> List[TransactionAttachment]:
        """Récupère les pièces jointes d'une transaction."""
        return attachment_repository.get_attachments_by_transaction(transaction_id)

    def delete_attachment(self, attachment_id: int) -> bool:
        """Supprime la métadonnée en BDD et le fichier physique si trouvé."""
        try:
            attachment = attachment_repository.get_attachment_by_id(attachment_id)
            if not attachment:
                return False

            file_path = attachment.file_path

            if not attachment_repository.delete_attachment(attachment_id):
                return False

            if file_path:
                physical = Path(file_path)
                if not physical.exists():
                    # Fallback search by name
                    physical = self.find_file(attachment.file_name) or physical

                if physical and physical.exists():
                    try:
                        physical.unlink()
                        logger.info(f"Fichier physique supprimé: {physical}")
                    except Exception as e:
                        logger.warning(f"Impossible de supprimer {physical}: {e}")

            return True

        except Exception as e:
            logger.error(f"Erreur delete_attachment {attachment_id}: {e}")
            return False

    def get_file_content(self, attachment_id: int) -> Optional[tuple[bytes, str, str]]:
        """Récupère le contenu binaire, le nom du fichier et le type MIME."""
        attachment = attachment_repository.get_attachment_by_id(attachment_id)
        if not attachment:
            return None

        file_path = attachment.file_path
        physical = Path(file_path) if file_path else None

        if not (physical and physical.exists()):
            physical = self.find_file(attachment.file_name)

        if physical and physical.exists():
            content = physical.read_bytes()
            import mimetypes

            mime_type, _ = mimetypes.guess_type(physical)
            return (
                content,
                attachment.file_name,
                mime_type or "application/octet-stream",
            )

        return None

    @staticmethod
    def _sanitize(name: str) -> str:
        if not name:
            return "Autre"
        return "".join(c for c in name if c.isalnum() or c in " ._-").strip()

    @staticmethod
    def _sanitize_filename(name: str) -> str:
        return "".join(c for c in name if c.isalnum() or c in "._-").strip()


attachment_service = AttachmentService()
