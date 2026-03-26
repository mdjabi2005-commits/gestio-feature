"""
OCR API - Endpoint de scan de tickets

Expose le service OCR existant via REST pour le frontend React.
"""

import logging
import os
import shutil
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from backend.domains.transactions.ocr.services.ocr_service import get_ocr_service
from backend.domains.transactions.database.model import Transaction

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ocr", tags=["ocr"])

SUPPORTED_FORMATS = [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"]


class OCRScanResponse(BaseModel):
    transaction: Transaction
    warnings: List[str] = []
    raw_ocr_text: Optional[str] = None


class BatchScanResponse(BaseModel):
    results: List[OCRScanResponse]


@router.get("/warmup")
async def warmup_ocr():
    """Initialise le moteur OCR en arrière-plan pour gagner du temps."""
    try:
        get_ocr_service()
        return {"status": "ready"}
    except Exception as e:
        logger.error(f"Warmup error: {e}")
        return {"status": "error", "detail": str(e)}


@router.post("/scan", response_model=OCRScanResponse)
async def scan_ticket(file: UploadFile = File(...)):
    """
    Scan un ticket de caisse et retourne une Transaction pré-remplie.

    - **file**: Image du ticket (JPEG, PNG, BMP, TIFF, WEBP)
    - **transaction**: Transaction avec les données extraites
    - **warnings**: Liste des informations non extraites (montant, date, catégorie...)
    - **raw_ocr_text**: Texte brut OCR pour debug
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Format non supporté. Formats acceptés: {', '.join(SUPPORTED_FORMATS)}",
        )

    temp_path = f"tmp_{file.filename}"
    raw_text = ""

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        ocr_service = get_ocr_service()

        raw_text = ocr_service.ocr_engine.extract_text(temp_path)

        transaction = ocr_service.process_ticket(temp_path)

        warnings = []
        if transaction.montant == 0.0:
            warnings.append("montant non trouvé dans le ticket")
        if not transaction.date:
            warnings.append("date non trouvée dans le ticket")
        if not transaction.categorie or transaction.categorie == "Non catégorisé":
            warnings.append("catégorie non identifiée")
        if not transaction.sous_categorie:
            warnings.append("sous-catégorie non identifiée")

        return OCRScanResponse(
            transaction=transaction.model_dump(),
            warnings=warnings,
            raw_ocr_text=raw_text,
        )

    except Exception as e:
        logger.error(f"OCR scan error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Échec du scan: {str(e)}")

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.post("/scan-batch", response_model=BatchScanResponse)
async def scan_batch(files: List[UploadFile] = File(...)):
    """
    Scan plusieurs tickets en parallèle et retourne une liste de Transactions.
    """
    temp_files = []
    try:
        # 1. Sauvegarde temporaire
        for file in files:
            ext = os.path.splitext(file.filename)[1].lower()
            if ext not in SUPPORTED_FORMATS:
                continue

            temp_path = f"batch_{len(temp_files)}_{file.filename}"
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            temp_files.append(temp_path)

        if not temp_files:
            raise HTTPException(status_code=400, detail="Aucun fichier valide fourni")

        # 2. Appel au service batch (qui utilise le ThreadPoolExecutor)
        ocr_service = get_ocr_service()
        batch_results = ocr_service.process_batch_tickets(temp_files)

        # 3. Formatage de la réponse
        formatted_results = []
        for fname, transaction, error, elapsed in batch_results:
            if error:
                # On crée une transaction vide avec l'erreur en warning
                formatted_results.append(
                    OCRScanResponse(
                        transaction=Transaction(
                            type="Dépense",
                            categorie="Erreur",
                            montant=0,
                            date=date.today(),
                            description=f"Erreur sur {fname}",
                        ),
                        warnings=[f"Échec du scan: {error}"],
                        raw_ocr_text=None,
                    )
                )
            else:
                # Calcul des warnings
                warnings = []
                if transaction.montant == 0.0:
                    warnings.append("montant non trouvé")
                if (
                    not transaction.categorie
                    or transaction.categorie == "Non catégorisé"
                ):
                    warnings.append("catégorie non identifiée")

                formatted_results.append(
                    OCRScanResponse(
                        transaction=transaction,
                        warnings=warnings,
                        raw_ocr_text=None,  # On ne renvoie pas le raw_text pour le batch pour économiser la bande passante
                    )
                )

        return BatchScanResponse(results=formatted_results)

    except Exception as e:
        logger.error(f"Batch scan error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Échec du traitement par lot: {str(e)}"
        )

    finally:
        # Nettoyage
        for path in temp_files:
            if os.path.exists(path):
                os.remove(path)
