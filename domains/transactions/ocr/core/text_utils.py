"""
Utilitaires de nettoyage de texte pour l'OCR.
Détaché de easyocr_engine pour éviter les dépendances inutiles.
"""
import re


def clean_ocr_text(text: str) -> str:
    """
    Nettoie le texte OCR des erreurs communes
    
    Args:
        text: Texte brut avec possibles erreurs OCR
        
    Returns:
        Texte nettoyé
    """
    cleaned = text

    # Remplacer O par 0 dans contexte numérique
    cleaned = re.sub(r'(\d)O(\d)', r'\g<1>0\g<2>', cleaned)
    cleaned = re.sub(r'O(\d)', r'0\g<1>', cleaned)

    # Remplacer I/l par 1 dans contexte numérique
    cleaned = re.sub(r'(\d)[Il](\d)', r'\g<1>1\g<2>', cleaned)

    # Nettoyer espaces multiples
    cleaned = re.sub(r'\s+', ' ', cleaned)

    return cleaned.strip()
