"""
LLM Parser - Extraction intelligente via Ollama
Utilise un LLM local pour structurer les données issues de l'OCR.
"""

import json
import logging
import re
from typing import Dict, Any

import ollama

logger = logging.getLogger(__name__)


# noinspection PyTypeChecker
class LLMParser:
    """
    Parser utilisant un LLM local via Ollama pour extraire des informations structurées
    depuis du texte brut (OCR).
    """

    def __init__(self, model_name: str = "llama3.1:latest", host: str = "http://127.0.0.1:11434"):
        """
        Initialise le parser LLM.
        
        Args:
            model_name: Nom du modèle Ollama à utiliser (ex: 'qwen2.5:7b', 'llama3.1')
            host: URL de l'API Ollama (défaut: http://127.0.0.1:11434)
        """
        self.model_name = model_name
        self.client = ollama.Client(host=host)
        self.system_prompt = """
        Tu es un assistant spécialisé dans l'extraction de données financières.
        Ta tâche est d'analyser le texte d'un document (ticket de caisse, facture, virement) et d'en extraire les informations clés au format JSON strict.
        
        Tu dois extraire :
        - "amount": le montant total (nombre flottant, utiliser le point comme séparateur décimal). Priorité au "NET À PAYER" ou "TOTAL".
        - "date": la date de la transaction (format YYYY-MM-DD). Si introuvable, null.
        - "type": "Dépense" ou "Revenu".
        - "category": catégorie probable (Alimentation, Transport, Logement, Loisirs, Santé, Services, etc.).
        - "subcategory": sous-catégorie probable (optionnel).
        - "description": description courte et précise (nom du commerçant ou objet du virement).
        
        Règles :
        1. Réponds UNIQUEMENT avec le JSON valide. Pas de texte avant ou après.
        2. Si une information est introuvable, mets null.
        3. Pour le type, déduis-le du contexte (ticket de caisse = Dépense, bulletin de salaire = Revenu).
        """

    def parse(self, text: str) -> Dict[str, Any]:
        """
        Analyse le texte et retourne un dictionnaire structuré.
        
        Args:
            text: Texte brut issu de l'OCR
            
        Returns:
            Dict avec les clés: amount, date, type, category, subcategory, description
        """
        if not text or len(text.strip()) < 10:
            logger.warning("Texte trop court pour le LLM")
            return {}

        try:
            logger.info(f"Envoi au LLM ({self.model_name}) pour parsing...")

            response = self.client.chat(model=self.model_name, messages=[
                {
                    'role': 'system',
                    'content': self.system_prompt,
                },
                {
                    'role': 'user',
                    'content': f"Voici le texte extrait du document :\n\n{text}",
                },
            ], options={
                'temperature': 0.1,  # Très déterministe
                'num_predict': 512,  # Limite la taille de la réponse
                'format': 'json'  # Force le format JSON (supporté par Ollama récents)
            })

            content = response['message']['content']
            logger.debug(f"Réponse LLM brute: {content}")

            # Nettoyage et parsing JSON
            try:
                # Parfois le modèle met du markdown ```json ... ``` malgré l'option format
                if "```" in content:
                    content = re.search(r"```(?:json)?(.*?)```", content, re.DOTALL).group(1)

                data = json.loads(content)

                # Normalisation des données
                processed_data = self._post_process(data)
                logger.info(f"Parsing LLM réussi: {processed_data}")
                return processed_data

            except json.JSONDecodeError as e:
                logger.error(f"Erreur décodage JSON LLM: {e} - Contenu: {content}")
                return {}

        except Exception as e:
            logger.error(f"Erreur communication Ollama: {e}")
            return {}

    # noinspection PyTypeChecker
    @staticmethod
    def _post_process(data: Dict[str, Any]) -> Dict[str, Any]:
        """Nettoie et valide les données extraites."""
        result = {
            "amount": None,
            "date": None,
            "type": "Dépense",  # Par défaut
            "category": "Autre",
            "subcategory": None,
            "description": "Transaction"
        }

        # Montant
        if data.get("amount"):
            try:
                # Gérer les formats string avec virgule "12,50" -> 12.50
                val = str(data["amount"]).replace(',', '.').replace('€', '').strip()
                # noinspection PyTypeChecker
                result["amount"] = float(val)
            except ValueError:
                pass

        # Date
        if data.get("date"):
            # Le prompt demande YYYY-MM-DD, on espère que le LLM respecte
            # On pourrait ajouter un parsing dateutil ici pour être robuste
            result["date"] = data["date"]

        # Type
        if data.get("type") in ["Dépense", "Revenu"]:
            result["type"] = data["type"]

        # Description
        if data.get("description"):
            result["description"] = data["description"]

        # Categories
        if data.get("category"):
            result["category"] = data["category"]
        if data.get("subcategory"):
            result["subcategory"] = data["subcategory"]

        return result
