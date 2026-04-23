"""
Service de gestion des pièces jointes.
Le fichier est retrouvé par recherche dans SORTED_DIR / REVENUS_TRAITES.
"""

import logging
import shutil
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Any
import mimetypes

from backend.config.paths import SORTED_DIR, REVENUS_TRAITES, OBJECTIFS_DIR
from backend.domains.attachments.model import TransactionAttachment
from backend.domains.attachments.repository import attachment_repository

logger = logging.getLogger(__name__)


def _sanitize_name(name: str) -> str:
    """Nettoie un nom pour créer un nom de dossier valide."""
    if not name:
        return "Autre"
    return "".join(c for c in name if c.isalnum() or c in " ._-").strip()


def _sanitize_filename(name: str) -> str:
    """Nettoie un nom de fichier."""
    return "".join(c for c in name if c.isalnum() or c in "._-").strip()


def _save_file_to_dir(
    file_content: bytes, target_dir: Path, unique_name: str
) -> Optional[Path]:
    """Sauvegarde un fichier dans un répertoire."""
    try:
        target_dir.mkdir(parents=True, exist_ok=True)
        target_path = target_dir / unique_name
        target_path.write_bytes(file_content)
        return target_path
    except Exception as e:
        logger.error(f"Erreur sauvegarde fichier: {e}")
        return None


class AttachmentService:
    def add_attachment(
        self,
        file_content: bytes,
        filename: str,
        transaction_id: Optional[int] = None,
        echeance_id: Optional[int] = None,
        objectif_id: Optional[int] = None,
        category: str = "Autre",
        subcategory: str = "",
        transaction_type: str = "depense",
        nom_objectif: str = ""
    ) -> bool:
        """Sauvegarde le fichier et enregistre les métadonnées (unifié)."""
        try:
            if objectif_id is not None:
                target_dir = Path(OBJECTIFS_DIR) / _sanitize_name(nom_objectif)
                prefix = ""
            elif echeance_id is not None:
                target_dir = Path(SORTED_DIR) / "Echeances"
                prefix = f"echeance_{echeance_id}_"
            else:
                root_dir = (
                    Path(REVENUS_TRAITES)
                    if transaction_type.lower() == "revenu"
                    else Path(SORTED_DIR)
                )
                target_dir = root_dir / _sanitize_name(category)
                if subcategory and subcategory.strip():
                    target_dir = target_dir / _sanitize_name(subcategory)
                prefix = ""

            unique_name = f"{prefix}{int(datetime.now().timestamp())}_{_sanitize_filename(filename)}"
            target_path = _save_file_to_dir(file_content, target_dir, unique_name)

            if not target_path:
                return False

            attachment = TransactionAttachment(
                transaction_id=transaction_id,
                echeance_id=echeance_id,
                objectif_id=objectif_id,
                file_path=str(target_path),
            )
            new_id = attachment_repository.add_attachment(attachment)

            if new_id:
                logger.info(f"Attachment ajouté: {unique_name} (ID: {new_id})")
                return True

            if target_path.exists():
                target_path.unlink()
            return False

        except Exception as e:
            logger.error(f"Erreur add_attachment: {e}")
            return False

    def get_attachments(self, transaction_id: int) -> List[TransactionAttachment]:
        """Récupère les pièces jointes d'une transaction."""
        return attachment_repository.get_attachments_by_transaction(transaction_id)

    def delete_attachment(self, attachment_id: int) -> bool:
        """Supprime la métadonnée et le fichier physique."""
        try:
            attachment = attachment_repository.get_attachment_by_id(attachment_id)
            if not attachment:
                return False

            if not attachment_repository.delete_attachment(attachment_id):
                return False

            if attachment.file_path:
                physical = Path(attachment.file_path)
                if physical.exists():
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
        """Récupère le contenu binaire, nom et type MIME via le chemin direct."""
        attachment = attachment_repository.get_attachment_by_id(attachment_id)
        if not attachment or not attachment.file_path:
            return None

        physical = Path(attachment.file_path)
        if physical.exists():
            content = physical.read_bytes()
            mime_type, _ = mimetypes.guess_type(physical)
            return content, physical.name, mime_type or "application/octet-stream"

        return None




attachment_service = AttachmentService()


def archive_file(
    source_path: str,
    transaction: Any = None,
    is_ticket: bool = True,
    target_base_dir: str = None,
) -> Optional[str]:
    """
    Archive un fichier temporaire (ticket ou revenu) vers le dossier structuré.
    """
    if target_base_dir is None:
        target_base_dir = REVENUS_TRAITES if not is_ticket else SORTED_DIR

    try:
        import os

        # Utiliser la transaction fournie
        main_tx = transaction

        cat = getattr(main_tx, "categorie", "Autre") or "Autre"
        sub_cat = getattr(main_tx, "sous_categorie", "Divers") or "Divers"

        target_dir = os.path.join(target_base_dir, cat, sub_cat)
        os.makedirs(target_dir, exist_ok=True)

        original_name = os.path.basename(source_path)
        
        # Format spécifique pour les fiches de paie
        if not is_ticket and main_tx and hasattr(main_tx, "montant") and hasattr(main_tx, "date"):
            ext = os.path.splitext(original_name)[1]
            safe_date = str(main_tx.date).replace(" ", "_")
            original_name = f"{safe_date}_Salaire_{int(main_tx.montant)}€{ext}"
        else:
            prefixes = ["ocr_", "income_", "batch_"]
            for prefix in prefixes:
                if original_name.startswith(prefix):
                    original_name = original_name[len(prefix) :]
                    break

        target_path = os.path.join(target_dir, original_name)
        counter = 1
        while os.path.exists(target_path):
            name, ext = os.path.splitext(original_name)
            target_path = os.path.join(target_dir, f"{name}_{counter}{ext}")
            counter += 1

        shutil.copy2(source_path, target_path)
        logger.info(f"Fichier archivé: {target_path}")
        return target_path

    except Exception as e:
        logger.error(f"Erreur archivage fichier: {e}")
        return None
