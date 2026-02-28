"""
OCR Service - Orchestration complète du flux OCR -> Transaction
Service unifié pour extraire données depuis Images (tickets) ou PDF (relevés)
"""

import logging
from datetime import date
from pathlib import Path

from .pattern_manager import PatternManager
# FIN WORKERS
# ---------------------------------------------------------------------------


class OCRService:
    """
    Service unifié orchestrant l'extraction de données depuis:
    - Images de tickets (OCR EasyOCR)
    - PDF de relevés (pdfminer.six)
    Et conversion en Transaction unifiée
    """

    def __init__(self):
        """Initialise l'OCR Service avec ses dépendances."""
        self.ocr_engine = RapidOCREngine()
        self.pattern_manager = PatternManager()

        logger.info("OCRService unifié initialisé")

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
            from config.logging_config import log_error
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
            from config.logging_config import log_error
            log_error(e, f"Echec traitement document {path.name}")
            raise

    @staticmethod
    def _process_pdf(pdf_path: str) -> Transaction:
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
        if not PDFMINER_AVAILABLE or pdf_engine is None:
            err = ImportError(
                "pdfminer.six est requis pour traiter les PDF. "
                "Installez-le avec: pip install pdfminer.six"
            )
            from config.logging_config import log_error
            log_error(err, "Dépendance manquante: pdfminer.six")
            raise err

        logger.info(f"Extraction PDF démarrée: {pdf_path}")

        # 1. Extraction du texte
        try:
            text = pdf_engine.extract_text_from_pdf(pdf_path)
        except Exception as e:
            from config.logging_config import log_error
            log_error(e, f"Erreur extraction texte PDF {Path(pdf_path).name}")
            raise ValueError(f"Impossible d'extraire le texte du PDF: {e}")

        # 2. Parsing spécifique revenus
        parsed_data = parse_pdf_revenue(text)

        if parsed_data is None:
            from config.logging_config import log_error
            err = ValueError("Données non trouvées dans le PDF (parsing échoué)")
            log_error(err, f"Echec parsing contenu PDF {Path(pdf_path).name}")
            raise err

        # 3. Construction Transaction
        try:
            transaction = Transaction(
                type="Revenu",
                categorie="Revenu",
                montant=parsed_data['montant'],
                date=parsed_data['date'],
                description=parsed_data['description'],
                source="pdf",
                sous_categorie=None,
                recurrence=None,
                date_fin=None,
                compte_iban=None,
                external_id=None,
                id=None,
            )

            logger.info(f"✅ Transaction PDF créée avec succès: {transaction.montant}€ ({transaction.description})")
            return transaction
        except Exception as e:
            from config.logging_config import log_error
            log_error(e, "Erreur création objet Transaction depuis PDF")
            raise

    def process_ticket(self, image_path: str) -> Transaction:
        """
        Traite un ticket scanné (image) et retourne une Transaction.
        Workflow:
            1. OCR -> Texte brut
            2. Nettoyage du texte
            3. Extraction montant (via patterns)
            4. Extraction date (via patterns)
            5. Construction Transaction
        """
        logger.info(f"Traitement ticket démarré: {Path(image_path).name}")

        try:
            # 1. Extraction texte via OCR
            raw_text = self.ocr_engine.extract_text(image_path)

            # 3. Récupération des patterns
            amount_patterns = self.pattern_manager.get_amount_patterns()
            date_patterns = self.pattern_manager.get_date_patterns()

            # 4. Parsing
            amount = parse_amount(raw_text, amount_patterns)
            transaction_date = parse_date(raw_text, date_patterns)

            # 5. Validation
            if amount is None:
                from config.logging_config import log_error
                err = ValueError("Montant non trouvé dans le ticket")
                log_error(err, f"Echec extraction montant ticket {Path(image_path).name}")
                # Au lieu de crasher, on assigne 0.0 pour laisser l'utilisateur corriger via l'UI
                amount = 0.0

            # 6. Construction Transaction unifiée
            transaction = Transaction(
                type="Dépense",
                categorie="Non catégorisé",
                montant=amount,
                date=transaction_date or date.today(),
                description="",
                source="ocr",
                sous_categorie=None,
                recurrence=None,
                date_fin=None,
                compte_iban=None,
                external_id=None,
                id=None,
            )

            logger.info(f"✅ Transaction Ticket créée avec succès: {amount}€ ({transaction.date or 'date inconnue'})")
            return transaction

        except Exception as e:
            from config.logging_config import log_error
            log_error(e, f"Erreur traitement image ticket {Path(image_path).name}")
            raise

    def process_batch_tickets(self, image_paths: list[str], max_workers: int = 1, progress_callback=None) -> list[tuple[str, Transaction | None, str | None, float]]:
        """
        Traite un lot d'images (tickets) via le module OCR interne de l'instance.
        Architecture "V4 Indestructible (Fail-Safe)" : 
        - Après de nombreux tests, l'accès concurrentiel (Threads ou Processes) d'ONNX Runtime 
          sous Windows + Streamlit est trop instable (GIL Lock, I/O Spawns).
        - Le multiprocessing est officiellement retiré de la V4 locale.
        - On utilise une boucle séquentielle stricte (1 thread, 1 process) pour 100% de fiabilité.
        """
        import time
        
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

