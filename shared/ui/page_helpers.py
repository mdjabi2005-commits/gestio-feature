"""
Helpers UI partagés pour les pages Streamlit.
Fournit des fonctions utilitaires pour l'interface utilisateur.
"""

import streamlit as st


def create_uploader_key(name: str) -> str:
    """
    Crée une clé unique pour uploader Streamlit.

    Args:
        name: Nom de base pour l'uploader

    Returns:
        Clé unique basée sur le nom
    """
    return f"uploader_{name}_{id(name)}"


def refresh_and_rerun():
    """Refresh the page by forcing a rerun and clearing some caches."""
    st.cache_data.clear()
    # On vide proprement les uploads/batchs OCR en cours s'il y en a pour "débloquer" l'interface.
    keys_to_clear = ['ocr_batch', 'ocr_cancel']
    for k in keys_to_clear:
        if k in st.session_state:
            del st.session_state[k]

    st.rerun()


# =============================================================================
# DATA EDITOR CONFIG - Configuration des colonnes pour st.data_editor
# =============================================================================

def get_column_config() -> dict:
    """
    Retourne la configuration des colonnes pour st.data_editor.

    Returns:
        Dict de configuration par nom de colonne
    """
    return {
        "id": {
            "disabled": True,
            "hidden": True,
        },
        "date": st.column_config.DateColumn(
            "Date",
            format="DD/MM/YYYY",
            required=True,
        ),
        "type": st.column_config.SelectboxColumn(
            "Type",
            options=["Dépense", "Revenu"],
            required=True,
        ),
        "categorie": st.column_config.SelectboxColumn(
            "Catégorie",
            options=[
                "Alimentation", "Transport", "Logement", "Loisirs",
                "Santé", "Services", "Shopping", "Autre"
            ],
            required=True,
        ),
        "sous_categorie": st.column_config.TextColumn(
            "Sous-catégorie",
            max_chars=50,
        ),
        "description": st.column_config.TextColumn(
            "Description",
            max_chars=100,
        ),
        "montant": st.column_config.NumberColumn(
            "Montant (€)",
            format="%.2f €",
            required=True,
        ),
        "source": st.column_config.TextColumn(
            "Source",
            disabled=True,
        ),
        "recurrence": st.column_config.TextColumn(
            "Récurrence",
            max_chars=20,
        ),
        "date_fin": st.column_config.DateColumn(
            "Date fin",
            format="DD/MM/YYYY",
        ),
        "compte_iban": st.column_config.TextColumn(
            "Compte IBAN",
            max_chars=34,
        ),
        "external_id": st.column_config.TextColumn(
            "External ID",
            hidden=True,
        ),
    }
