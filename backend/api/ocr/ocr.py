"""
OCR API - Endpoints de scan de tickets et fiches de paie.
"""

import logging
import os
from datetime import date as date_type
from typing import List

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from backend.domains.transactions.ocr.services.ocr_service import get_ocr_service
from backend.domains.transactions.database.model import Transaction
from backend.domains.transactions.ocr.core.pdfplumber_engine import pdfplumber_engine
from backend.domains.transactions.services.salary_plan_service import (
    SalaryPlanError,
    apply_salary_split,
)
from backend.config.ocr_config import get_ocr_config, save_ocr_config
from backend.api.attachments.attachments import archive_ticket_file, archive_payroll_file
from backend.shared.utils.file_utils import (
    validate_image_format,
    validate_pdf_format,
    save_upload_to_temp,
    TempFileManager,
)
from .models import (
    OCRScanResponse,
    BatchScanResponse,
    IncomeSplitDTO,
    IncomeScanResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ocr", tags=["ocr"])

IMAGES = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}


def _tx_warnings(t: Transaction) -> List[str]:
    w = []
    if t.montant == 0.0:
        w.append("montant non trouvé dans le ticket")
    if not t.date:
        w.append("date non trouvée dans le ticket")
    if not t.categorie or t.categorie == "Non catégorisé":
        w.append("catégorie non identifiée")
    if not t.sous_categorie:
        w.append("sous-catégorie non identifiée")
    return w


class OCRConfigResponse(BaseModel):
    api_key: str = ""


class OCRConfigUpdate(BaseModel):
    api_key: str


@router.get("/config", response_model=OCRConfigResponse)
async def get_ocr_config_endpoint():
    """Récupère la clé API Groq."""
    from backend.config.ocr_config import get_ocr_config

    config = get_ocr_config()
    return OCRConfigResponse(api_key=config.get("api_key", ""))


@router.post("/config", response_model=OCRConfigResponse)
async def update_ocr_config_endpoint(config_data: OCRConfigUpdate):
    """Sauvegarde la clé API Groq."""
    if config_data.api_key and not config_data.api_key.startswith("gsk_"):
        raise HTTPException(400, "Clé API Groq invalide (doit commencer par 'gsk_')")

    config = save_ocr_config(config_data.api_key)
    return OCRConfigResponse(api_key=config.get("api_key", ""))


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

        archived_path = archive_ticket_file(path, tx)

        return OCRScanResponse(
            transaction=tx.model_dump(),
            warnings=_tx_warnings(tx),
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
                w = []
                if tx.montant == 0.0:
                    w.append("montant non trouvé")
                if not tx.categorie or tx.categorie == "Non catégorisé":
                    w.append("catégorie non identifiée")
                formatted.append(
                    OCRScanResponse(transaction=tx, warnings=w, raw_ocr_text=None)
                )

        return BatchScanResponse(results=formatted)
    except Exception as e:
        logger.error(f"Batch scan error: {e}", exc_info=True)
        raise HTTPException(500, f"Échec du traitement par lot: {str(e)}")
    finally:
        mgr.cleanup()




@router.post("/scan-income", response_model=IncomeScanResponse)
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

        archived_path = archive_payroll_file(
            path, transactions=[]
        )  # Mock tx list just for target path derivation if needed

        try:
            txs = apply_salary_split(
                net_amount=net, payroll_date=date_str, attachment=archived_path
            )
        except SalaryPlanError as e:
            logger.error(f"Salary plan error: {e}")
            txs = [
                Transaction(
                    type="revenu",
                    categorie="Épargne",
                    sous_categorie="Divers",
                    montant=net,
                    date=date_str,
                    description="Salaire",
                    source="scan_income",
                    attachment=archived_path,
                    has_attachments=bool(archived_path),
                )
            ]

        # Actual archiving with real txs if needed
        final_archived_path = archive_payroll_file(path, txs)

        splits = [
            IncomeSplitDTO(
                categorie=t.categorie,
                sous_categorie=t.sous_categorie,
                montant=t.montant,
                description=t.description or "",
            )
            for t in txs
        ]
        return IncomeScanResponse(
            total_net=net,
            date=pay_date or date_type.today(),
            suggested_splits=splits,
            archived_path=final_archived_path,
            raw_text=raw,
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
