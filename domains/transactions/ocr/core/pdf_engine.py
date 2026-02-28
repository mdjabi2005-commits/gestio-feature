"""
PDF Engine - Extraction de texte depuis des fichiers PDF
Utilisé pour extraire des données de relevés de revenus (PDF)
"""

import logging
from pathlib import Path
from typing import Dict, Any

try:
    # noinspection PyUnusedImports
    from pdfminer.high_level import extract_text
    # noinspection PyUnusedImports
    from pdfminer.layout import LAParams

    PDFMINER_AVAILABLE = True
except ImportError:
    PDFMINER_AVAILABLE = False
    logging.warning("pdfminer.six n'est pas installé. L'extraction PDF ne sera pas disponible.")

logger = logging.getLogger(__name__)


class PDFEngine:
    """
    Moteur d'extraction de texte depuis des fichiers PDF.
    Utilise pdfminer.six pour extraire le contenu textuel.
    """

    def __init__(self):
        if not PDFMINER_AVAILABLE:
            raise ImportError(
                "pdfminer.six est requis pour l'extraction PDF. "
                "Installez-le avec: pip install pdfminer.six"
            )

    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> str:
        """
        Extrait tout le texte brut d'un fichier PDF.
        
        Args:
            pdf_path: Chemin vers le fichier PDF
        
        Returns:
            Texte extrait du PDF
        
        Raises:
            FileNotFoundError: Si le fichier n'existe pas
            Exception: Si l'extraction échoue
        """
        path = Path(pdf_path)

        if not path.exists():
            raise FileNotFoundError(f"Le fichier PDF n'existe pas : {pdf_path}")

        if not path.suffix.lower() == '.pdf':
            raise ValueError(f"Le fichier n'est pas un PDF : {pdf_path}")

        try:
            # Extraction simple du texte
            text = extract_text(str(path))
            logger.info(f"Texte extrait du PDF : {len(text)} caractères")
            return text

        except Exception as e:
            from config.logging_config import log_error
            log_error(e, f"Erreur lors de l'extraction du PDF {pdf_path}")
            raise

    @staticmethod
    def extract_text_with_layout(pdf_path: str) -> str:
        """
        Extrait le texte d'un PDF en conservant la mise en page.
        Utile pour les documents structurés (tableaux, colonnes).
        
        Args:
            pdf_path: Chemin vers le fichier PDF
        
        Returns:
            Texte extrait avec préservation de la mise en page
        """
        path = Path(pdf_path)

        if not path.exists():
            raise FileNotFoundError(f"Le fichier PDF n'existe pas : {pdf_path}")

        try:
            # LAParams permet de contrôler la détection de la mise en page
            laparams = LAParams(
                line_margin=0.5,  # Marge entre lignes
                word_margin=0.1,  # Marge entre mots
                char_margin=2.0,  # Marge entre caractères
                boxes_flow=0.5  # Détection du flux de texte
            )

            text = extract_text(str(path), laparams=laparams)
            logger.info(f"Texte extrait du PDF (avec layout) : {len(text)} caractères")
            return text

        except Exception as e:
            from config.logging_config import log_error
            log_error(e, f"Erreur lors de l'extraction du PDF {pdf_path}")
            raise

    @staticmethod
    def extract_metadata(pdf_path: str) -> Dict[str, Any]:
        """
        Extrait les métadonnées d'un PDF.
        
        Args:
            pdf_path: Chemin vers le fichier PDF
        
        Returns:
            Dictionnaire avec les métadonnées (auteur, titre, date création, etc.)
        """
        from pdfminer.pdfparser import PDFParser
        from pdfminer.pdfdocument import PDFDocument

        path = Path(pdf_path)

        if not path.exists():
            raise FileNotFoundError(f"Le fichier PDF n'existe pas : {pdf_path}")

        try:
            with open(path, 'rb') as file:
                parser = PDFParser(file)
                doc = PDFDocument(parser)

                metadata = {}
                if doc.info:
                    # Les métadonnées sont dans doc.info[0]
                    info = doc.info[0]
                    for key, value in info.items():
                        # Convertir les bytes en string si nécessaire
                        if isinstance(value, bytes):
                            try:
                                value = value.decode('utf-8')
                            except UnicodeDecodeError:
                                value = value.decode('latin-1')
                        metadata[key] = value

                logger.info(f"Métadonnées extraites du PDF : {metadata}")
                return metadata

        except Exception as e:
            from config.logging_config import log_error
            log_error(e, f"Erreur lors de l'extraction des métadonnées du PDF {pdf_path}")
            return {}


# Instance singleton
pdf_engine = PDFEngine() if PDFMINER_AVAILABLE else None
