"""
Service de gestion des pièces jointes.
Le fichier est retrouvé par recherche dans SORTED_DIR / REVENUS_TRAITES.
"""

import logging
import shutil
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from config.paths import SORTED_DIR, REVENUS_TRAITES
from ..database.model_attachment import TransactionAttachment
from ..database.repository_attachment import attachment_repository

logger = logging.getLogger(__name__)


class AttachmentService:

    def add_attachment(self, transaction_id: int, file_obj, filename: str,
                       category: str = "Autre", subcategory: str = "",
                       transaction_type: str = "Dépense") -> bool:
        """
        Sauvegarde le fichier dans le dossier organisé et enregistre les métadonnées en BDD.
        Accepte un chemin str/Path ou un UploadedFile Streamlit.
        """
        try:
            root_dir = Path(REVENUS_TRAITES) if transaction_type.lower() == "revenu" else Path(SORTED_DIR)
            target_dir = root_dir / self._sanitize(category)
            if subcategory and subcategory.strip():
                target_dir = target_dir / self._sanitize(subcategory)
            target_dir.mkdir(parents=True, exist_ok=True)

            unique_name = f"{int(datetime.now().timestamp())}_{self._sanitize_filename(filename)}"
            target_path = target_dir / unique_name

            if isinstance(file_obj, (str, Path)):
                src = Path(file_obj)
                if not src.exists():
                    logger.error(f"Fichier source introuvable: {file_obj}")
                    return False
                shutil.move(str(src), str(target_path))
            else:
                target_path.write_bytes(file_obj.read())  # type: ignore[union-attr]

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
            return False

        except Exception as e:
            logger.error(f"Erreur add_attachment: {e}")
            return False
    @staticmethod
    def find_file( file_name: str) -> Optional[Path]:
        """Cherche un fichier par son nom dans SORTED_DIR et REVENUS_TRAITES."""
        for root in (Path(SORTED_DIR), Path(REVENUS_TRAITES)):
            matches = list(root.rglob(file_name))
            if matches:
                return matches[0]
        return None
    @staticmethod
    def get_attachments( transaction_id: int) -> List[TransactionAttachment]:
        """Récupère les pièces jointes d'une transaction."""
        df = attachment_repository.get_all_attachments()
        if df.empty:
            return []
        filtered = df[df['transaction_id'] == transaction_id]
        return [
            TransactionAttachment(
                id=int(row['id']),
                transaction_id=int(row['transaction_id']),
                file_name=row['file_name'],
                file_path=row.get('file_path', ''),
                file_type=row.get('file_type'),
                upload_date=row['upload_date'],
            )
            for _, row in filtered.iterrows()
        ]

    def delete_attachment(self, attachment_id: int) -> bool:
        """Supprime la métadonnée en BDD et le fichier physique si trouvé."""
        try:
            df = attachment_repository.get_all_attachments()
            row = df[df['id'] == attachment_id]
            if row.empty:
                return False

            file_name = row.iloc[0]['file_name']

            if not attachment_repository.delete_attachment(attachment_id):
                return False

            physical = self.find_file(file_name)
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

    def get_file_content(self, attachment_id: int) -> Optional[bytes]:
        """Lit le contenu binaire d'une pièce jointe."""
        df = attachment_repository.get_all_attachments()
        row = df[df['id'] == attachment_id]
        if row.empty:
            return None
        physical = self.find_file(row.iloc[0]['file_name'])
        if physical and physical.exists():
            return physical.read_bytes()
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
