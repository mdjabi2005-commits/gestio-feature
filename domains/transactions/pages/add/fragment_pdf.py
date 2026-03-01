"""
Fragment PDF — Import de PDFs (revenus) par batch.
Flux : upload/disque → extraction OCR PDF → validation formulaire par PDF → save + attachment.
"""

import logging
import time
from pathlib import Path

import streamlit as st

from shared.ui.toast_components import toast_success, toast_error
from ...database.model import Transaction
from ...database.constants import TRANSACTION_CATEGORIES, TRANSACTION_TYPES
from ...services.attachment_service import attachment_service
from ...services.transaction_service import transaction_service
from config.paths import REVENUS_A_TRAITER

logger = logging.getLogger(__name__)


def render_pdf_fragment():
    """Upload batch de PDFs → extraction → validation PDF par PDF."""
    st.subheader("📄 Import PDF (Revenus)")
    st.info("💡 Chargez vos PDFs, vérifiez les données extraites, et validez.")

    if "pdf_uploader_key" not in st.session_state:
        st.session_state.pdf_uploader_key = "pdf_uploader_0"

    revenus_dir_path = Path(REVENUS_A_TRAITER)

    # 1. FICHIERS EN ATTENTE SUR LE DISQUE
    existing_pdfs = [f for f in revenus_dir_path.iterdir() if f.is_file() and f.suffix.lower() == ".pdf"]
    if existing_pdfs:
        st.warning(f"📁 **{len(existing_pdfs)} PDF(s) en attente** dans le dossier revenus.")
        if st.button(f"🚀 Analyser ces {len(existing_pdfs)} PDFs", type="primary", key="btn_pdf_disk"):
            st.session_state.pdf_disk_trigger = existing_pdfs

    st.markdown("---")

    # 2. UPLOAD MANUEL (multi-fichiers)
    uploaded_files = st.file_uploader(
        "Ou glissez-déposez vos PDFs ici",
        type=["pdf"],
        accept_multiple_files=True,
        key=st.session_state.pdf_uploader_key
    )

    if "pdf_batch" not in st.session_state:
        st.session_state.pdf_batch = {}
    if "pdf_cancel" not in st.session_state:
        st.session_state.pdf_cancel = False

    # 3. EXTRACTION BATCH
    disk_pdfs_to_process = st.session_state.pop("pdf_disk_trigger", [])
    files_to_process = disk_pdfs_to_process or uploaded_files

    if files_to_process:
        col_btn, col_cancel = st.columns([3, 1])
        with col_btn:
            start = st.button("🔍 Lancer l'extraction", type="primary", key="btn_pdf_start")
        with col_cancel:
            if st.button("❌ Annuler", key="btn_pdf_cancel"):
                st.session_state.pdf_cancel = True

        if start or disk_pdfs_to_process:
            _run_pdf_batch(files_to_process, revenus_dir_path)

    # 4. VALIDATION
    st.markdown("---")
    st.subheader("✅ Validation des PDFs")

    if not st.session_state.get("pdf_batch"):
        st.info("Aucun PDF à valider. Importez des fichiers ci-dessus.")
        return

    for fname, data in list(st.session_state.pdf_batch.items()):
        if data.get("saved", False):
            continue
        _render_pdf_form(fname, data)


