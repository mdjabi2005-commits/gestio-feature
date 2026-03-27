"""Shared utilities package."""

from .converters import normalize_text, safe_convert, safe_date_convert
from .dataframe_utils import (
    create_empty_df,
    create_empty_transaction_df,
    create_empty_attachment_df,
    convert_transaction_df,
    convert_attachment_df,
)
from .amount_parser import parse_amount
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
from .dashboard_helpers import (
    get_month_range,
    get_paid_echeance_ids,
    get_active_echeances,
    dict_to_echeance,
    build_type_breakdown,
    build_echeances_list,
    build_budget_summary,
    build_daily_history,
    aggregate_by_type,
)

__all__ = [
    # Converters
    "normalize_text",
    "safe_convert",
    "safe_date_convert",
    # DataFrame utils
    "create_empty_df",
    "create_empty_transaction_df",
    "create_empty_attachment_df",
    "convert_transaction_df",
    "convert_attachment_df",
    # Amount parser
    "parse_amount",
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
    # Dashboard helpers
    "get_month_range",
    "get_paid_echeance_ids",
    "get_active_echeances",
    "dict_to_echeance",
    "build_type_breakdown",
    "build_echeances_list",
    "build_budget_summary",
    "build_daily_history",
    "aggregate_by_type",
]
