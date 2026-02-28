"""
ger - Gestion des patterns regex
Lecture simple des patterns depuis ocr_patterns.yaml
"""

import logging
from pathlib import Path
from typing import Dict, List

import yaml

logger = logging.getLogger(__name__)


class PatternManager:
    """
    Gère les patterns regex depuis ocr_patterns.yaml
    """

    def __init__(self, patterns_path: str = None):
        """
        Initialise le gestionnaire de patterns
        
        Args:
            patterns_path: Chemin vers ocr_patterns.yaml
        """
        if patterns_path is None:
            patterns_path = Path(__file__).parent / "ocr_patterns.yaml"

        self.patterns_path = Path(patterns_path)
        self.patterns = self._load_patterns()

    def _load_patterns(self) -> Dict:
        """Charge les patterns depuis le fichier YAML"""
        if not self.patterns_path.exists():
            logger.error(f"Fichier patterns introuvable: {self.patterns_path}")
            return {'amount': [], 'date': []}

        with open(self.patterns_path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f) or {}
            logger.info(f"Patterns chargés depuis {self.patterns_path}")
            return data

    def get_patterns(self, field: str) -> List[str]:
        """
        Récupère les patterns pour un champ
        
        Args:
            field: Nom du champ ('amount', 'date')
            
        Returns:
            Liste de patterns regex
        """
        return self.patterns.get(field, [])

    def get_amount_patterns(self) -> List[str]:
        """Récupère les patterns pour le montant"""
        return self.get_patterns('amount')

    def get_date_patterns(self) -> List[str]:
        """Récupère les patterns pour la date"""
        return self.get_patterns('date')
