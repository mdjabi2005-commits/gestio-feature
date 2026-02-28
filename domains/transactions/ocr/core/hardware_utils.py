"""
Paramètres matériels pour l'OCR
Détection du CPU/RAM pour optimiser le traitement par lot.
"""

import logging
import os

import psutil

logger = logging.getLogger(__name__)


def get_cpu_info() -> dict:
    """Retourne les infos CPU/RAM"""
    try:
        return {
            "physical_cores": psutil.cpu_count(logical=False),
            "logical_cores": psutil.cpu_count(logical=True),
            "total_ram_gb": round(psutil.virtual_memory().total / (1024 ** 3), 2),
            "available_ram_gb": round(psutil.virtual_memory().available / (1024 ** 3), 2)
        }
    except Exception as e:
        logger.error(f"Erreur detection hardware: {e}")
        return {}


def get_optimal_batch_size() -> int:
    """
    Calcule le nombre optimal de workers pour le traitement par lot.
    Basé sur le nombre de cœurs logiques.
    
    Règle empirique pour RapidOCR (CPU bound):
    - On laisse 1-2 cœurs pour l'OS/UI
    - On utilise le reste
    """
    try:
        cpu_count = os.cpu_count() or 1

        # Si on a peu de coeurs (<= 4), on reste prudent (-1)
        if cpu_count <= 4:
            workers = max(1, cpu_count - 1)
        # Si on a beaucoup de coeurs (> 4), on peut charger (-2 pour le confort)
        else:
            workers = cpu_count - 2

        logger.info(f"Workers optimaux détectés: {workers} (CPUs: {cpu_count})")
        return workers

    except Exception as e:
        logger.warning(f"Impossible de déterminer les workers, fallback à 1: {e}")
        return 1
