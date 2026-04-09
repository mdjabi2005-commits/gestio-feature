import logging

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class EasyOCREngine:
    """
    Moteur OCR utilisant EasyOCR pour extraire du texte depuis des images
    """

    def __init__(self, languages=None, gpu: bool = False):
        """
        Initialise le moteur OCR
        
        Args:
            languages: Langues à reconnaître (par défaut: français)
            gpu: Utiliser le GPU si disponible
        """
        if languages is None:
            languages = ['fr']
        self.reader = None
        self.languages = languages
        self.gpu = gpu
        self._initialized = False

    def _initialize_reader(self):
        """Lazy initialization of EasyOCR reader"""
        if self._initialized:
            return

        try:
            import easyocr
            logger.info(f"Initialisation EasyOCR - Langues: {self.languages}, GPU: {self.gpu}")
            self.reader = easyocr.Reader(self.languages, gpu=self.gpu)
            self._initialized = True
        except ImportError:
            logger.error("EasyOCR module not found. Please install it with 'pip install easyocr'.")
            self.reader = None
        except Exception as e:
            logger.error(f"Failed to initialize EasyOCR: {e}")
            self.reader = None

    @staticmethod
    def _preprocess_image(img):
        """
        Prétraite l'image pour améliorer la qualité OCR
        """
        # 1. Conversion niveaux de gris
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img

        # 2. Amélioration du contraste (CLAHE)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)

        # 3. Réduction du bruit (filtre bilatéral)
        denoised = cv2.bilateralFilter(enhanced, 9, 75, 75)

        # 4. Binarisation adaptative
        binary = cv2.adaptiveThreshold(
            denoised,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11,
            2
        )

        return binary

    def extract_text(self, image_path: str, paragraph: bool = False, preprocess: bool = True) -> str:
        """
        Extrait le texte brut d'une image
        """
        # Ensure initialized
        self._initialize_reader()

        if not self.reader:
            raise ImportError("Le module 'easyocr' n'est pas installé ou a échoué à l'initialisation. "
                              "Veuillez l'installer avec `pip install easyocr` pour utiliser cette fonctionnalité.")

        try:
            logger.info(f"Extraction OCR depuis: {image_path} (paragraph={paragraph}, preprocess={preprocess})")

            # Lecture robuste
            with open(image_path, 'rb') as f:
                file_bytes = np.asarray(bytearray(f.read()), dtype=np.uint8)
                img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

            if img is None:
                raise ValueError(f"Impossible de décoder l'image: {image_path}")

            # Prétraitement conditionnel
            img_to_process = img
            if preprocess:
                img_to_process = self._preprocess_image(img)

            # Text recognition
            result = self.reader.readtext(img_to_process, detail=0, paragraph=paragraph)

            full_text = "\n".join(result)

            logger.info(f"OCR terminé - {len(result)} lignes extraites")
            return full_text

        except FileNotFoundError:
            logger.error(f"Image introuvable: {image_path}")
            raise
        except ImportError:
            raise
        except Exception as e:
            logger.error(f"Erreur OCR: {e}", exc_info=True)
            raise


