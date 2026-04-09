"""
PDFPlumber Engine - Extraction de texte depuis des fichiers PDF
Utilisé pour les fiches de paie (meilleure extraction de tableaux)
"""

import logging
import re
from datetime import date, datetime
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

PDFPLUMBER_AVAILABLE = False

try:
    import pdfplumber

    PDFPLUMBER_AVAILABLE = True
except ImportError:
    logging.warning(
        "pdfplumber n'est pas installé. L'extraction PDF des fiches de paie ne sera pas disponible."
    )


class PDFPlumberEngine:
    """
    Moteur d'extraction de texte depuis des fichiers PDF via pdfplumber.
    Optimisé pour les fiches de paie avec tableaux.
    """

    def __init__(self):
        if not PDFPLUMBER_AVAILABLE:
            raise ImportError(
                "pdfplumber est requis pour l'extraction des fiches de paie. "
                "Installez-le avec: uv add pdfplumber"
            )

    def extract_text_from_pdf(self, pdf_path: str) -> str:
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

        if not path.suffix.lower() == ".pdf":
            raise ValueError(f"Le fichier n'est pas un PDF : {pdf_path}")

        try:
            text = ""
            with pdfplumber.open(path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"

            logger.info(f"Texte extrait du PDF (pdfplumber) : {len(text)} caractères")
            return text

        except Exception as e:
            from config.logging_config import log_error

            log_error(e, f"Erreur lors de l'extraction du PDF {pdf_path}")
            raise

    def extract_payroll_data(self, pdf_path: str) -> Dict[str, Any]:
        """
        Extrait les données spécifiques d'une fiche de paie :
        - Net à payer
        - Date de la fiche de paie

        Args:
            pdf_path: Chemin vers le fichier PDF

        Returns:
            Dictionnaire avec 'net' (float), 'date' (date), 'raw_text' (str)

        Raises:
            ValueError: Si les données essentielles ne peuvent être extraites
        """
        text = self.extract_text_from_pdf(pdf_path)

        net = self._extract_net_amount(text)
        payroll_date = self._extract_payroll_date(text)

        return {"net": net, "date": payroll_date, "raw_text": text}

    def _extract_net_amount(self, text: str) -> Optional[float]:
        """
        Extrait le montant 'NET À PAYER' du texte de la fiche de paie.

        Args:
            text: Texte brut de la fiche de paie

        Returns:
            Montant net en float, ou None si non trouvé
        """
        text_upper = text.upper()

        patterns = [
            r"NET\s+(?:À\s+)?PAYER\s*[,:]?\s*([\d\s]+[.,]\d{2})",
            r"NET\s+(?:À\s+)?PAYER\s*\n?\s*([\d\s]+[.,]\d{2})",
            r"MONTANT\s+NET\s*[,:]?\s*([\d\s]+[.,]\d{2})",
            r"NET\s+PAYÉ\s*[,:]?\s*([\d\s]+[.,]\d{2})",
            r"SALAIRE\s+NET\s*[,:]?\s*([\d\s]+[.,]\d{2})",
            r"TOTAL\s+NET\s*[,:]?\s*([\d\s]+[.,]\d{2})",
        ]

        for pattern in patterns:
            matches = re.findall(pattern, text_upper, re.MULTILINE)
            if matches:
                amount_str = matches[-1]
                amount_str = amount_str.replace(" ", "").replace(",", ".")
                try:
                    amount = float(amount_str)
                    if amount > 0:
                        logger.info(f"Montant NET trouvé: {amount}€")
                        return amount
                except ValueError:
                    continue

        generic_pattern = r"([\d\s]+[.,]\d{2})\s*€"
        matches = re.findall(generic_pattern, text_upper)
        if matches:
            amounts = []
            for m in matches:
                try:
                    cleaned = m.replace(" ", "").replace(",", ".")
                    a = float(cleaned)
                    if a > 0:
                        amounts.append(a)
                except ValueError:
                    continue
            if amounts:
                amount = max(amounts)
                logger.info(f"Montant NET extrait (fallback): {amount}€")
                return amount

        logger.warning("Aucun montant NET trouvé dans la fiche de paie")
        return None

    def _extract_payroll_date(self, text: str) -> Optional[date]:
        """
        Extrait la date de la fiche de paie.

        Args:
            text: Texte brut de la fiche de paie

        Returns:
            Date de la fiche de paie, ou date du jour si non trouvée
        """
        text_lower = text.lower()

        month_names = {
            "janvier": 1,
            "fevrier": 2,
            "février": 2,
            "mars": 3,
            "avril": 4,
            "mai": 5,
            "juin": 6,
            "juillet": 7,
            "aout": 8,
            "août": 8,
            "septembre": 9,
            "octobre": 10,
            "novembre": 11,
            "decembre": 12,
            "décembre": 12,
        }

        pattern1 = r"(?:fiche\s+de\s+paie|paye|bulletin\s+de\s+salaire)\s+(?:du\s+)?(\d{1,2})\s+(\w+)\s+(\d{4})"
        match = re.search(pattern1, text_lower)
        if match:
            day = int(match.group(1))
            month_name = match.group(2)
            year = int(match.group(3))
            month = month_names.get(month_name)
            if month:
                try:
                    return date(year, month, day)
                except ValueError:
                    pass

        pattern2 = r"(\d{1,2})[\/\-.](\d{2})[\/\-.](\d{4})"
        matches = re.findall(pattern2, text)
        for match in matches:
            try:
                day = int(match[0])
                month = int(match[1])
                year = int(match[2])
                if year < 100:
                    year += 2000
                if 1 <= month <= 12 and 1 <= day <= 31:
                    return date(year, month, day)
            except ValueError:
                continue

        current_year = datetime.now().year
        current_month = datetime.now().month
        logger.info(
            f"Aucune date trouvée, utilisation du mois actuel: {current_year}-{current_month:02d}"
        )
        return date(current_year, current_month, 1)


pdfplumber_engine: Optional["PDFPlumberEngine"] = (
    PDFPlumberEngine() if PDFPLUMBER_AVAILABLE else None
)

__all__ = ["PDFPLUMBER_AVAILABLE", "pdfplumber_engine", "PDFPlumberEngine"]
