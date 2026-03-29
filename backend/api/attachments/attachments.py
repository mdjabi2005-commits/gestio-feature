from fastapi import APIRouter, HTTPException, UploadFile, File, Response
from typing import List, Optional
import os
import shutil
import logging
from datetime import date as date_type
from backend.domains.transactions.database.model import Transaction
from backend.domains.transactions.database.repository import TransactionRepository
from backend.domains.transactions.database.repository_echeance import EcheanceRepository
from backend.domains.transactions.services.attachment_service import attachment_service
from backend.domains.transactions.database.model_attachment import TransactionAttachment

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/attachments", tags=["attachments"])
transaction_repo = TransactionRepository()
echeance_repo = EcheanceRepository()


@router.get("/transaction/{transaction_id}", response_model=List[TransactionAttachment])
async def list_attachments(transaction_id: int):
    """Liste les pièces jointes d'une transaction."""
    return attachment_service.get_attachments(transaction_id)


@router.get("/objectif/{objectif_id}", response_model=List[TransactionAttachment])
async def list_objectif_attachments(objectif_id: int):
    """Liste les pièces jointes d'un objectif."""
    from backend.domains.goals.database.repository_goal import goal_repository

    goal = goal_repository.get_by_id(objectif_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Objectif non trouvé")

    from backend.domains.transactions.database.repository_attachment import (
        AttachmentRepository,
    )

    repo = AttachmentRepository()
    return repo.get_attachments_by_objectif(objectif_id)


@router.get("/echeance/{echeance_id}", response_model=List[TransactionAttachment])
async def list_echeance_attachments(echeance_id: int):
    """Liste les pièces jointes d'une échéance."""
    from backend.domains.transactions.database.repository_attachment import (
        AttachmentRepository,
    )

    repo = AttachmentRepository()
    return repo.get_attachments_by_echeance(echeance_id)


@router.post("/echeance/{echeance_id}")
async def upload_echeance_attachment(echeance_id: int, file: UploadFile = File(...)):
    """Upload une pièce jointe pour une échéance."""
    from backend.domains.transactions.database.repository_attachment import (
        AttachmentRepository,
    )
    from datetime import datetime

    echeance = echeance_repo.get_by_id(echeance_id)
    if not echeance:
        raise HTTPException(status_code=404, detail="Échéance non trouvée")

    content = await file.read()
    filename = file.filename

    from pathlib import Path

    ext = Path(filename).suffix.lower()

    repo = AttachmentRepository()
    attachment = TransactionAttachment(
        echeance_id=echeance_id,
        file_name=filename,
        file_path="",
        file_type=ext,
        upload_date=datetime.now(),
    )

    success = attachment_service.add_attachment_to_echeance(
        echeance_id=echeance_id,
        file_content=content,
        filename=filename,
    )

    if not success:
        raise HTTPException(
            status_code=500, detail="Erreur lors de la sauvegarde du fichier"
        )

    return {"message": "Fichier téléchargé avec succès"}


@router.post("/transaction/{transaction_id}")
async def upload_attachment(transaction_id: int, file: UploadFile = File(...)):
    """Upload une pièce jointe pour une transaction."""
    transaction = transaction_repo.get_by_id(transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction non trouvée")

    content = await file.read()
    success = attachment_service.add_attachment(
        transaction_id=transaction_id,
        file_content=content,
        filename=file.filename,
        category=transaction.categorie,
        subcategory=transaction.sous_categorie or "",
        transaction_type=transaction.type,
    )

    if not success:
        raise HTTPException(
            status_code=500, detail="Erreur lors de la sauvegarde du fichier"
        )

    return {"message": "Fichier téléchargé avec succès"}


@router.post("/objectif/{objectif_id}")
async def upload_goal_attachment(objectif_id: int, file: UploadFile = File(...)):
    """Upload une pièce jointe pour un objectif spécifique."""
    from backend.domains.goals.database.repository_goal import goal_repository

    goal = goal_repository.get_by_id(objectif_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Objectif non trouvé")

    content = await file.read()
    success = attachment_service.add_attachment_to_objectif(
        objectif_id=objectif_id,
        nom_objectif=goal.nom,
        file_content=content,
        filename=file.filename,
    )

    if not success:
        raise HTTPException(
            status_code=500, detail="Erreur lors de la sauvegarde du fichier"
        )

    return {"message": "Fichier téléchargé avec succès"}


@router.get("/{attachment_id}")
async def view_attachment(attachment_id: int):
    """Visualise ou télécharge une pièce jointe."""
    result = attachment_service.get_file_content(attachment_id)
    if not result:
        raise HTTPException(status_code=404, detail="Pièce jointe non trouvée")

    content, filename, mime_type = result
    return Response(
        content=content,
        media_type=mime_type,
        headers={"Content-Disposition": f"inline; filename={filename}"},
    )


@router.delete("/{attachment_id}")
async def delete_attachment(attachment_id: int):
    """Supprime une pièce jointe."""
    if not attachment_service.delete_attachment(attachment_id):
        raise HTTPException(status_code=500, detail="Erreur lors de la suppression")
    return {"message": "Supprimé avec succès"}


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
        from backend.config.paths import SORTED_DIR, REVENUS_TRAITES

        target_base_dir = SORTED_DIR if is_ticket else REVENUS_TRAITES

    try:
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


def archive_payroll_file(
    temp_path: str, transactions: List[Transaction]
) -> Optional[str]:
    """Archive le fichier PDF de fiche de paie."""
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


def archive_ticket_file(
    temp_path: str, transaction: Transaction = None
) -> Optional[str]:
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
