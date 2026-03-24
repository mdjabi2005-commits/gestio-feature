"""
OCR Service - Orchestration complète du flux OCR -> Transaction
Service unifié pour extraire données depuis Images (tickets) ou PDF (relevés)
"""

import logging
import os
import threading
import time
from datetime import date
from pathlib import Path

from config.logging_config import log_error
from .pattern_manager import PatternManager
from ..core.rapidocr_engine import RapidOCREngine
from ..core.groq_parser import GroqParser
from ..core import pdf_engine as _pdf_module
from domains.transactions.database.model import Transaction
from ..core.parser import parse_amount, parse_date, parse_pdf_revenue

logger = logging.getLogger(__name__)

# ── Singleton process-level ───────────────────────────────────────────────────
# ONNX Runtime n'est pas thread-safe à l'initialisation.
# On garantit qu'une seule instance existe dans tout le processus Python,
# peu importe le nombre de reruns Streamlit.
_instance: "OCRService | None" = None
_lock = threading.Lock()


def get_ocr_service() -> "OCRService":
    """Retourne l'instance singleton d'OCRService (thread-safe)."""
    global _instance
    if _instance is None:
        with _lock:
            if _instance is None:  # double-check après acquisition du lock
                logger.info("[OCR] Création de l'instance singleton OCRService...")
                _instance = OCRService()
    return _instance


