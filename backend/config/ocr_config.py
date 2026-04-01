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
    key = os.getenv("GROQ_API_KEY", "")
    # Si la clé est vide en mémoire mais présente dans le fichier, recharger
    if not key:
        from backend.config.paths import ENV_PATH

        if ENV_PATH.exists():
            from dotenv import load_dotenv

            load_dotenv(ENV_PATH, override=True)
            key = os.getenv("GROQ_API_KEY", "")
    return key


def get_ocr_config() -> dict:
    """Retourne la configuration OCR actuelle."""
    return {"api_key": get_groq_api_key()}


def save_ocr_config(api_key: str = None) -> dict:
    """Sauvegarde la configuration OCR (fichier .env + mémoire)."""
    _ensure_dotenv()
    if api_key:
        # Écrire dans le fichier .env
        from backend.config.paths import ENV_PATH

        env_content = ""
        if ENV_PATH.exists():
            env_content = ENV_PATH.read_text(encoding="utf-8")

        # Mettre à jour ou ajouter la clé
        lines = env_content.splitlines()
        key_found = False
        new_lines = []
        for line in lines:
            if line.startswith("GROQ_API_KEY="):
                new_lines.append(f"GROQ_API_KEY={api_key}")
                key_found = True
            else:
                new_lines.append(line)

        if not key_found:
            new_lines.append(f"GROQ_API_KEY={api_key}")

        ENV_PATH.write_text("\n".join(new_lines), encoding="utf-8")

        # Mettre à jour la mémoire
        os.environ["GROQ_API_KEY"] = api_key

        logger.info(f"GROQ_API_KEY sauvegardée dans {ENV_PATH}")

    return get_ocr_config()
