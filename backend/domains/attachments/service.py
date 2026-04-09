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

from backend.config import paths as paths_config
from backend.domains.attachments.model import TransactionAttachment
from backend.domains.attachments.repository import (
    attachment_repository,
)

logger = logging.getLogger(__name__)


def _get_sorted_dir() -> str:
    """Retourne le chemin SORTED_DIR de manière dynamique."""
    return paths_config.SORTED_DIR


def _get_revenus_traites() -> str:
    """Retourne le chemin REVENUS_TRAITES de manière dynamique."""
    return paths_config.REVENUS_TRAITES


def _get_objectifs_dir() -> str:
    """Retourne le chemin OBJECTIFS_DIR de manière dynamique."""
    return paths_config.OBJECTIFS_DIR


def _sanitize_name(name: str) -> str:
    """Nettoie un nom pour créer un nom de dossier valide."""
    if not name:
        return "Autre"
    return "".join(c for c in name if c.isalnum() or c in " ._-").strip()


def _sanitize_filename(name: str) -> str:
    """Nettoie un nom de fichier."""
    return "".join(c for c in name if c.isalnum() or c in "._-").strip()


def _find_file_in_dirs(file_name: str) -> Optional[Path]:
    """Cherche un fichier par son nom dans les répertoires."""
    for root in (Path(_get_sorted_dir()), Path(_get_revenus_traites())):
        if not root.exists():
            continue
        matches = list(root.rglob(file_name))
        if matches:
            return matches[0]
    return None


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
        transaction_id: int,
        file_content: bytes,
        filename: str,
        category: str = "Autre",
        subcategory: str = "",
        transaction_type: str = "depense",
    ) -> bool:
        """Sauvegarde le fichier et enregistre les métadonnées."""
        try:
            root_dir = (
                Path(_get_revenus_traites())
                if transaction_type.lower() == "revenu"
                else Path(_get_sorted_dir())
            )
            target_dir = root_dir / _sanitize_name(category)
            if subcategory and subcategory.strip():
                target_dir = target_dir / _sanitize_name(subcategory)

            unique_name = (
                f"{int(datetime.now().timestamp())}_{_sanitize_filename(filename)}"
            )
            target_path = _save_file_to_dir(file_content, target_dir, unique_name)

            if not target_path:
                return False

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

            if target_path.exists():
                target_path.unlink()
            return False

        except Exception as e:
            logger.error(f"Erreur add_attachment: {e}")
            return False

    def add_attachment_to_echeance(
        self, echeance_id: int, file_content: bytes, filename: str
    ) -> bool:
        """Sauvegarde un fichier pour une échéance."""
        try:
            target_dir = Path(_get_sorted_dir()) / "Echeances"
            unique_name = f"echeance_{echeance_id}_{int(datetime.now().timestamp())}_{_sanitize_filename(filename)}"
            target_path = _save_file_to_dir(file_content, target_dir, unique_name)

            if not target_path:
                return False

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

            if target_path.exists():
                target_path.unlink()
            return False

        except Exception as e:
            logger.error(f"Erreur add_attachment_to_echeance: {e}")
            return False

    def add_attachment_to_objectif(
        self, objectif_id: int, nom_objectif: str, file_content: bytes, filename: str
    ) -> bool:
        """Sauvegarde un fichier pour un objectif."""
        try:
            target_dir = Path(_get_objectifs_dir()) / _sanitize_name(nom_objectif)
            unique_name = (
                f"{int(datetime.now().timestamp())}_{_sanitize_filename(filename)}"
            )
            target_path = _save_file_to_dir(file_content, target_dir, unique_name)

            if not target_path:
                return False

            attachment = TransactionAttachment(
                objectif_id=objectif_id,
                file_path=str(target_path),
            )
            new_id = attachment_repository.add_attachment(attachment)

            if new_id:
                logger.info(f"Attachment objectif ajouté: {unique_name} (ID: {new_id})")
                return True

            if target_path.exists():
                target_path.unlink()
            return False

        except Exception as e:
            logger.error(f"Erreur add_attachment_to_objectif: {e}")
            return False

    def find_file(self, file_name: str) -> Optional[Path]:
        """Cherche un fichier par son nom."""
        return _find_file_in_dirs(file_name)

    def get_attachments(self, transaction_id: int) -> List[TransactionAttachment]:
        """Récupère les pièces jointes d'une transaction."""
        return attachment_repository.get_attachments_by_transaction(transaction_id)

    def delete_attachment(self, attachment_id: int) -> bool:
        """Supprime la métadonnée et le fichier physique."""
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
        """Récupère le contenu binaire, nom et type MIME."""
        attachment = attachment_repository.get_attachment_by_id(attachment_id)
        if not attachment:
            return None

        file_path = attachment.file_path
        physical = Path(file_path) if file_path else None
        file_name = Path(file_path).name if file_path else "unknown"

        if not (physical and physical.exists()):
            physical = self.find_file(file_name)

        if physical and physical.exists():
            content = physical.read_bytes()
            mime_type, _ = mimetypes.guess_type(physical)
            return content, file_name, mime_type or "application/octet-stream"

        return None

    def archive_income_file(
        self, temp_path: str, category: str, date_str: str, net_amount: float
    ) -> Optional[str]:
        """Archive un fichier de revenu."""
        try:
            root_dir = Path(_get_revenus_traites())
            target_dir = root_dir / _sanitize_name(category)
            target_dir.mkdir(parents=True, exist_ok=True)

            ext = Path(temp_path).suffix.lower()
            safe_date = _sanitize_name(date_str).replace(" ", "_")
            filename = f"{safe_date}_Salaire_{int(net_amount)}€{ext}"
            target_path = target_dir / filename

            if target_path.exists():
                filename = f"{safe_date}_Salaire_{int(net_amount)}€_{int(datetime.now().timestamp())}{ext}"
                target_path = target_dir / filename

            shutil.copy2(temp_path, target_path)
            logger.info(f"Fiche de paie archivée : {target_path}")
            return str(target_path)

        except Exception as e:
            logger.error(f"Erreur archive_income_file: {e}")
            return None


attachment_service = AttachmentService()


def archive_file(
    source_path: str,
    category: str,
    sub_category: str = None,
    target_base_dir: str = None,
    is_ticket: bool = True,
) -> Optional[str]:
    """
    Archive un fichier (ticket ou revenu) vers le dossier structuré.
    """
    if target_base_dir is None:
        target_base_dir = _get_revenus_traites() if not is_ticket else _get_sorted_dir()

    try:
        import os

        sub_cat = sub_category or "Divers"
        cat = category or "Autre"

        target_dir = os.path.join(target_base_dir, cat, sub_cat)
        os.makedirs(target_dir, exist_ok=True)

        original_name = os.path.basename(source_path)
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


def archive_payroll_file(temp_path: str, transactions: List[Any]) -> Optional[str]:
    """Archive le fichier PDF de fiche de paie."""
    from backend.domains.transactions.model import Transaction

    if not transactions:
        return None

    dominant_tx = max(transactions, key=lambda t: t.montant)
    return archive_file(
        temp_path,
        category=dominant_tx.categorie or "Épargne",
        sub_category=dominant_tx.sous_categorie,
        target_base_dir=None,
        is_ticket=False,
    )


def archive_ticket_file(temp_path: str, transaction: Any = None) -> Optional[str]:
    """Archive le fichier de ticket image."""
    if transaction is None:
        return None

    return archive_file(
        temp_path,
        category=transaction.categorie or "Autre",
        sub_category=transaction.sous_categorie,
        target_base_dir=None,
        is_ticket=True,
    )
