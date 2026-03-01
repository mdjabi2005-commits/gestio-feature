"""
Categories Loader — Charge les catégories et sous-catégories depuis categories.yaml.
Fallback automatique sur les constantes si le fichier est absent ou corrompu.
"""

import logging
from pathlib import Path
from typing import List, Dict

import yaml

logger = logging.getLogger(__name__)

# Chemin calculé depuis la racine du projet (2 niveaux au-dessus de shared/utils/)
_PROJECT_ROOT = Path(__file__).parent.parent.parent
_YAML_PATH = _PROJECT_ROOT / "domains" / "transactions" / "database" / "categories.yaml"

# Cache en mémoire — chargé une seule fois au démarrage
_cache: Dict | None = None


def _load() -> Dict:
    """Charge et met en cache le YAML."""
    global _cache
    if _cache is not None:
        return _cache

    if not _YAML_PATH.exists():
        logger.warning(f"categories.yaml introuvable : {_YAML_PATH}. Utilisation du fallback.")
        _cache = {}
        return _cache

    try:
        with open(_YAML_PATH, encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        _cache = data
        logger.info(f"categories.yaml chargé ({len(data.get('categories', []))} catégories)")
        return _cache
    except Exception as e:
        logger.error(f"Erreur lecture categories.yaml : {e}")
        _cache = {}
        return _cache


def get_categories() -> List[str]:
    """Retourne la liste ordonnée des noms de catégories."""
    data = _load()
    if not data.get("categories"):
        # Fallback sur les constantes Python
        from domains.transactions.database.constants import _FALLBACK_CATEGORIES
        return _FALLBACK_CATEGORIES
    return [cat["name"] for cat in data["categories"]]


def get_subcategories(category: str) -> List[str]:
    """Retourne les sous-catégories d'une catégorie donnée."""
    data = _load()
    for cat in data.get("categories", []):
        if cat["name"] == category:
            return cat.get("subcategories", [])
    return []


def get_all_subcategories() -> Dict[str, List[str]]:
    """Retourne un dict {categorie: [sous-catégories]} pour l'IA."""
    data = _load()
    return {
        cat["name"]: cat.get("subcategories", [])
        for cat in data.get("categories", [])
    }


def reload() -> None:
    """Force le rechargement du YAML (utile après modification utilisateur)."""
    global _cache
    _cache = None
    _load()
    logger.info("categories.yaml rechargé.")

