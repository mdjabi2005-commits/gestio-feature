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
    get_available_plans,
    load_salary_plan,
    validate_salary_plan,
)
from backend.config.ocr_config import get_ocr_config, save_ocr_config
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
    SalaryPlanItem,
    SalaryPlanResponse,
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

        archived_path = _archive_ticket_file(path, tx)

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


@router.get("/salary-plans", response_model=List[SalaryPlanResponse])
async def get_salary_plan():
    try:
        plan = load_salary_plan()
        items = [
            SalaryPlanItem(
                categorie=a.get("category", ""),
                montant=a.get("value", 0),
                type=a.get("type", "percent"),
                sub_distribution_mode=a.get("sub_distribution_mode", "equal"),
                sub_allocations=a.get("sub_allocations"),
            )
            for a in plan.get("allocations", [])
        ]
        return [
            SalaryPlanResponse(
                id=1,
                nom=plan.get("name", "Plan"),
                is_active=plan.get("is_active", True),
                reference_salary=plan.get("reference_salary", 0),
                default_remainder_category=plan.get(
                    "default_remainder_category", "Épargne"
                ),
                items=items,
                available_plans=get_available_plans(),
            )
        ]
    except FileNotFoundError:
        return []
    except Exception as e:
        logger.error(f"Error loading salary plan: {e}")
        raise HTTPException(500, str(e))


@router.post("/salary-plans", response_model=SalaryPlanResponse)
async def save_salary_plan(plan_data: dict):
    try:
        ref = plan_data.get("reference_salary", 0.0)
        storage = {
            "name": plan_data.get("nom", "Plan"),
            "is_active": plan_data.get("is_active", True),
            "reference_salary": ref,
            "default_remainder_category": plan_data.get(
                "default_remainder_category", "Épargne"
            ),
            "allocations": [
                {
                    "category": i.get("categorie"),
                    "value": i.get("montant"),
                    "type": i.get("type"),
                    "sub_distribution_mode": i.get("sub_distribution_mode"),
                    "sub_allocations": i.get("sub_allocations"),
                }
                for i in plan_data.get("items", [])
            ],
        }
        validate_salary_plan(storage)

        if ref > 0:
            from backend.domains.budgets.repository import budget_repository
            from backend.domains.budgets.model import Budget
            from backend.shared.utils.categories_loader import get_subcategories

            for item in plan_data.get("items", []):
                val = item.get("montant", 0)
                category = item.get("categorie")
                alloc_type = item.get("type")
                sub_allocations = item.get("sub_allocations", [])

                category_amount = val if alloc_type == "fixed" else (ref * (val / 100))
                if category_amount <= 0:
                    continue

                if sub_allocations and len(sub_allocations) > 0:
                    total_sub_pct = sum(s.get("value", 0) for s in sub_allocations)
                    for sub in sub_allocations:
                        sub_name = sub.get("name")
                        sub_pct = sub.get("value", 0)
                        sub_amount = (
                            round(category_amount * (sub_pct / 100), 2)
                            if total_sub_pct > 0
                            else 0
                        )
                        if sub_amount > 0 and sub_name:
                            budget_repository.upsert(
                                Budget(categorie=sub_name, montant_max=sub_amount)
                            )
                else:
                    known_subs = get_subcategories(category)
                    if known_subs:
                        sub_amount = round(category_amount / len(known_subs), 2)
                        for sub_name in known_subs:
                            if sub_amount > 0:
                                budget_repository.upsert(
                                    Budget(categorie=sub_name, montant_max=sub_amount)
                                )
                    else:
                        budget_repository.upsert(
                            Budget(
                                categorie=category,
                                montant_max=round(category_amount, 2),
                            )
                        )

        import yaml
        from pathlib import Path

        p = Path(__file__).parent.parent.parent / "config" / "salary_plan_default.yaml"
        with open(p, "w", encoding="utf-8") as f:
            yaml.dump(
                {"salary_plan": storage},
                f,
                allow_unicode=True,
                default_flow_style=False,
            )

        return SalaryPlanResponse(
            id=1,
            nom=plan_data.get("nom", "Plan"),
            is_active=plan_data.get("is_active", True),
            reference_salary=ref,
            default_remainder_category=plan_data.get(
                "default_remainder_category", "Épargne"
            ),
            items=[SalaryPlanItem(**i) for i in plan_data.get("items", [])],
            available_plans=get_available_plans(),
        )
    except SalaryPlanError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error(f"Error saving salary plan: {e}")
        raise HTTPException(500, str(e))


@router.put("/salary-plans/{plan_id}", response_model=SalaryPlanResponse)
async def update_salary_plan(plan_id: int, plan_data: dict):
    """Met à jour un salary plan existant."""
    plan_data["id"] = plan_id
    return await save_salary_plan(plan_data)


@router.delete("/salary-plans/{plan_id}")
async def delete_salary_plan(plan_id: int):
    """Supprime un salary plan (réinitialise à défaut)."""
    try:
        import yaml
        from pathlib import Path

        p = Path(__file__).parent.parent.parent / "config" / "salary_plan_default.yaml"
        default_plan = {
            "salary_plan": {
                "name": "Plan par défaut",
                "is_active": False,
                "reference_salary": 0,
                "default_remainder_category": "Épargne",
                "allocations": [],
            }
        }
        with open(p, "w", encoding="utf-8") as f:
            yaml.dump(default_plan, f, allow_unicode=True, default_flow_style=False)

        return {"status": "success", "message": "Salary plan supprimé"}
    except Exception as e:
        logger.error(f"Error deleting salary plan: {e}")
        raise HTTPException(500, str(e))


def _archive_file(
    source_path: str,
    category: str,
    sub_category: str = None,
    target_base_dir: str = None,
    is_ticket: bool = True,
) -> str | None:
    """
    Archive un fichier (ticket ou revenu) vers le dossier structuré.

    Args:
        source_path: Chemin du fichier source
        category: Catégorie de la transaction
        sub_category: Sous-catégorie (optionnel)
        target_base_dir: Dossier cible (SORTED_DIR pour tickets, REVENUS_TRAITES pour revenus)
        is_ticket: True pour tickets (images), False pour revenus (PDF)

    Returns:
        Chemin d'archivage ou None en cas d'échec
    """
    import shutil

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


def _archive_payroll_file(
    temp_path: str, transactions: List[Transaction]
) -> str | None:
    """Archive le fichier PDF de fiche de paie."""
    if not transactions:
        return None

    dominant_tx = max(transactions, key=lambda t: t.montant)
    return _archive_file(
        temp_path,
        category=dominant_tx.categorie or "Épargne",
        sub_category=dominant_tx.sous_categorie,
        target_base_dir=None,
        is_ticket=False,
    )


def _archive_ticket_file(temp_path: str, transaction: Transaction = None) -> str | None:
    """Archive le fichier de ticket image."""
    if transaction is None:
        return None

    return _archive_file(
        temp_path,
        category=transaction.categorie or "Autre",
        sub_category=transaction.sous_categorie,
        target_base_dir=None,
        is_ticket=True,
    )


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

        archived_path = _archive_payroll_file(
            path, txs=[]
        )  # Mock tx list just for target path derivation if needed, but better call it AFTER txs creation

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

        # Actual archiving with real txs if needed (though dominant category logic might prefer the txs)
        final_archived_path = _archive_payroll_file(path, txs)

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
