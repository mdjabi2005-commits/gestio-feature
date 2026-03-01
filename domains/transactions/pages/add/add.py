"""
Page d'Ajout de Transactions — Orchestrateur principal.
Délègue chaque mode à son fragment dédié.
"""

import streamlit as st

from .fragment_ocr import render_ocr_fragment
from .fragment_pdf import render_pdf_fragment
from .fragment_csv import render_csv_fragment
from .fragment_recurrence import render_recurrence_fragment


def interface_add_transaction():
    """Page principale d'ajout de transactions."""
    st.header("➕ Ajouter une Transaction")

    mode = st.selectbox(
        "📌 Mode d'ajout",
        options=[
            "📸 Scan OCR (Image)",
            "📄 Import PDF",
            "📄 Import CSV/Excel",
            "🔁 Transaction Récurrente",
        ],
        key="mode_selector",
        help="Sélectionnez comment vous souhaitez ajouter vos transactions"
    )

    st.markdown("---")

    if mode == "📸 Scan OCR (Image)":
        render_ocr_fragment()
    elif mode == "📄 Import PDF":
        render_pdf_fragment()
    elif mode == "📄 Import CSV/Excel":
        render_csv_fragment()
    else:
        render_recurrence_fragment()
