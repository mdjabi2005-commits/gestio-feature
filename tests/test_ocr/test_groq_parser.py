import pytest
import os
from dotenv import load_dotenv

# Charge le .env avant toute autre chose dans pytest
load_dotenv()

from domains.transactions.ocr.core.groq_parser import GroqParser
import textwrap

@pytest.mark.unit
@pytest.mark.ocr
class TestGroqParser:
    """Validation du parseur intelligent (LLM Groq)."""

    @pytest.fixture
    def groq_parser(self):
        return GroqParser()

    @pytest.mark.skipif(not os.getenv("GROQ_API_KEY"), reason="Nécessite GROQ_API_KEY")
    def test_auto_bilan_ticket(self, groq_parser):
        """
        Vérifie que le LLM catégorise correctement un texte brut 
        très bruité issu d'un ticket de contrôle technique automobile.
        """
        raw_auto_bilan_text = textwrap.dedent('''
            CARTE BANCAIRE
            SANS CONTACT
            CREDIT AGRICOLE
            CENTRE FRANCE
            )))
            
            A00000000031010
            Visa Debit
            LE 18/02/26 A 17:47:12
            AUTO BILAN TECHNIC
            CUSSET
            03300
            3285715
            16806
            44500251200017
            ###########2018
            2570F4FF42DC77B9
            001 000004 23
            C @
            NO AUTO: 624567
            MONTANT:
            20,00 EUR
            DEBIT
            TICKET CLIENT
            A CONSERVER
            MERCI AU REVOIR
            26842568
        ''').strip()

        # Appel réel à Groq
        result = groq_parser.parse(raw_auto_bilan_text)

        # Vérifications inflexibles (Llama peut être indécis entre Voiture et Services car c'est un Contrôle Technique)
        assert result.get("category") in ["Voiture", "Services"], f"Catégorie inattendue: {result.get('category')}"
        
        # Vérification flexible sur la description (le LLM peut renvoyer "AUTO BILAN", "AUTO BILAN TECHNIC", etc.)
        desc = result.get("description", "").upper()
        assert "AUTO BILAN" in desc, f"Description inattendue: {desc}"
        
        # Vérification qu'une sous-catégorie a été inventée logiquement
        assert result.get("subcategory") is not None
        
    def test_fallback_sans_texte(self, groq_parser):
        """Doit retourner les valeurs par défaut si le texte est vide."""
        result = groq_parser.parse("")
        assert result.get("category") == "Autre"
        assert result.get("description") == "Transaction sans catégorie"
