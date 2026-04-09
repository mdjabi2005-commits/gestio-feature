"""Shared utilities package."""

from .converters import normalize_text, safe_convert, safe_date_convert
from .categories_loader import (
    get_categories,
    get_subcategories,
    get_all_subcategories,
    reload as reload_categories,
)
from .file_utils import (
    validate_image_format,
    validate_pdf_format,
    get_file_extension,
    temp_file_context,
    save_upload_to_temp,
    cleanup_temp_files,
    TempFileManager,
)
from .master_key import initialiser_cle_maitre, generer_cle_maitre

# NOTE: dashboard_helpers n'est PAS exposé ici car il importe shared.database
# ce qui crée une dépendance circulaire au chargement du module.
# Importer directement : from backend.shared.utils.dashboard_helpers import ...

__all__ = [
    # Converters
    "normalize_text",
    "safe_convert",
    "safe_date_convert",
    # Categories loader
    "get_categories",
    "get_subcategories",
    "get_all_subcategories",
    "reload_categories",
    # File utils
    "validate_image_format",
    "validate_pdf_format",
    "get_file_extension",
    "temp_file_context",
    "save_upload_to_temp",
    "cleanup_temp_files",
    "TempFileManager",
    # Security / Master Key
    "initialiser_cle_maitre",
    "generer_cle_maitre",
]
