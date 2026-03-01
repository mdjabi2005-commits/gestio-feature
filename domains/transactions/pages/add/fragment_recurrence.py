"""
Fragment Récurrence — Création de transactions récurrentes.
"""

import logging
import time
from datetime import date

import streamlit as st

from shared.ui.toast_components import toast_success, toast_error
from ...database.constants import TRANSACTION_TYPES
from shared.ui.category_manager import category_selector

logger = logging.getLogger(__name__)


def render_recurrence_fragment():
    """Formulaire de création d'une transaction récurrente."""
    st.subheader("🔁 Transaction Récurrente")

    col1, col2 = st.columns(2)
    with col1:
        transaction_type = st.selectbox("Type", TRANSACTION_TYPES, key="rec_type")
        category, subcategory = category_selector(key_prefix="rec")
        amount = st.number_input("Montant (€)", step=0.01, min_value=0.0, key="rec_amount")
    with col2:
        frequence = st.selectbox("Fréquence", ["Quotidien", "Hebdomadaire", "Mensuel", "Annuel"], key="rec_freq")
        date_debut = st.date_input("Date de début", value=date.today(), key="rec_date_debut")
        date_fin = st.date_input("Date de fin (optionnel)", value=None, key="rec_date_fin")

    if st.button("💾 Créer la récurrence", type="primary", use_container_width=True, key="rec_submit"):
        _save_recurrence(transaction_type, category, subcategory, amount, frequence, date_debut, date_fin)


def _save_recurrence(transaction_type: str, category: str, subcategory: str,
                     amount: float, frequence: str, date_debut, date_fin) -> None:
    """Persiste la récurrence en base."""
    try:
        from ...database.repository_recurrence import RecurrenceRepository
        from ...database.model_recurrence import Recurrence

        repo = RecurrenceRepository()
        new_rec = Recurrence(
            type=transaction_type, categorie=category, sous_categorie=subcategory,
            montant=amount, frequence=frequence, date_debut=date_debut,
            date_fin=date_fin if date_fin else None,
            description=f"Recurrence auto: {category}",
            id=None, statut="active", date_creation=None, date_modification=None,
        )
        if repo.add_recurrence(new_rec):
            toast_success("Récurrence créée !")
            st.session_state.pop("all_transactions_df", None)
            st.cache_data.clear()
            time.sleep(1.5)
            st.rerun()
        else:
            toast_error("Erreur")
    except Exception as e:
        toast_error(f"Erreur: {e}")
