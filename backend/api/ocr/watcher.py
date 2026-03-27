"""
OCR Watcher - Surveillance du dossier TO_SCAN_DIR pour traitement automatique.
"""

import logging
import os
import shutil
import threading
import time
from pathlib import Path
from typing import Optional

from backend.config.paths import TO_SCAN_DIR, SORTED_DIR, REVENUS_TRAITES
from backend.domains.transactions.database.repository import transaction_repository
from backend.domains.transactions.ocr.services.ocr_service import get_ocr_service
from backend.api.ocr.ocr import _archive_file

logger = logging.getLogger(__name__)

SUPPORTED_IMAGES = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}
SUPPORTED_PDFS = {".pdf"}

_processing = False
_watcher_thread: Optional[threading.Thread] = None
_stop_event = threading.Event()


def _is_valid_file(filename: str) -> Optional[str]:
    """Retourne 'image', 'pdf' ou None selon le type de fichier."""
    ext = Path(filename).suffix.lower()
    if ext in SUPPORTED_IMAGES:
        return "image"
    elif ext in SUPPORTED_PDFS:
        return "pdf"
    return None


def _process_file(file_path: str) -> bool:
    """
    Traite un fichier (ticket ou PDF de revenu).
    Returns True si le traitement a réussi.
    """
    try:
        file_type = _is_valid_file(file_path)
        if not file_type:
            logger.warning(f"Fichier non supporté: {file_path}")
            return False

        ocr_service = get_ocr_service()

        if file_type == "image":
            tx = ocr_service.process_ticket(file_path)

            transaction_repository.add(tx)

            _archive_file(
                file_path,
                category=tx.categorie or "Autre",
                sub_category=tx.sous_categorie,
                target_base_dir=SORTED_DIR,
                is_ticket=True,
            )
            logger.info(f"Ticket traité et archivé: {tx.categorie}/{tx.sous_categorie}")
            return True

        elif file_type == "pdf":
            from backend.domains.transactions.ocr.core.pdfplumber_engine import (
                pdfplumber_engine,
            )

            if not pdfplumber_engine or not pdfplumber_engine.PDFPLUMBER_AVAILABLE:
                logger.warning("pdfplumber non disponible, PDF ignoré")
                return False

            data = pdfplumber_engine.extract_payroll_data(file_path)
            net = data.get("net")

            if not net or net <= 0:
                logger.warning(f"Montant net non trouvé dans le PDF: {file_path}")
                return False

            from backend.domains.transactions.services.salary_plan_service import (
                apply_salary_split,
                SalaryPlanError,
            )
            from backend.domains.transactions.database.model import Transaction
            from datetime import date

            date_str = (
                data.get("date").isoformat()
                if data.get("date")
                else date.today().isoformat()
            )

            try:
                transactions = apply_salary_split(net_amount=net, payroll_date=date_str)
            except SalaryPlanError:
                transactions = [
                    Transaction(
                        type="Revenu",
                        categorie="Épargne",
                        sous_categorie="Divers",
                        montant=net,
                        date=date_str,
                        description="Salaire",
                        source="watcher",
                    )
                ]

            for tx in transactions:
                transaction_repository.add(tx)

            _archive_file(
                file_path,
                category=transactions[0].categorie if transactions else "Épargne",
                sub_category=transactions[0].sous_categorie
                if transactions
                else "Divers",
                target_base_dir=REVENUS_TRAITES,
                is_ticket=False,
            )
            logger.info(
                f"PDF de paie traité et archivé: {len(transactions)} transactions"
            )
            return True

    except Exception as e:
        logger.error(f"Erreur traitement {file_path}: {e}")
        return False


def _scan_directory():
    """Scan le répertoire TO_SCAN_DIR et traite les fichiers."""
    global _processing

    if _processing:
        return

    _processing = True
    try:
        if not os.path.exists(TO_SCAN_DIR):
            os.makedirs(TO_SCAN_DIR, exist_ok=True)
            return

        files = [
            f
            for f in os.listdir(TO_SCAN_DIR)
            if os.path.isfile(os.path.join(TO_SCAN_DIR, f))
        ]

        for filename in files:
            file_path = os.path.join(TO_SCAN_DIR, filename)

            if _is_valid_file(filename):
                logger.info(f"Traitement du fichier: {filename}")

                if _process_file(file_path):
                    try:
                        os.remove(file_path)
                        logger.info(f"Fichier source supprimé: {filename}")
                    except Exception as e:
                        logger.error(f"Erreur suppression {filename}: {e}")
                else:
                    target_dir = os.path.join(TO_SCAN_DIR, "erreur")
                    os.makedirs(target_dir, exist_ok=True)
                    shutil.move(file_path, os.path.join(target_dir, filename))
                    logger.warning(f"Fichier déplacé vers erreur: {filename}")

    except Exception as e:
        logger.error(f"Erreur scan directory: {e}")
    finally:
        _processing = False


def _watcher_loop(interval: int = 60):
    """Boucle de surveillance du répertoire."""
    logger.info(f"Watcher démarré - Scan toutes les {interval}s")

    while not _stop_event.is_set():
        _scan_directory()
        _stop_event.wait(interval)

    logger.info("Watcher arrêté")


def start_watcher(interval: int = 60):
    """Démarre le watcher dans un thread de fond."""
    global _watcher_thread, _stop_event

    if _watcher_thread and _watcher_thread.is_alive():
        logger.warning("Watcher déjà en cours")
        return

    _stop_event.clear()
    _watcher_thread = threading.Thread(
        target=_watcher_loop, args=(interval,), daemon=True
    )
    _watcher_thread.start()
    logger.info(f"Watcher démarré (interval: {interval}s)")


def stop_watcher():
    """Arrête le watcher."""
    global _stop_event

    _stop_event.set()
    if _watcher_thread:
        _watcher_thread.join(timeout=5)
    logger.info("Watcher arrêté")


def trigger_scan():
    """Déclenche un scan manuel."""
    _scan_directory()
