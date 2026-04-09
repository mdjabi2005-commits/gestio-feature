"""
RapidOCR Engine - Wrapper pour rapidocr_onnxruntime
Remplace EasyOCR pour une exécution plus rapide et légère.
"""

import logging
import time
import time

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
            raise ImportError("rapidocr_onnxruntime n'est pas installe. uv add rapidocr-onnxruntime")

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
        """
        t0 = time.time()
        logger.info(f"[OCR] extract_text démarré pour : {image_path}")

        try:
            logger.info(f"[OCR] Appel RapidOCR engine... ({time.time()-t0:.2f}s)")
            result, elapse = self.engine(image_path)
            logger.info(f"[OCR] RapidOCR terminé en {time.time()-t0:.2f}s — résultat: {type(result)}, nb lignes: {len(result) if result else 0}")

            if not result:
                logger.warning(f"[OCR] Aucun texte détecté pour {image_path} ({time.time()-t0:.2f}s)")
                return ""

            text_lines = [line[1] for line in result]
            full_text = "\n".join(text_lines)
            total_time = sum(elapse) if isinstance(elapse, list) else float(elapse or 0.0)
            logger.info(f"[OCR] {len(text_lines)} lignes extraites, temps ONNX={total_time:.3f}s, total={time.time()-t0:.2f}s")
            return full_text

        except Exception as e:
            logger.error(f"[OCR] Erreur RapidOCR après {time.time()-t0:.2f}s : {e}")
            raise ValueError(f"Echec extraction OCR: {e}")
