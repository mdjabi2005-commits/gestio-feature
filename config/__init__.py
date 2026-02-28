"""Configuration module for Gestio Financial Management."""

from .paths import (
    DATA_DIR, DB_PATH, TO_SCAN_DIR, SORTED_DIR,
    REVENUS_A_TRAITER, REVENUS_TRAITES,
    CSV_EXPORT_DIR, CSV_TRANSACTIONS_SANS_TICKETS
)

__all__ = [
    # Paths
    'DATA_DIR', 'DB_PATH', 'TO_SCAN_DIR', 'SORTED_DIR',
    'REVENUS_A_TRAITER', 'REVENUS_TRAITES',
    'CSV_EXPORT_DIR', 'CSV_TRANSACTIONS_SANS_TICKETS',
]
