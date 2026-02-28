"""
Paramètres matériels pour l'OCR
Détection du CPU/RAM pour optimiser le traitement par lot.
"""

import logging
import os

import psutil

logger = logging.getLogger(__name__)

# RAM minimale requise (le modèle ONNX partagé prend ~0.5 Go en RAM total)
_RAM_PER_WORKER_GB: float = 0.5


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


def get_optimal_workers(task_count: int) -> int:
    """
    Calcule le nombre de workers (Threads) à utiliser pour le pool OCR.

    Borne le résultat par :
    - le nombre de tâches  (inutile de spawner plus de threads que de fichiers)
    - la RAM disponible    (bien que partagée, on garde une limite de sécurité)
    - le nombre de cœurs  (via get_optimal_batch_size)

    Args:
        task_count: Nombre de fichiers à traiter.

    Returns:
        Nombre de workers >= 1.
    """
    if task_count <= 0:
        return 1

    # 1. Limite CPU
    cpu_workers = get_optimal_batch_size()

    # 2. Limite RAM
    try:
        info = get_cpu_info()
        available_ram = info.get("available_ram_gb", 4.0)
        ram_workers = max(1, int(available_ram / _RAM_PER_WORKER_GB))
    except Exception:
        ram_workers = cpu_workers

    # 3. Pas plus de workers que de tâches à traiter
    optimal = min(cpu_workers, ram_workers, task_count)
    optimal = max(1, optimal)

    logger.info(
        f"Workers calculés : {optimal} "
        f"(cpu_limit={cpu_workers}, ram_limit={ram_workers}, tâches={task_count})"
    )
    return optimal
