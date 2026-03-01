"""
Constantes du domaine Transactions.
Les catégories sont chargées depuis categories.yaml (modifiable par l'utilisateur).
Toutes les clés sont en FRANÇAIS.
"""

# =========================================================
# TYPES
# =========================================================

TYPE_DEPENSE = "Dépense"
TYPE_REVENU = "Revenu"
TYPE_TRANSFERT_PLUS = "Transfert+"
TYPE_TRANSFERT_MOINS = "Transfert-"

TRANSACTION_TYPES: list[str] = [
    TYPE_DEPENSE,
    TYPE_REVENU,
    TYPE_TRANSFERT_PLUS,
    TYPE_TRANSFERT_MOINS,
]

# =========================================================
# CATÉGORIES — chargées depuis categories.yaml
# =========================================================

# Fallback utilisé si le YAML est absent ou corrompu
_FALLBACK_CATEGORIES: list[str] = [
    "Alimentation",
    "Voiture",
    "Logement",
    "Loisirs",
    "Santé",
    "Shopping",
    "Services",
    "Autre",
]

def _load_categories() -> list[str]:
    try:
        from shared.utils.categories_loader import get_categories
        cats = get_categories()
        return cats if cats else _FALLBACK_CATEGORIES
    except Exception:
        return _FALLBACK_CATEGORIES

TRANSACTION_CATEGORIES: list[str] = _load_categories()

# =========================================================
# SOURCES
# =========================================================

SOURCE_DEFAULT = "manual"

TRANSACTION_SOURCES: list[str] = [
    "manual",
    "ocr",
    "pdf",
    "csv",
    "import_v2",
    "ofx",
    "enable_banking",
]

