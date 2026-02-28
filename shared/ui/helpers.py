"""Helper functions for the UI."""

import streamlit as st


def refresh_and_rerun():
    """Refresh the page by forcing a rerun."""
    st.rerun()


def insert_transaction_batch():
    """Insert multiple transactions (legacy function)."""
    # This is a legacy function, not used in the new architecture
    pass


def load_transactions():
    """Load transactions (legacy function)."""
    # This is a legacy function, not used in the new architecture
    pass
