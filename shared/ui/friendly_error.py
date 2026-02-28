"""
Friendly Error Handler - Modern Error Notifications

Translates technical exceptions into user-friendly toast notifications.
Uses standard UI components (toasts) instead of intrusive static blocks.
"""

from config.logging_config import get_logger
# noinspection PyUnresolvedReferences
from shared.exceptions import (
    DatabaseError,
    OCRError,
    ValidationError,
    ServiceError,
    FileOperationError,
    ConfigurationError,
    GestioException
)
from .toast_components import toast_error, toast_warning

logger = get_logger(__name__)


def show_friendly_error(error: Exception) -> None:
    """
    Display a friendly toast notification for an exception.
    
    Args:
        error: The exception to handle
        
    Example:
        >>> try:
        ...     save_data()
        ... except Exception as e:
        ...     show_friendly_error(e)
    """
    logger.error(f"User error caught: {error}", exc_info=True)

    msg = str(error).lower()

    # 1. Database Errors
    if isinstance(error, DatabaseError):
        if "locked" in msg:
            toast_warning("⏳ Base de données occupée. Réessayez dans un instant.")
        elif "unique" in msg:
            toast_warning("🚫 Cette donnée existe déjà.")
        else:
            toast_error(f"Erreur base de données: {error}")

    # 2. OCR Errors
    elif isinstance(error, OCRError):
        if "tesseract" in msg:
            toast_error("📸 Tesseract OCR manquant - Contactez le support")
        elif "empty" in msg:
            toast_warning("📄 Impossible de lire le texte du ticket")
        else:
            toast_error("📸 Erreur de lecture OCR")

    # 3. Validation Errors
    elif isinstance(error, ValidationError):
        toast_warning(f"⚠️ Données invalides: {error}")

    # 4. File Errors
    elif isinstance(error, FileOperationError):
        if "not found" in msg:
            toast_error("📁 Fichier introuvable")
        else:
            toast_error(f"📁 Erreur fichier: {error}")

    # 5. Generic Service/Gestio Errors
    elif isinstance(error, (ServiceError, GestioException)):
        toast_error(f"⚙️ Erreur interne: {error}")

    # 6. Unknown Errors
    else:
        toast_error(f"❌ Erreur inattendue: {error}")
