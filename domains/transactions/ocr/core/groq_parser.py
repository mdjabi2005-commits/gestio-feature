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

# Chargement dynamique depuis categories.yaml
from shared.utils.categories_loader import get_categories, get_all_subcategories

logger = logging.getLogger(__name__)


class GroqParser:
    """
    Parser utilisant l'API Groq (LPU) pour extraire instantanément des informations
    structurées depuis du texte OCR "bruité".
    Catégories et sous-catégories chargées depuis categories.yaml.
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
            
        # Construction du prompt avec catégories + sous-catégories depuis le YAML
        categories = get_categories()
        subcategories_map = get_all_subcategories()
        categories_str = ", ".join(f"'{cat}'" for cat in categories)
        subcat_lines = "\n".join(
            f"  - {cat}: {', '.join(subs)}"
            for cat, subs in subcategories_map.items()
            if subs
        )

        self.system_prompt = f"""
Tu es un expert comptable ultra-rapide.
Ta tâche : Analyser un texte brut OCR extrait d'un ticket de caisse, d'une facture ou d'un PDF.
Tu dois extraire le nom du commerçant et classifier la transaction.

Tu dois répondre OBLIGATOIREMENT ET UNIQUEMENT par un objet JSON strict ("type": "json_object").

Règles de classification cruciales (ANTI-BIAIS) :
1. Si tu détectes des mots liés au carburant ("Carburant", "Gazole", "SP95", "SP98", "E10", "E85", "Litre", "Pompe", "Station", "Piste", "Total", "BP", "Shell", "Esso", "Intermarché carburant", "Leclerc carburant"),
   la catégorie DOIT ÊTRE "Voiture" ET la sous-catégorie DOIT ÊTRE "Essence", MÊME SI l'enseigne est un supermarché.
2. Si c'est un ticket de supermarché standard sans mention de carburant, c'est "Alimentation" > "Supermarché".
3. Pour les stations-service (Total, BP, Shell, Esso, Q8), catégorie "Voiture", sous-catégorie "Essence".

Catégories disponibles : [{categories_str}]

Sous-catégories disponibles par catégorie (utilise EXACTEMENT ces termes) :
{subcat_lines}

Règles de sortie du JSON :
{{
  "category": "Choisis OBLIGATOIREMENT une SEULE catégorie parmi la liste exacte ci-dessus.",
  "subcategory": "Choisis OBLIGATOIREMENT une sous-catégorie EXACTE de la liste ci-dessus pour la catégorie choisie.",
  "description": "Le nom du commerçant principal en Majuscules (ex: 'TOTAL STATION'). Si introuvable, mets 'Achat'."
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

            # Validation catégorie
            if data.get("category") not in get_categories():
                data["category"] = "Autre"

            # Validation sous-catégorie : cherche la correspondance la plus proche
            category = data.get("category", "Autre")
            subcategory = data.get("subcategory", "")
            valid_subs = get_all_subcategories().get(category, [])

            if valid_subs and subcategory:
                # Correspondance exacte
                if subcategory not in valid_subs:
                    # Correspondance insensible à la casse
                    sub_lower = subcategory.lower()
                    match = next((s for s in valid_subs if s.lower() == sub_lower), None)
                    if match:
                        data["subcategory"] = match
                    else:
                        # Correspondance partielle (ex: "Gazole" → "Essence")
                        match = next((s for s in valid_subs if s.lower() in sub_lower or sub_lower in s.lower()), None)
                        data["subcategory"] = match if match else valid_subs[0]
                        logger.info(f"Sous-catégorie '{subcategory}' → '{data['subcategory']}' (correction)")
            elif valid_subs and not subcategory:
                data["subcategory"] = valid_subs[0]

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