class OCRService:
    """
    Service unifié orchestrant l'extraction de données depuis:
    - Images de tickets (OCR RapidOCR)
    - PDF de relevés (pdfminer.six)
    Et conversion en Transaction unifiée.
    Groq est utilisé pour la catégorisation IA si GROQ_API_KEY est configurée.
    """

    def __init__(self):
        """Initialise l'OCR Service avec ses dépendances."""
        self.ocr_engine = RapidOCREngine()
        self.pattern_manager = PatternManager()

        # Cache des patterns pour éviter rechargement à chaque ticket
        self._amount_patterns = self.pattern_manager.get_amount_patterns()
        self._date_patterns = self.pattern_manager.get_date_patterns()

        # Instancier Groq seulement si la clé est disponible
        groq_key = os.getenv("GROQ_API_KEY", "").strip()
        if groq_key:
            self.llm_parser = GroqParser()
            self.groq_available = True
            logger.info("OCRService initialisé — catégorisation Groq IA activée ✅")
        else:
            self.llm_parser = GroqParser()
            self.groq_available = False
            logger.warning("OCRService initialisé — GROQ_API_KEY absente, catégorisation IA désactivée ⚠️")

        # Warm-up ONNX Runtime au démarrage
        self._warmup_onnx()

    def _warmup_onnx(self) -> None:
        """
        Warm-up ONNX Runtime : exécute une inférence factice sur image blanche.
        Force la compilation JIT des kernels au démarrage pour que le premier
        vrai scan soit instantané.
        """
        try:
            import tempfile
            import numpy as np
            from PIL import Image

            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                tmp_path = tmp.name

            # Image blanche 32x32 — assez grande pour que RapidOCR ne la rejette pas
            img = Image.fromarray(np.ones((32, 32, 3), dtype=np.uint8) * 255)
            img.save(tmp_path)

            self.ocr_engine.extract_text(tmp_path)

            Path(tmp_path).unlink(missing_ok=True)
            logger.info("ONNX Runtime warm-up terminé ✅")
        except Exception as e:
            logger.warning(f"Warm-up ONNX non bloquant : {e}")

    @staticmethod
    def _detect_file_type(file_path: str) -> str:
        """
        Détecte le type de fichier à traiter.
        
        Args:
            file_path: Chemin vers le fichier
        
        Returns:
            'pdf' ou 'image'
        """
        ext = Path(file_path).suffix.lower()
        if ext == '.pdf':
            return 'pdf'
        elif ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']:
            return 'image'
        else:
            logger.warning(f"Type de fichier inconnu: {ext}, traitement comme image")
            return 'image'

    def process_document(self, file_path: str) -> Transaction:
        """
        Traite un document (image ou PDF) et retourne une Transaction.
        Point d'entrée unifié pour tous types de documents.
        
        Args:
            file_path: Chemin absolu vers le document
            
        Returns:
            Transaction avec données extraites
            
        Raises:
            ValueError: Si extraction échoue
            FileNotFoundError: Si fichier n'existe pas
        """
        path = Path(file_path)

        if not path.exists():
            err = FileNotFoundError(f"Le fichier n'existe pas: {file_path}")
            log_error(err, "Fichier introuvable pour OCR")
            raise err

        try:
            # Détection automatique du type
            file_type = self._detect_file_type(file_path)

            logger.info(f"Traitement document démarré: {path.name} (type: {file_type})")

            if file_type == 'pdf':
                return self._process_pdf(file_path)
            else:
                return self.process_ticket(file_path)
        except Exception as e:
            log_error(e, f"Echec traitement document {path.name}")
            raise

    def _process_pdf(self, pdf_path: str) -> Transaction:
        """
        Traite un PDF de relevé de revenus.
        
        Args:
            pdf_path: Chemin vers le PDF
        
        Returns:
            Transaction de type Revenu
        
        Raises:
            ImportError: Si pdfminer.six n'est pas installé
            ValueError: Si extraction échoue
        """
        if not _pdf_module.PDFMINER_AVAILABLE or _pdf_module.pdf_engine is None:
            err = ImportError(
                "pdfminer.six est requis pour traiter les PDF. "
                "Installez-le avec: uv add pdfminer.six"
            )
            log_error(err, "Dépendance manquante: pdfminer.six")
            raise err

        logger.info(f"Extraction PDF démarrée: {pdf_path}")

        try:
            text = _pdf_module.pdf_engine.extract_text_from_pdf(pdf_path)
        except Exception as e:
            log_error(e, f"Erreur extraction texte PDF {Path(pdf_path).name}")
            raise ValueError(f"Impossible d'extraire le texte du PDF: {e}")

        parsed_data = parse_pdf_revenue(text)

        if parsed_data is None:
            err = ValueError("Données non trouvées dans le PDF (parsing échoué)")
            log_error(err, f"Echec parsing contenu PDF {Path(pdf_path).name}")
            raise err

        # Catégorisation intelligente via Groq (même flux que process_ticket)
        logger.info("Soumission du texte PDF à Groq pour catégorisation...")
        semantic_data = self.llm_parser.parse(text)
        category = semantic_data.get("category", "Revenu")
        subcategory = semantic_data.get("subcategory", None)
        description = semantic_data.get("description") or parsed_data['description']
        if len(description) > 50:
            description = description[:50]

        try:
            transaction = Transaction(
                type="Revenu",
                categorie=category,
                montant=parsed_data['montant'],
                date=parsed_data['date'],
                description=description,
                source="pdf",
                sous_categorie=subcategory,
                recurrence=None,
                date_fin=None,
                compte_iban=None,
                external_id=None,
                id=None,
            )
            logger.info(f"✅ Transaction PDF créée: {transaction.montant}€ — {category} / {subcategory}")
            return transaction
        except Exception as e:
            log_error(e, "Erreur création objet Transaction depuis PDF")
            raise

    def process_ticket(self, image_path: str) -> Transaction:
        """
        Traite un ticket scanné (image) et retourne une Transaction.
        """
        t0 = time.time()
        logger.info(f"[OCR] process_ticket démarré : {Path(image_path).name}")

        try:
            # 1. Extraction texte via OCR
            logger.info(f"[OCR] Étape 1/4 — extraction texte OCR... ({time.time()-t0:.2f}s)")
            raw_text = self.ocr_engine.extract_text(image_path)
            logger.info(f"[OCR] Étape 1/4 — texte extrait : {len(raw_text)} caractères ({time.time()-t0:.2f}s)")

            # 2. Parsing montant/date via patterns cached
            logger.info(f"[OCR] Étape 2/4 — parsing montant/date... ({time.time()-t0:.2f}s)")
            amount = parse_amount(raw_text, self._amount_patterns)
            transaction_date = parse_date(raw_text, self._date_patterns)
            logger.info(f"[OCR] Étape 2/4 — montant={amount}, date={transaction_date} ({time.time()-t0:.2f}s)")

            # 3. Catégorisation Groq
            logger.info(f"[OCR] Étape 3/4 — catégorisation {'Groq IA' if self.groq_available else 'fallback (pas de clé Groq)'}... ({time.time()-t0:.2f}s)")
            semantic_data = self.llm_parser.parse(raw_text)
            category = semantic_data.get("category", "Autre")
            subcategory = semantic_data.get("subcategory", None)
            description = semantic_data.get("description", "")
            if len(description) > 50:
                description = description[:50]
            logger.info(f"[OCR] Étape 3/4 — catégorie={category}, desc={description} ({time.time()-t0:.2f}s)")

            # 4. Construction Transaction
            logger.info(f"[OCR] Étape 4/4 — construction Transaction... ({time.time()-t0:.2f}s)")
            if amount is None:
                logger.warning(f"[OCR] Montant non trouvé, défaut à 0.0")
                amount = 0.0

            transaction = Transaction(
                type="Dépense",
                categorie=category,
                montant=amount,
                date=transaction_date or date.today(),
                description=description,
                source="ocr",
                sous_categorie=subcategory,
                recurrence=None,
                date_fin=None,
                compte_iban=None,
                external_id=None,
                id=None,
            )

            logger.info(f"[OCR] ✅ Transaction créée : {amount}€ — {category} — total={time.time()-t0:.2f}s")
            return transaction

        except Exception as e:
            log_error(e, f"Erreur traitement image ticket {Path(image_path).name}")
            raise

    def process_batch_tickets(self, image_paths: list[str], max_workers: int = 1, progress_callback=None) -> list[tuple[str, Transaction | None, str | None, float]]:
        """
        Traite un lot de tickets en séquentiel pur.
        Le multiprocessing ONNX Runtime est instable sous Windows + Streamlit —
        boucle séquentielle stricte pour fiabilité maximale.
        """
        results = []
        total = len(image_paths)
        processed_count = 0
        start_time = time.time()
        
        logger.info(f"Démarrage process_batch_tickets: {total} fichiers (Séquentiel pur)")

        for path in image_paths:
            fname = Path(path).name
            t0_ticket = time.time()
            
            try:
                transaction = self.process_ticket(path)
                img_elapsed = time.time() - t0_ticket
                results.append((fname, transaction, None, img_elapsed))
            except Exception as e:
                logger.error(f"Erreur OCR sur {fname}: {e}")
                img_elapsed = time.time() - t0_ticket
                results.append((fname, None, str(e), img_elapsed))
            
            processed_count += 1
            
            if progress_callback:
                progress_callback(fname, processed_count, total, time.time() - start_time)
                
        return results


# ─────────────────────────────────────────────────────────────────────────────
# Fin du service OCR unifié
# ─────────────────────────────────────────────────────────────────────────────

