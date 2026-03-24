"""
Utilitaires pour le parsing des montants.
Fonctions de conversion de chaînes de caractères en montants numériques.
"""

import logging

import pandas as pd

logger = logging.getLogger(__name__)


def parse_amount(value) -> float:
    """
    Convertit une valeur en montant float.

    Gère les formats:
    - Européen: 1.234,56
    - Américain: 1,234.56
    - Avec symbols: 100€, $50, etc.

    Args:
        value: Valeur brute (str, int, float, etc.)

    Returns:
        Montant converti en float, ou 0.0 si échec
    """
    if pd.isna(value) or value == "":
        return 0.0

    s = str(value).strip()
    s = s.replace("€", "").replace("EUR", "").replace("$", "").replace(" ", "").replace("\xa0", "")

    if "," in s and "." not in s:
        # Format européen simple: 1234,56
        s = s.replace(",", ".")
    elif "," in s and "." in s:
        # Les deux présents - détecter le séparateur décimal
        if s.rfind(",") > s.rfind("."):
            # Virgule après le point = européen
            s = s.replace(".", "").replace(",", ".")
        else:
            # Point après la virgule = américain
            s = s.replace(",", "")

    try:
        return float(s)
    except ValueError:
        logger.warning(f"Impossible de convertir '{value}' en montant")
        return 0.0
