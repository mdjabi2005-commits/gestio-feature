"""
Utilitaires DataFrame partagés pour la gestion des données transactionnelles.
Fournit des fonctions de création et conversion de DataFrames.
"""

import logging
from typing import List

import pandas as pd

logger = logging.getLogger(__name__)

# Colonnes standard pour les transactions
TRANSACTION_COLUMNS = [
    "id", "type", "categorie", "sous_categorie", "description",
    "montant", "date", "source", "recurrence", "date_fin",
    "compte_iban", "external_id"
]

# Colonnes standard pour les pièces jointes
ATTACHMENT_COLUMNS = [
    "id", "transaction_id", "file_name", "file_path",
    "file_type", "upload_date"
]


def create_empty_df(columns: List[str]) -> pd.DataFrame:
    """
    Crée un DataFrame vide avec les colonnes spécifiées.

    Args:
        columns: Liste des noms de colonnes

    Returns:
        DataFrame vide
    """
    return pd.DataFrame(columns=columns)


def create_empty_transaction_df() -> pd.DataFrame:
    """Crée un DataFrame vide avec les colonnes standard des transactions."""
    return create_empty_df(TRANSACTION_COLUMNS)


def create_empty_attachment_df() -> pd.DataFrame:
    """Crée un DataFrame vide avec les colonnes standard des pièces jointes."""
    return create_empty_df(ATTACHMENT_COLUMNS)


def convert_transaction_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    Convertit les types d'un DataFrame de transactions.

    - Convertit 'date' en objets date
    - Convertit 'montant' en float
    - Convertit 'id' en int

    Args:
        df: DataFrame brut depuis SQLite

    Returns:
        DataFrame avec types convertis
    """
    if df.empty:
        return create_empty_transaction_df()

    # Conversion date
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"]).apply(
            lambda x: x.date() if pd.notna(x) else None
        )

    # Conversion montant
    if "montant" in df.columns:
        df["montant"] = df["montant"].astype(float)

    # Conversion id
    if "id" in df.columns:
        df["id"] = df["id"].astype(int)

    return df


def convert_attachment_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    Convertit les types d'un DataFrame de pièces jointes.

    - Convertit 'upload_date' en datetime
    - Convertit 'id' en int
    - Convertit 'transaction_id' en int

    Args:
        df: DataFrame brut depuis SQLite

    Returns:
        DataFrame avec types convertis
    """
    if df.empty:
        return create_empty_attachment_df()

    if "upload_date" in df.columns:
        df["upload_date"] = pd.to_datetime(df["upload_date"])

    if "id" in df.columns:
        df["id"] = df["id"].astype(int)

    if "transaction_id" in df.columns:
        df["transaction_id"] = df["transaction_id"].astype(int)

    return df
