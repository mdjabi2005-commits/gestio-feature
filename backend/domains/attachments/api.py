from fastapi import APIRouter, HTTPException, UploadFile, File, Response
from typing import List, Optional
import logging
from datetime import date as date_type
from backend.domains.transactions.model import Transaction
from backend.domains.transactions.repository import TransactionRepository
from backend.domains.echeance.repository import EcheanceRepository
from backend.domains.attachments.service import (
    attachment_service,
    archive_file,
)
from backend.domains.attachments.model import TransactionAttachment
from backend.domains.goals.repository import goal_repository

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
    from backend.domains.attachments.repository import (
        AttachmentRepository,
    )

    goal = goal_repository.get_by_id(objectif_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Objectif non trouvé")

    repo = AttachmentRepository()
    return repo.get_attachments_by_objectif(objectif_id)


@router.get("/echeance/{echeance_id}", response_model=List[TransactionAttachment])
async def list_echeance_attachments(echeance_id: int):
    """Liste les pièces jointes d'une échéance."""
    from backend.domains.attachments.repository import (
        AttachmentRepository,
    )

    repo = AttachmentRepository()
    return repo.get_attachments_by_echeance(echeance_id)


@router.post("/echeance/{echeance_id}")
async def upload_echeance_attachment(echeance_id: int, file: UploadFile = File(...)):
    """Upload une pièce jointe pour une échéance."""
    from datetime import datetime
    from pathlib import Path

    echeance = echeance_repo.get_by_id(echeance_id)
    if not echeance:
        raise HTTPException(status_code=404, detail="Échéance non trouvée")

    content = await file.read()
    filename = file.filename

    ext = Path(filename).suffix.lower()

    success = attachment_service.add_attachment(
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
    goal = goal_repository.get_by_id(objectif_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Objectif non trouvé")

    content = await file.read()
    success = attachment_service.add_attachment(
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
