from fastapi import APIRouter, HTTPException, UploadFile, File, Response
from typing import List
from backend.domains.transactions.database.repository import TransactionRepository
from backend.domains.transactions.services.attachment_service import attachment_service
from backend.domains.transactions.database.model_attachment import TransactionAttachment

router = APIRouter(prefix="/api/attachments", tags=["attachments"])
transaction_repo = TransactionRepository()

@router.get("/transaction/{transaction_id}", response_model=List[TransactionAttachment])
async def list_attachments(transaction_id: int):
    """Liste les pièces jointes d'une transaction."""
    return attachment_service.get_attachments(transaction_id)

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
        transaction_type=transaction.type
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Erreur lors de la sauvegarde du fichier")
    
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
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )

@router.delete("/{attachment_id}")
async def delete_attachment(attachment_id: int):
    """Supprime une pièce jointe."""
    if not attachment_service.delete_attachment(attachment_id):
        raise HTTPException(status_code=500, detail="Erreur lors de la suppression")
    return {"message": "Supprimé avec succès"}
