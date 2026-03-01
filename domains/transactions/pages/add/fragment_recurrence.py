"""
Fragment Récurrence — Création de transactions récurrentes.
"""

import logging
import time
from datetime import date

import streamlit as st

from shared.ui.toast_components import toast_success, toast_error
from ...database.constants import TRANSACTION_CATEGORIES, TRANSACTION_TYPES

logger = logging.getLogger(__name__)


def render_recurrence_fragment():
    """Formulaire de création d'une transaction récurrente."""
    st.subheader("🔁 Transaction Récurrente")

    with st.form("recurrence_form"):
        col1, col2 = st.columns(2)
        with col1:
            transaction_type = st.selectbox("Type", TRANSACTION_TYPES)
            cat_options = TRANSACTION_CATEGORIES + ["➕ Autre..."]
            category_sel = st.selectbox("Catégorie", cat_options)
            category = st.text_input("Nom de la catégorie") if category_sel == "➕ Autre..." else category_sel
            subcategory = st.text_input("Sous-catégorie")
            amount = st.number_input("Montant (€)", step=0.01, min_value=0.0)
        with col2:
            frequence = st.selectbox("Fréquence", ["Quotidien", "Hebdomadaire", "Mensuel", "Annuel"])
            date_debut = st.date_input("Date de début", value=date.today())
            date_fin = st.date_input("Date de fin (optionnel)", value=None)

        if st.form_submit_button("💾 Créer la récurrence", type="primary"):
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