def _run_pdf_batch(files_to_process: list, revenus_dir_path: Path) -> None:
    """Exécute l'extraction PDF sur le batch et stocke les résultats en session."""
    from ...ocr.services.ocr_service import OCRService

    st.session_state.pdf_cancel = False
    total = len(files_to_process)
    results = []

    ui_placeholder = st.empty()
    with ui_placeholder.container():
        progress_bar = st.progress(0)
        status_text = st.empty()
        timer_text = st.empty()

    ocr_service = OCRService()
    start_time = time.time()

    try:
        with st.spinner("📄 Extraction des données PDF en cours..."):
            for count, f in enumerate(files_to_process, 1):
                if st.session_state.get("pdf_cancel", False):
                    raise InterruptedError("Annulé par l'utilisateur")

                if hasattr(f, 'name') and hasattr(f, 'read'):
                    fname = f.name
                    p = revenus_dir_path / fname
                    f.seek(0)
                    p.write_bytes(f.read())
                else:
                    p = f
                    fname = p.name

                progress_bar.progress((count - 1) / total)
                status_text.text(f"⏳ Traitement : {fname}  ({count}/{total})")
                doc_start = time.time()
                try:
                    trans = ocr_service.process_document(str(p))
                    results.append((fname, trans, None, time.time() - doc_start))
                except Exception as e:
                    results.append((fname, None, str(e), time.time() - doc_start))

                elapsed = time.time() - start_time
                progress_bar.progress(count / total)
                status_text.text(f"✅ Traité : {fname}  ({count}/{total})")
                timer_text.caption(f"⏱️ Temps écoulé : {elapsed:.1f}s")

        processed_count = len([r for r in results if r[2] is None])
    except InterruptedError:
        st.warning("⚠️ Traitement annulé.")
        results = []
        processed_count = 0
    except Exception as e:
        st.error(f"Erreur inattendue : {e}")
        results = []
        processed_count = 0

    ui_placeholder.empty()

    st.session_state.pdf_batch = {
        fname: {"transaction": trans, "error": err, "saved": False, "temp_path": str(revenus_dir_path / fname)}
        for fname, trans, err, _ in results
    }

    if processed_count > 0:
        total_elapsed = time.time() - start_time
        st.toast(f"✅ {processed_count} PDF(s) traité(s) en {total_elapsed:.1f}s", icon="📄")


def _render_pdf_form(fname: str, data: dict) -> None:
    """Affiche le formulaire de validation pour un PDF."""
    from datetime import date as date_type

    trans = data.get("transaction")
    err = data.get("error")
    temp_path = data.get("temp_path")

    with st.container(border=True):
        st.markdown(f"📄 **{fname}**")

        if err:
            st.error(f"Erreur extraction : {err}")
            if st.button("🗑️ Ignorer", key=f"skip_{fname}"):
                del st.session_state.pdf_batch[fname]
                st.rerun()
            return

        if not trans:
            st.warning("Impossible d'extraire les données de ce PDF.")
            return

        with st.form(key=f"pdf_form_{fname}"):
            c1, c2 = st.columns(2)
            with c1:
                cat = st.selectbox(
                    "Catégorie", TRANSACTION_CATEGORIES,
                    index=TRANSACTION_CATEGORIES.index(trans.categorie) if trans.categorie in TRANSACTION_CATEGORIES else 0,
                    key=f"pcat_{fname}"
                )
                sub = st.text_input("Sous-catégorie", value=trans.sous_categorie or "Relevé", key=f"psub_{fname}")
                desc = st.text_input("Description", value=trans.description or "", key=f"pdesc_{fname}")
            with c2:
                amt = st.number_input("Montant (€)", value=float(trans.montant) if trans.montant else 0.0,
                                      step=0.01, key=f"pamt_{fname}")
                dt = st.date_input("Date", value=trans.date if trans.date else date_type.today(), key=f"pdt_{fname}")
                tx_type = st.selectbox(
                    "Type", TRANSACTION_TYPES,
                    index=TRANSACTION_TYPES.index(trans.type) if trans.type in TRANSACTION_TYPES else 0,
                    key=f"ptype_{fname}"
                )

            if st.form_submit_button("💾 Valider et Ranger", use_container_width=True, type="primary"):
                _save_pdf(fname, tx_type, cat, sub, desc, amt, dt, temp_path)


def _save_pdf(fname: str, tx_type: str, cat: str, sub: str,
              desc: str, amt: float, dt, temp_path: str) -> None:
    """Sauvegarde la transaction PDF validée et son attachment."""
    final_t = Transaction(
        type=tx_type, categorie=cat, sous_categorie=sub, description=desc,
        montant=amt, date=dt, source="pdf",
        recurrence=None, date_fin=None, compte_iban=None, external_id=None, id=None,
    )
    new_id = transaction_service.add(final_t)
    if new_id:
        attachment_service.add_attachment(
            transaction_id=new_id, file_obj=temp_path, filename=fname,
            category=cat, subcategory=sub, transaction_type=tx_type
        )
        toast_success("PDF validé et rangé !")
        st.session_state.pdf_batch.pop(fname, None)
        if not st.session_state.pdf_batch:
            st.session_state.pdf_cancel = False
            st.session_state.pdf_uploader_key = f"pdf_uploader_{time.time()}"
        st.session_state.pop("all_transactions_df", None)
        st.cache_data.clear()
        time.sleep(1.5)
        st.rerun()
    else:
        toast_error("Erreur sauvegarde Transaction")

