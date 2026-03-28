"""
OCR Service - Orchestration complète du flux OCR -> Transaction
Service unifié pour extraire données depuis Images (tickets) ou PDF (relevés)
"""

import logging
import multiprocessing
import os
import threading
import time
from concurrent.futures import ProcessPoolExecutor
from datetime import date
from pathlib import Path

if __name__ == "__main__":
    multiprocessing.freeze_support()

from backend.config.logging_config import log_error
from .pattern_manager import PatternManager
from ..core.rapidocr_engine import RapidOCREngine
from ..core.groq_parser import GroqParser
from ..core.hardware_utils import get_optimal_workers
from ..core import pdf_engine as _pdf_module
from backend.domains.transactions.database.model import Transaction
from ..core.parser import parse_amount, parse_date, parse_pdf_revenue

logger = logging.getLogger(__name__)

_instance: "OCRService | None" = None
_lock = threading.Lock()

SUPPORTED_IMAGES = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}


def get_ocr_service() -> "OCRService":
    """Retourne l'instance singleton d'OCRService (thread-safe)."""
    global _instance
    if _instance is None:
        with _lock:
            if _instance is None:
                logger.info("[OCR] Création singleton OCRService...")
                _instance = OCRService()
    return _instance


def _process_ticket_worker(
    args: tuple[int, str],
) -> tuple[int, str, "Transaction | None", str | None, float]:
    """Worker pour ProcessPoolExecutor."""
    idx, path = args
    t0 = time.time()
    try:
        return (
            idx,
            Path(path).name,
            get_ocr_service().process_ticket(path),
            None,
            time.time() - t0,
        )
    except Exception as e:
        return (idx, Path(path).name, None, str(e), time.time() - t0)


def _is_pdf(file_path: str) -> bool:
    """Vérifie si le fichier est un PDF."""
    return Path(file_path).suffix.lower() == ".pdf"


def _build_transaction(
    type_: str,
    category: str,
    subcategory: str,
    amount: float,
    tx_date: date,
    description: str,
    source: str,
) -> Transaction:
    """Construit une transaction avec sanitization de la description."""
    desc = description[:50] if len(description) > 50 else description
    return Transaction(
        type=type_,
        categorie=category,
        sous_categorie=subcategory,
        montant=amount,
        date=tx_date,
        description=desc,
        source=source,
        external_id=None,
        id=None,
    )


class OCRService:
    """Service unifié OCR: images (RapidOCR) + PDF (pdfminer)."""

    def __init__(self):
        from dotenv import load_dotenv

        load_dotenv()

        self.ocr_engine = RapidOCREngine()
        self.pattern_manager = PatternManager()
        self._amount_patterns = self.pattern_manager.get_amount_patterns()
        self._date_patterns = self.pattern_manager.get_date_patterns()

        groq_key = os.getenv("GROQ_API_KEY", "").strip()
        self.llm_parser = GroqParser()
        self.groq_available = bool(groq_key)
        logger.info(
            f"OCRService: Groq IA {'activée' if self.groq_available else 'désactivée'} ✅"
        )
        self._warmup_onnx()

    def _warmup_onnx(self) -> None:
        """Warm-up ONNX Runtime."""
        try:
            import tempfile, numpy as np
            from PIL import Image

            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                img = Image.fromarray(np.ones((32, 32, 3), dtype=np.uint8) * 255)
                img.save(tmp.name)
                self.ocr_engine.extract_text(tmp.name)
                Path(tmp.name).unlink(missing_ok=True)
            logger.info("ONNX warm-up terminé ✅")
        except Exception as e:
            logger.warning(f"Warm-up ONNX: {e}")

    def process_document(self, file_path: str) -> Transaction:
        """Point d'entrée unifié."""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Fichier introuvable: {file_path}")

        try:
            return (
                self._process_pdf(file_path)
                if _is_pdf(file_path)
                else self.process_ticket(file_path)
            )
        except Exception as e:
            log_error(e, f"Echec traitement {path.name}")
            raise

    def _process_pdf(self, pdf_path: str) -> Transaction:
        """Traite un PDF de relevé."""
        if not _pdf_module.PDFMINER_AVAILABLE or _pdf_module.pdf_engine is None:
            raise ImportError("pdfminer.six requis pour les PDF")

        try:
            text = _pdf_module.pdf_engine.extract_text_from_pdf(pdf_path)
        except Exception as e:
            raise ValueError(f"Extraction PDF échouée: {e}")

        parsed = parse_pdf_revenue(text)
        if not parsed:
            raise ValueError("Parsing PDF échoué")

        semantic = self.llm_parser.parse(text)
        return _build_transaction(
            type_="revenu",
            category=semantic.get("category", "revenu"),
            subcategory=semantic.get("subcategory") or "Autre",
            amount=parsed["montant"],
            tx_date=parsed["date"],
            description=semantic.get("description") or parsed["description"],
            source="pdf",
        )

    def process_ticket(self, image_path: str) -> Transaction:
        """Traite un ticket image."""
        t0 = time.time()
        logger.info(f"[OCR] Ticket: {Path(image_path).name}")

        raw_text = self.ocr_engine.extract_text(image_path)
        amount = parse_amount(raw_text, self._amount_patterns) or 0.0
        tx_date = parse_date(raw_text, self._date_patterns)

        semantic = self.llm_parser.parse(raw_text)
        logger.info(
            f"[OCR] {amount}€ — {semantic.get('category')} — {time.time() - t0:.2f}s"
        )

        return _build_transaction(
            type_="depense",
            category=semantic.get("category", "Autre"),
            subcategory=semantic.get("subcategory") or "Autre",
            amount=amount,
            tx_date=tx_date or date.today(),
            description=semantic.get("description", ""),
            source="ocr",
        )

    def process_batch_tickets(
        self, image_paths: list[str], max_workers: int = None
    ) -> list[tuple]:
        """Traite un lot de tickets en parallèle."""
        if not image_paths:
            return []

        start = time.time()
        results = [None] * len(image_paths)
        workers = max_workers or get_optimal_workers(len(image_paths))

        with ProcessPoolExecutor(max_workers=workers) as executor:
            for idx, fname, tx, err, elapsed in executor.map(
                _process_ticket_worker, enumerate(image_paths)
            ):
                results[idx] = (fname, tx, err, elapsed)

        logger.info(f"Batch: {len(image_paths)} en {time.time() - start:.2f}s")
        return results
