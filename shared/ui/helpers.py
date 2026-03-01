"""Helper functions for the UI."""

import streamlit as st


def refresh_and_rerun():
    """Refresh the page by forcing a rerun and clearing some caches."""
    st.cache_data.clear()
    # On vide proprement les uploads/batchs OCR en cours s'il y en a pour "débloquer" l'interface.
    keys_to_clear = ['ocr_batch', 'ocr_cancel']
    for k in keys_to_clear:
        if k in st.session_state:
            del st.session_state[k]
    
    st.rerun()


def insert_transaction_batch():
    """Insert multiple transactions (legacy function)."""
    # This is a legacy function, not used in the new architecture
    pass


def load_transactions():
    """Load transactions (legacy function)."""
    # This is a legacy function, not used in the new architecture
    pass
