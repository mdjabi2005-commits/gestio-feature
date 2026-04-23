"""
OCR API - Endpoints de scan de tickets et fiches de paie.
"""

import logging
import os
from datetime import date as date_type
from typing import List

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from backend.domains.ocr.services.ocr_service import get_ocr_service
from backend.domains.transactions.model import Transaction
from backend.domains.ocr.core.pdfplumber_engine import pdfplumber_engine

from backend.config.ocr_config import get_ocr_config, save_ocr_config
from backend.domains.attachments.api import archive_file
from backend.shared.utils.file_utils import (
    validate_image_format,
    validate_pdf_format,
    save_upload_to_temp,
    TempFileManager,
)
from .models_api import (
    OCRScanResponse,
    BatchScanResponse,
    OCRConfigResponse,
    OCRConfigUpdate,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ocr", tags=["ocr"])

IMAGES = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}


@router.get("/config", response_model=OCRConfigResponse)
async def get_ocr_config_endpoint():
    """Récupère la clé API Groq."""
    from backend.config.ocr_config import get_ocr_config

    config = get_ocr_config()
    return OCRConfigResponse(api_key=config.get("api_key", ""))


@router.post("/config", response_model=OCRConfigResponse)
async def update_ocr_config_endpoint(config_data: OCRConfigUpdate):
    """Sauvegarde la clé API Groq."""
    try:
        config = save_ocr_config(config_data.api_key)
        return OCRConfigResponse(api_key=config.get("api_key", ""))
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.get("/warmup")
async def warmup_ocr():
    try:
        get_ocr_service()
        return {"status": "ready"}
    except Exception as e:
        logger.error(f"Warmup error: {e}")
        return {"status": "error", "detail": str(e)}


@router.post("/scan", response_model=OCRScanResponse)
async def scan_ticket(file: UploadFile = File(...)):
    if not validate_image_format(file.filename):
        raise HTTPException(400, f"Format non supporté. Acceptés: {', '.join(IMAGES)}")

    path = None
    try:
        path = await save_upload_to_temp(file, "ocr_")
        ocr = get_ocr_service()
        raw = ocr.ocr_engine.extract_text(path)
        tx = ocr.process_ticket(path)

        archived_path = archive_file(path, transaction=tx)

        return OCRScanResponse(
            transaction=tx,
            raw_ocr_text=raw,
            archived_path=archived_path,
        )
    except Exception as e:
        logger.error(f"OCR scan error: {e}", exc_info=True)
        raise HTTPException(500, f"Échec du scan: {str(e)}")
    finally:
        if path and os.path.exists(path):
            os.remove(path)


@router.post("/scan-batch", response_model=BatchScanResponse)
async def scan_batch(files: List[UploadFile] = File(...)):
    mgr = TempFileManager()
    try:
        paths = [
            await mgr.save_upload(f, "batch_")
            for f in files
            if validate_image_format(f.filename)
        ]
        if not paths:
            raise HTTPException(400, "Aucun fichier valide fourni")

        ocr = get_ocr_service()
        results = ocr.process_batch_tickets(paths)

        formatted = []
        for fname, tx, err, _ in results:
            if err:
                formatted.append(
                    OCRScanResponse(
                        transaction=Transaction(
                            type="depense",
                            categorie="Erreur",
                            sous_categorie="Autre",
                            montant=0,
                            date=date_type.today(),
                            description=f"Erreur sur {fname}",
                        ),
                        warnings=[f"Échec: {err}"],
                        raw_ocr_text=None,
                    )
                )
            else:
                formatted.append(
                    OCRScanResponse(transaction=tx, raw_ocr_text=None)
                )

        return BatchScanResponse(results=formatted)
    except Exception as e:
        logger.error(f"Batch scan error: {e}", exc_info=True)
        raise HTTPException(500, f"Échec du traitement par lot: {str(e)}")
    finally:
        mgr.cleanup()


@router.post("/scan-income", response_model=OCRScanResponse)
async def scan_income(file: UploadFile = File(...)):
    if not validate_pdf_format(file.filename):
        raise HTTPException(400, "Format non supporté. Acceptés: pdf")
    if not pdfplumber_engine or not pdfplumber_engine.PDFPLUMBER_AVAILABLE:
        raise HTTPException(500, "pdfplumber non installé: uv add pdfplumber")

    path = None
    try:
        path = await save_upload_to_temp(file, "income_")
        data = pdfplumber_engine.extract_payroll_data(path)
        net, pay_date, raw = data.get("net"), data.get("date"), data.get("raw_text", "")

        if not net or net <= 0:
            raise HTTPException(400, "Montant net non trouvé")
        date_str = pay_date.isoformat() if pay_date else date_type.today().isoformat()

        archived_path = archive_file(path, is_ticket=False)

        # On crée une seule transaction pour le salaire
        tx = Transaction(
            type="revenu",
            categorie="Salaire",
            sous_categorie="Mensuel",
            montant=net,
            date=date_str,
            description="Salaire",
            source="scan_income",
            has_attachments=bool(archived_path),
        )

        # Actual archiving with real tx
        final_archived_path = archive_file(path, transaction=tx, is_ticket=False)

        return OCRScanResponse(
            transaction=tx,
            raw_ocr_text=raw,
            archived_path=final_archived_path,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Income scan error: {e}", exc_info=True)
        raise HTTPException(500, f"Échec du scan: {str(e)}")
    finally:
        if path and os.path.exists(path):
            os.remove(path)


@router.post("/scan-pending", response_model=BatchScanResponse)
async def scan_pending_folder():
    """Déclenche manuellement le scan du dossier TO_SCAN_DIR."""
    from .watcher import trigger_scan

    try:
        results = trigger_scan()
        return BatchScanResponse(results=results)
    except Exception as e:
        logger.error(f"Error triggering scan: {e}")
        raise HTTPException(500, str(e))
