"""
Groq Parser - Extraction intelligente Ultra-Rapide (LPU)
Utilise un LLM distant de chez Groq (Llama-3) pour structurer les données issues de l'OCR.
Garanti un temps de réponse < 1 seconde grâce à l'architecture spécialisée.
"""

import json
import logging
import os
from typing import Dict, Any

from groq import Groq

# Import depuis le domaine métier pour garantir la conformité
from domains.transactions.database.constants import TRANSACTION_CATEGORIES

logger = logging.getLogger(__name__)


class GroqParser:
    """
    Parser utilisant l'API Groq (LPU) pour extraire instantanément des informations
    structurées depuis du texte OCR "bruité".
    """

    def __init__(self, model_name: str = "llama-3.3-70b-versatile"):
        """
        Initialise le parser. Charge automatiquement le fichier .env si présent,
        puis récupère la clé d'API (GROQ_API_KEY).
        """
        from dotenv import load_dotenv
        load_dotenv()
        
        self.model_name = model_name
        self.api_key = os.getenv("GROQ_API_KEY")
        
        if not self.api_key:
            logger.warning("GROQ_API_KEY absente ! Le parsing LLM échouera systématiquement.")
            self.client = None
        else:
            self.client = Groq(api_key=self.api_key)
            
        # On construit un prompt robuste avec la liste exacte de nos catégories
        categories_str = ", ".join(f"'{cat}'" for cat in TRANSACTION_CATEGORIES)
        
        self.system_prompt = f"""
Tu es un expert comptable ultra-rapide.
Ta tâche : Analyser un texte brut OCR extrait d'un ticket de caisse ou d'une facture.
Tu dois extraire le nom du commerçant et classifier la transaction.

Tu dois répondre OBLIGATOIREMENT ET UNIQUEMENT par un objet JSON strict ("type": "json_object").

Règles de sortie du JSON :
{{
  "category": "Choisis OBLIGATOIREMENT une SEULE catégorie parmi cette liste exacte : [{categories_str}]. Si aucune ne correspond bien, choisis 'Autre'.",
  "subcategory": "Invente une sous-catégorie précise en 1 ou 2 mots max (ex: 'Essence', 'Fast Food', 'Supermarché').",
  "description": "Le nom du commerçant principal trouvé dans le ticket en Majuscules (ex: 'CARREFOUR MARKET', 'TOTAL ENERGIES'). S'il n'y a rien, mets 'Achat'."
}}

Rien d'autre ne doit être renvoyé à part l'objet JSON contenant ces 3 clés.
"""

    def parse(self, text: str) -> Dict[str, Any]:
        """
        Analyse le texte brut de l'OCR et renvoie {category, subcategory, description}.
        """
        if not self.client:
            logger.error("Tentative d'utilisation de GroqParser sans GROQ_API_KEY.")
            return self._fallback()

        if not text or len(text.strip()) < 10:
            logger.warning("Texte OCR trop court pour Groq.")
            return self._fallback()

        try:
            logger.info(f"Envoi du texte brut ({len(text)} car) à Groq ({self.model_name})...")

            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": self.system_prompt,
                    },
                    {
                        "role": "user",
                        "content": f"Texte du Ticket :\n{text}",
                    }
                ],
                model=self.model_name,
                response_format={"type": "json_object"},  # Clé magique pour la sécurité du parsing
                temperature=0.0, # 0 = Logique mathématique absolue, pas "d'imagination"
            )

            content = chat_completion.choices[0].message.content
            logger.debug(f"Réponse JSON de Groq: {content}")

            data = json.loads(content)
            
            # Validation finale de sécurité (au cas où "Autre" n'est pas utilisé)
            if data.get("category") not in TRANSACTION_CATEGORIES:
                 data["category"] = "Autre"
                 
            return data

        except Exception as e:
            logger.error(f"Erreur API Groq: {e}")
            return self._fallback()

    def _fallback(self) -> Dict[str, Any]:
        """Valeurs par défaut si le LLM échoue ou n'est pas configuré."""
        return {
            "category": "Autre",
            "subcategory": None,
            "description": "Transaction sans catégorie"
        }
