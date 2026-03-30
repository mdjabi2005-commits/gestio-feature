"""OCR Configuration management - Gestion de la configuration OCR (Groq API key)."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

logger = logging.getLogger(__name__)

_dotenv_loaded = False


def _ensure_dotenv():
    global _dotenv_loaded
    if not _dotenv_loaded:
        from backend.config.paths import ENV_PATH
        load_dotenv(ENV_PATH)
        _dotenv_loaded = True


def get_groq_api_key() -> str:
    """Retourne la clé API Groq (depuis environnement)."""
    _ensure_dotenv()
    return os.getenv("GROQ_API_KEY", "")


def get_ocr_config() -> dict:
    """Retourne la configuration OCR actuelle."""
    _ensure_dotenv()
    return {"api_key": os.getenv("GROQ_API_KEY", "")}


def save_ocr_config(api_key: str = None) -> dict:
    """Sauvegarde la configuration OCR (en mémoire pour la session en cours)."""
    _ensure_dotenv()
    if api_key:
        os.environ["GROQ_API_KEY"] = api_key
    return get_ocr_config()
