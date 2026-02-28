"""
Constantes du domaine Transactions.
Source unique de vérité — ne jamais dupliquer ces valeurs ailleurs.
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
# CATÉGORIES
# =========================================================

TRANSACTION_CATEGORIES: list[str] = [
    "Alimentation",
    "Voiture",
    "Logement",
    "Loisirs",
    "Santé",
    "Shopping",
    "Services",
    "Autre",
]

# =========================================================
# SOURCES
# =========================================================

SOURCE_DEFAULT = "manual"

TRANSACTION_SOURCES: list[str] = [
    "manual",       # Saisie manuelle
    "ocr",          # Ticket scanné via OCR
    "pdf",          # Relevé ou facture PDF
    "csv",          # Import CSV
    "import_v2",    # Import CSV/Excel via la page d'import
    "ofx",          # Import fichier OFX/QFX bancaire
    "enable_banking",  # Import via API Enable Banking
]

