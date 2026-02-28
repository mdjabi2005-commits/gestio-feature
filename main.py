#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gestio V4 - Financial Management Application
Refactored modular version

@author: djabi
@version: 4.0 (Refactored)
@date: 2025-11-17
"""

import os

# Thème Gestio — défini AVANT import streamlit pour garantir
# la palette même si .streamlit/config.toml n'est pas trouvé.
os.environ.setdefault("STREAMLIT_THEME_BASE",                       "dark")
os.environ.setdefault("STREAMLIT_THEME_PRIMARY_COLOR",              "#10B981")
os.environ.setdefault("STREAMLIT_THEME_BACKGROUND_COLOR",           "#111827")
os.environ.setdefault("STREAMLIT_THEME_SECONDARY_BACKGROUND_COLOR", "#1E293B")
os.environ.setdefault("STREAMLIT_THEME_TEXT_COLOR",                 "#F8FAFC")
os.environ.setdefault("STREAMLIT_THEME_FONT",                       "sans serif")

import streamlit as st

# Initialize logging system FIRST (before any other imports)
from config.logging_config import setup_logging

setup_logging()

# ==============================
# STREAMLIT CONFIGURATION
# ==============================
st.set_page_config(
    page_title="Gestio V4 - Gestion Financière",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded"
)


# ==============================
# IMPORTS - Configuration
# ==============================
from config import (
    DB_PATH, TO_SCAN_DIR,
    REVENUS_A_TRAITER
)

# ==============================
# IMPORTS - Database
# ==============================
from domains.transactions.database.schema import (
    init_transaction_table,
    migrate_transaction_table
)
from domains.transactions.database.schema_table_recurrence import init_recurrence_table

# ==============================
# IMPORTS - UI
# ==============================
from shared.ui import load_all_styles, refresh_and_rerun

# ==============================
# IMPORTS - Pages
# ==============================
from domains.home.pages.home import interface_accueil
from domains.transactions.pages.add.add import interface_add_transaction
from domains.transactions.pages.view.view import interface_voir_transactions
from domains.transactions.pages.recurrences.recurrences import interface_recurrences

# ==============================
# LOGGING CONFIGURATION
# ==============================
from config.logging_config import get_logger

# Get logger for main module
logger = get_logger(__name__)

# ==============================
# DATABASE INITIALIZATION
# ==============================
try:
    init_transaction_table()
    migrate_transaction_table()
    init_recurrence_table()

    # Init attachments table
    from domains.transactions.database.schema import init_attachments_table

    init_attachments_table()
    # Auto-generate missing recurring transactions
    from domains.transactions.recurrence import backfill_all_recurrences

    created = backfill_all_recurrences()
    if created:
        logger.info(f"Recurrence backfill: {created} transactions created")

    logger.info("Database initialized successfully")
except Exception as e:
    logger.error(f"Database initialization failed: {e}")
    st.error(f"⚠️ Erreur d'initialisation de la base de données : {e}")

# ==============================
# LOAD STYLES
# ==============================
load_all_styles()


# ==============================
# MAIN APPLICATION
# ==============================
# noinspection PyShadowingNames
def main():
    """Main application router."""
    # noinspection PyShadowingNames
    try:
        # Sidebar Branding
        st.sidebar.title("💰 Gestio V4")

        # Navigation Setup (Native Streamlit)
        # Group pages by functionality
        page_accueil = st.Page(interface_accueil, title="Accueil", icon="🏠", default=True)
        page_view = st.Page(interface_voir_transactions, title="Voir Transactions", icon="📊", url_path="view")
        page_add = st.Page(interface_add_transaction, title="Ajouter Transaction", icon="➕", url_path="add")
        page_recurrences = st.Page(interface_recurrences, title="Récurrences", icon="🔄", url_path="recurrences")

        # Stocker les pages dans session_state pour switch_page()
        st.session_state["pages"] = {
            "accueil": page_accueil,
            "view": page_view,
            "add": page_add,
            "recurrences": page_recurrences,
        }

        pages = {
            "Tableau de Bord": [page_accueil, page_view],
            "Saisie": [page_add, page_recurrences],
        }

        pg = st.navigation(pages)

        # Sidebar Utilities
        st.sidebar.markdown("---")

        # Quick Refresh
        if st.sidebar.button("🔄 Rafraîchir", use_container_width=True):
            refresh_and_rerun()

        # Debug/Technical Info (Hidden by default)
        with st.sidebar.expander("ℹ️ Informations Techniques", expanded=False):
            st.markdown(f"**Version:** 4.0 (Refactored)")
            st.divider()
            st.caption("Base de données")
            st.code(DB_PATH, language="text")
            st.caption("Dossier Tickets")
            st.code(TO_SCAN_DIR, language="text")
            st.caption("Dossier Revenus")
            st.code(REVENUS_A_TRAITER, language="text")

        # Run the selected page
        pg.run()

    except Exception as e:
        from config.logging_config import log_error
        trace_id = log_error(e, "Application V4 failed")
        st.error(f"ERREUR CRITIQUE [TraceID: {trace_id}]: L'application V4 a rencontré une erreur.")
        st.exception(e)


# ==============================
# APPLICATION ENTRY POINT
# ==============================
if __name__ == "__main__":
    main()
