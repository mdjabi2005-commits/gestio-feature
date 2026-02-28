"""
RapidOCR Engine - Wrapper pour rapidocr_onnxruntime
Remplace EasyOCR pour une exécution plus rapide et légère.
"""

import logging

try:
    # noinspection PyUnusedImports
    from rapidocr_onnxruntime import RapidOCR

    RAPIDOCR_AVAILABLE = True
except ImportError:
    RAPIDOCR_AVAILABLE = False

logger = logging.getLogger(__name__)


class RapidOCREngine:
    """
    Moteur OCR basé sur RapidOCR (ONNX Runtime).
    Rapide, léger, et efficace pour les tickets.
    """

    def __init__(self):
        if not RAPIDOCR_AVAILABLE:
            raise ImportError("rapidocr_onnxruntime n'est pas installé. pip install rapidocr_onnxruntime")

        # Initialisation du moteur
        # det_model_path, rec_model_path peuvent être configurés si besoin,
        # mais les défauts sont généralement bons (téléchargés auto).
        try:
            self.engine = RapidOCR()
            logger.info("RapidOCR engine initialisé avec succès")
        except Exception as e:
            logger.error(f"Erreur lors de l'init de RapidOCR: {e}")
            raise e

    def extract_text(self, image_path: str) -> str:
        """
        Extrait le texte d'une image.
        
        Args:
            image_path: Chemin vers l'image
            
        Returns:
            Texte brut concaténé (lignes séparées par \n)
        """
        try:
            # RapidOCR prend le chemin directement
            # result = [[box, text, score], ...]
            # result peut être None si rien trouvé
            result, elapse = self.engine(image_path)

            if not result:
                logger.warning(f"Aucun texte détecté par RapidOCR pour {image_path}")
                return ""

            # Concaténation des lignes de texte
            text_lines = [line[1] for line in result]
            full_text = "\n".join(text_lines)

            # elapse is often a list [det_time, cls_time, rec_time]
            total_time = sum(elapse) if isinstance(elapse, list) else float(elapse or 0.0)
            logger.debug(f"RapidOCR: {len(text_lines)} lignes extraites en {total_time:.4f}s")
            return full_text

        except Exception as e:
            logger.error(f"Erreur RapidOCR lors de l'extraction de {image_path}: {e}")
            raise ValueError(f"Echec extraction OCR: {e}")
