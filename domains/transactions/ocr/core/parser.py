"""
Parser - Extraction de données structurées via Regex
Fonctions pures qui appliquent des patterns sur du texte brut
"""

import logging
import re
from datetime import datetime, date
from typing import Optional, List

logger = logging.getLogger(__name__)


def parse_amount(text: str, patterns: List[str]) -> Optional[float]:
    """
    Extrait le montant total d'un ticket depuis le texte OCR
    
    Args:
        text: Texte brut extrait par OCR
        patterns: Liste de regex à essayer (ordre de priorité)
        
    Returns:
        Montant en float, ou None si non trouvé
        
    Exemple:
        >>> patterns = [r"TOTAL\\s*:?\\s*(\\d+[.,]\\d{2})"]
        >>> parse_amount("TOTAL : 42.50 EUR", patterns)
        42.50
    """
    text_upper = text.upper()

    for pattern in patterns:
        try:
            matches = re.findall(pattern, text_upper, re.IGNORECASE | re.MULTILINE)
            if matches:
                # Prendre la dernière occurrence (souvent le total final)
                amount_str = matches[-1]
                # Normaliser le texte (Confusion O vs 0, etc.)
                amount_str = str(amount_str).replace('O', '0').replace('o', '0')
                # Normaliser séparateur décimal
                amount_str = amount_str.replace(',', '.').replace(' ', '')
                amount = float(amount_str)
                logger.info(f"Montant trouvé: {amount}€ (pattern: {pattern})")
                return amount
        except (ValueError, IndexError) as e:
            logger.warning(f"Erreur parsing montant avec pattern '{pattern}': {e}")
            continue

    logger.warning("Aucun montant trouvé dans le texte")
    return None


def parse_date(text: str, patterns: List[str]) -> Optional[date]:
    """
    Extrait la date de transaction depuis le texte OCR
    
    Args:
        text: Texte brut extrait par OCR
        patterns: Liste de regex à essayer
        
    Returns:
        Date au format date, ou None si non trouvé
        
    Exemple:
        >>> patterns = [r"(\\d{2}[/\\-.]\\d{2}[/\\-.]\\d{2,4})"]
        >>> parse_date("Date: 04/02/2024", patterns)
        datetime.date(2024, 2, 4)
    """
    for pattern in patterns:
        try:
            matches = re.finditer(pattern, text, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                # Si on a capturé jour, mois, année séparément (notre pattern flexible)
                if len(match.groups()) >= 3:
                    # On reconstruit une date propre: JJ/MM/AAAA
                    date_str = f"{match.group(1)}/{match.group(2)}/{match.group(3)}"
                else:
                    # Sinon on prend le groupe 1 qui est censé être la date complète
                    date_str = match.group(1)

                # Normaliser les séparateurs (au cas où on passe ici avec un seul groupe mal formaté)
                date_str = date_str.replace('-', '/').replace('.', '/').replace(' ', '/')

                # Essayer plusieurs formats
                for fmt in ["%d/%m/%Y", "%d/%m/%y"]:
                    try:
                        parsed_date = datetime.strptime(date_str, fmt).date()
                        logger.info(f"Date trouvée: {parsed_date} (pattern: {pattern})")
                        return parsed_date
                    except ValueError:
                        continue
            # Si on arrive ici, ce match n'était pas une date valide, on essaie le prochain match

        except Exception as e:
            logger.warning(f"Erreur parsing date avec pattern '{pattern}': {e}")
            continue

    logger.warning("Aucune date trouvée dans le texte")
    return None


def parse_pdf_revenue(text: str) -> Optional[dict]:
    """
    Parse spécifique pour les relevés de revenus au format PDF.
    Extrait: montant, date de virement (optionnel), description
    
    Stratégie: Patterns spécifiques d'abord, puis fallback générique.
    
    Args:
        text: Texte extrait du PDF
        
    Returns:
        Dictionnaire avec les données extraites, ou None si aucun montant trouvé
        Format: {'montant': float, 'date': date, 'description': str}
    """
    text_upper = text.upper()

    # === PATTERNS SPÉCIFIQUES (Salaires, virements) ===
    specific_amount_patterns = [
        r"NET\s+(?:À\s+)?PAYER\s*:?\s*([\d\s]+[.,]\d{2})",
        r"MONTANT\s+NET\s*:?\s*([\d\s]+[.,]\d{2})",
        r"NET\s+PAYÉ\s*:?\s*([\d\s]+[.,]\d{2})",
        r"VIREMENT\s*:?\s*([\d\s]+[.,]\d{2})",
        r"TOTAL\s*:?\s*([\d\s]+[.,]\d{2})\s*€",
        r"MONTANT\s+TOTAL\s*:?\s*([\d\s]+[.,]\d{2})"
    ]

    # === PATTERNS GÉNÉRIQUES (Fallback) ===
    # Cherche n'importe quel montant avec € (prend le plus grand trouvé)
    generic_amount_pattern = r"([\d\s]+[.,]\d{2})\s*€"

    # === PATTERNS DATES ===
    date_patterns = [
        r"DATE\s+(?:DE\s+)?(?:PAIEMENT|VIREMENT|LA\s+)?(?:FACTURE)?\s*:?\s*(\d{2}[/\-\.]\d{2}[/\-\.]\d{2,4})",
        r"VIREMENT\s+(?:LE\s+)?(\d{2}[/\-\.]\d{2}[/\-\.]\d{2,4})",
        r"PAYÉ\s+LE\s*:?\s*(\d{2}[/\-\.]\d{2}[/\-\.]\d{2,4})",
        r"FACTURE\s+(?:ÉTABLIE)?\s*(?:LE)?\s*(\d{2}[/\-\.]\d{2}[/\-\.]\d{2,4})",
        r"(\d{2}[/\-\.]\d{2}[/\-\.]\d{2,4})"  # Date générique (en dernier)
    ]

    # === EXTRACTION MONTANT (Stratégie en cascade) ===
    amount = parse_amount(text, specific_amount_patterns)

    if amount is None:
        logger.info("Patterns spécifiques échoués, tentative pattern générique")
        # Fallback: chercher tous les montants avec € et prendre le plus grand
        import re
        matches = re.findall(generic_amount_pattern, text_upper)
        if matches:
            # Convertir tous les montants et prendre le maximum
            amounts = []
            for match in matches:
                try:
                    cleaned = match.replace(' ', '').replace(',', '.')
                    amounts.append(float(cleaned))
                except ValueError:
                    continue

            if amounts:
                amount = max(amounts)
                logger.info(f"Montant extrait via pattern générique: {amount}€ (max de {len(amounts)} trouvés)")

    if amount is None:
        logger.warning("Aucun montant trouvé dans le PDF de revenu")
        return None

    # === EXTRACTION DATE (Optionnel) ===
    payment_date = parse_date(text, date_patterns)
    if not payment_date:
        logger.info("Aucune date trouvée, utilisation de la date du jour")

    # === EXTRACTION DESCRIPTION (Mots-clés) ===
    description = "Revenu extrait du PDF"
    if "UBER" in text_upper:
        description = "Revenu Uber Eats"
    elif "VICHY" in text_upper or "COMMUNAUTE" in text_upper:
        description = "Revenu animation/sortie"
    elif "SALAIRE" in text_upper or "PAYE" in text_upper:
        description = "Salaire"
    elif "FACTURE" in text_upper:
        description = "Facture - Prestation"

    result = {
        'montant': amount,
        'date': payment_date or date.today(),
        'description': description,
    }

    logger.info(f"Revenu PDF parsé: {amount}€ le {payment_date or 'date du jour'} - {description}")
    return result
