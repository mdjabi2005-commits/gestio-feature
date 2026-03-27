"""OCR Configuration management - Gestion de la configuration OCR (Groq API key)."""

import json
import logging
import os
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

_CONFIG_FILE = Path(__file__).parent / "ocr_config.json"


def _load_config() -> dict:
    """Charge la configuration OCR depuis le fichier JSON."""
    if _CONFIG_FILE.exists():
        try:
            with open(_CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Erreur chargement config OCR: {e}")
    return {"groq_api_key": ""}


def _save_config(config: dict) -> None:
    """Sauvegarde la configuration OCR dans le fichier JSON."""
    try:
        with open(_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
    except Exception as e:
        logger.error(f"Erreur sauvegarde config OCR: {e}")
        raise


def get_groq_api_key() -> str:
    """Retourne la clé API Groq (depuis config ou environnement)."""
    config = _load_config()
    if config.get("groq_api_key"):
        return config["groq_api_key"]
    return os.getenv("GROQ_API_KEY", "")


def get_ocr_config() -> dict:
    """Retourne la configuration OCR actuelle."""
    config = _load_config()
    return {
        "api_key": config.get("groq_api_key", "")
        if config.get("groq_api_key")
        else os.getenv("GROQ_API_KEY", "")
    }


def save_ocr_config(api_key: str = None) -> dict:
    """Sauvegarde la configuration OCR."""
    config = _load_config()
    if api_key:
        config["groq_api_key"] = api_key
    _save_config(config)
    return get_ocr_config()
