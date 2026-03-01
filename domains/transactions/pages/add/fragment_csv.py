"""
Fragment CSV — Import de fichiers CSV/Excel.
Logique complète : upload → mapping colonnes → éditeur → import en base.
"""

import logging
from datetime import datetime, date

import pandas as pd
import streamlit as st

from shared.ui.toast_components import toast_success, toast_error, toast_warning
from shared.utils import parse_amount
from ...database.constants import TRANSACTION_CATEGORIES
from ...database.repository import transaction_repository

logger = logging.getLogger(__name__)


# ─── Helpers ────────────────────────────────────────────────

def _load_file(uploaded_file) -> pd.DataFrame:
    """Charge un fichier CSV ou Excel en DataFrame."""
    if uploaded_file.name.lower().endswith('.csv'):
        try:
            df = pd.read_csv(uploaded_file, sep=None, engine='python')
        except Exception:
            uploaded_file.seek(0)
            df = pd.read_csv(uploaded_file, sep=';')
    else:
        df = pd.read_excel(uploaded_file)
    df.columns = df.columns.astype(str).str.strip()
    return df


def _detect_columns(df: pd.DataFrame) -> dict:
    """Détecte automatiquement les colonnes date, montant, catégorie."""
    cols = df.columns.tolist()
    mapping = {"date": None, "amount": None, "cat": None}
    keywords = {
        "date": ["date", "time", "jour", "opér"],
        "amount": ["montant", "amount", "solde", "euro", "debit", "credit"],
        "cat": ["caté", "cate", "type", "class"],
    }
    for field, keys in keywords.items():
        for col in cols:
            if any(k in col.lower() for k in keys) and mapping[field] is None:
                mapping[field] = col
                break
    return mapping


# ─── Étapes ─────────────────────────────────────────────────

def _step_config(df: pd.DataFrame) -> None:
    """Étape 1 : mapping des colonnes."""
    st.subheader("1️⃣ Mapper les colonnes")
    st.info("Indiquez quelle colonne correspond à chaque champ.")
    st.write(f"**{len(df)} lignes détectées**")
    st.dataframe(df.head(3), use_container_width=True)

    cols = ["Aucune"] + df.columns.tolist()
    detected = _detect_columns(df)

    def idx(val):
        return cols.index(val) if val in cols else 0

    with st.form("csv_config"):
        c1, c2, c3 = st.columns(3)
        with c1:
            date_col = st.selectbox("📅 Date", cols, index=idx(detected["date"]))
        with c2:
            amount_col = st.selectbox("💰 Montant", cols, index=idx(detected["amount"]))
        with c3:
            cat_col = st.selectbox("🏷️ Catégorie", cols, index=idx(detected["cat"]))

        if st.form_submit_button("Suivant →", type="primary"):
            if date_col == "Aucune" or amount_col == "Aucune":
                toast_error("Date et Montant sont requis.")
                return

            rows = []
            for _, row in df.iterrows():
                try:
                    parsed = pd.to_datetime(row[date_col], dayfirst=True, errors='coerce')
                    d = pd.Timestamp(parsed).to_pydatetime().date() if not pd.isna(parsed) else date.today()
                except Exception:
                    d = date.today()

                amt = parse_amount(row[amount_col])
                cat = "Autre"
                if cat_col != "Aucune":
                    raw = str(row[cat_col]).strip().lower()
                    cat = next((c for c in TRANSACTION_CATEGORIES if c.lower() == raw), "Autre")

                rows.append({
                    "date": d,
                    "type": "Revenu" if amt > 0 else "Dépense",
                    "montant": abs(amt),
                    "categorie": cat,
                    "sous_categorie": "",
                    "description": "",
                })

            st.session_state.csv_draft_df = pd.DataFrame(rows)
            st.session_state.csv_step = "editor"
            st.rerun()


def _step_editor() -> None:
    """Étape 2 : édition et import."""
    draft_df: pd.DataFrame = st.session_state.csv_draft_df

    st.subheader("2️⃣ Vérifier et corriger")
    st.info("Modifiez les lignes si nécessaire, puis cliquez sur Importer.")

    if st.button("← Retour"):
        st.session_state.csv_step = "config"
        st.rerun()

    column_cfg = {
        "date": st.column_config.DateColumn("Date", required=True, format="DD/MM/YYYY"),
        "type": st.column_config.SelectboxColumn("Type", options=["Revenu", "Dépense"], required=True),
        "montant": st.column_config.NumberColumn("Montant €", min_value=0.0, format="%.2f"),
        "categorie": st.column_config.SelectboxColumn("Catégorie", options=TRANSACTION_CATEGORIES, required=True),
        "sous_categorie": st.column_config.TextColumn("Sous-Catégorie"),
        "description": st.column_config.TextColumn("Description"),
    }

    edited_df = st.data_editor(draft_df, column_config=column_cfg,
                                use_container_width=True, num_rows="dynamic", height=500)
    st.write(f"**{len(edited_df)} transactions prêtes**")

    if st.button("🚀 Importer", type="primary"):
        success, errors = 0, 0
        prog = st.progress(0)
        total = len(edited_df)
        for i, (_, row) in enumerate(edited_df.iterrows()):
            try:
                d_val = row["date"]
                date_str = d_val.isoformat() if isinstance(d_val, (date, datetime)) else str(d_val)
                tx = {
                    "date": date_str, "montant": float(row["montant"]),
                    "type": row["type"], "categorie": row["categorie"],
                    "sous_categorie": str(row.get("sous_categorie", "")),
                    "description": str(row.get("description", "")),
                    "source": "import_v2", "external_id": None,
                }
                if transaction_repository.add(tx):
                    success += 1
                else:
                    errors += 1
            except Exception:
                errors += 1
            prog.progress(int((i + 1) / total * 100))

        toast_success(f"✅ {success} importées | ❌ {errors} erreurs")
        if errors > 0:
            toast_warning("Certaines lignes n'ont pas pu être importées.")
        st.session_state.csv_step = "config"
        st.session_state.csv_draft_df = None


# ─── Point d'entrée ─────────────────────────────────────────

def render_csv_fragment():
    """Import de relevés bancaires CSV/Excel."""
    st.subheader("📄 Import CSV/Excel")
    st.info("💡 Importez vos relevés bancaires au format CSV ou Excel.")

    if "csv_step" not in st.session_state:
        st.session_state.csv_step = "config"
    if "csv_draft_df" not in st.session_state:
        st.session_state.csv_draft_df = None

    uploaded_file = st.file_uploader("Choisir un fichier (CSV/Excel)", type=["csv", "xlsx"])

    if uploaded_file is not None:
        file_id = f"{uploaded_file.name}_{uploaded_file.size}"
        if st.session_state.get("csv_file_id") != file_id:
            st.session_state.csv_draft_df = _load_file(uploaded_file)
            st.session_state.csv_file_id = file_id
            st.session_state.csv_step = "config"
            st.rerun()
    else:
        st.session_state.csv_step = "config"
        st.session_state.csv_draft_df = None
        return

    if st.session_state.csv_step == "config" and st.session_state.csv_draft_df is not None:
        _step_config(st.session_state.csv_draft_df)
    elif st.session_state.csv_step == "editor" and st.session_state.csv_draft_df is not None:
        _step_editor()
