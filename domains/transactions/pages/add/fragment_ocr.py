"""
Fragment OCR — Scan de tickets (images) par batch.
Flux : upload/disque → extraction OCR → validation formulaire par ticket → save + attachment.
"""

import logging
import time
from pathlib import Path

import streamlit as st

from shared.ui.toast_components import toast_success, toast_error
from ...database.model import Transaction
from ...database.constants import TRANSACTION_TYPES
from shared.ui.category_manager import category_selector
from ...services.attachment_service import attachment_service
from ...services.transaction_service import transaction_service
from config.paths import TO_SCAN_DIR

logger = logging.getLogger(__name__)


def render_ocr_fragment():
    """Upload batch de tickets images → OCR → validation ticket par ticket."""
    st.subheader("📸 Scan par OCR (Simple & Rapide)")
    st.info("💡 Chargez vos tickets, vérifiez, et validez. Ils seront automatiquement rangés.")

    if "ocr_uploader_key" not in st.session_state:
        st.session_state.ocr_uploader_key = "ocr_uploader_0"

    scan_dir_path = Path(TO_SCAN_DIR)

    # 1. FICHIERS EN ATTENTE SUR LE DISQUE
    existing_files = [f for f in scan_dir_path.iterdir() if f.is_file() and f.suffix.lower() in [".jpg", ".jpeg", ".png"]]
    if existing_files:
        st.warning(f"📁 **{len(existing_files)} ticket(s) en attente** dans le dossier de scan.")
        if st.button(f"🚀 Analyser ces {len(existing_files)} tickets maintenant", type="primary", key="btn_ocr_disk"):
            st.session_state.ocr_disk_trigger = existing_files

    st.markdown("---")

    # 2. UPLOAD MANUEL
    uploaded_files = st.file_uploader(
        "Ou glissez-déposez de nouveaux tickets ici",
        type=["jpg", "jpeg", "png"],
        accept_multiple_files=True,
        key=st.session_state.ocr_uploader_key
    )

    if "ocr_batch" not in st.session_state:
        st.session_state.ocr_batch = {}
    if "ocr_cancel" not in st.session_state:
        st.session_state.ocr_cancel = False

    # 3. EXTRACTION BATCH
    disk_files_to_process = st.session_state.pop("ocr_disk_trigger", [])
    files_to_process = disk_files_to_process or uploaded_files

    if files_to_process:
        col_btn, col_cancel = st.columns([3, 1])
        with col_btn:
            start = st.button("🔍 Lancer le traitement", type="primary", key="btn_ocr_start")
        with col_cancel:
            if st.button("❌ Annuler", key="btn_ocr_cancel"):
                st.session_state.ocr_cancel = True

        if start or disk_files_to_process:
            _run_ocr_batch(files_to_process, scan_dir_path)

    # 4. VALIDATION
    st.markdown("---")
    st.subheader("✅ Validation des Tickets")

    if not st.session_state.get("ocr_batch"):
        st.info("Aucun ticket à valider. Importez des images ci-dessus.")
        return

    for fname, data in list(st.session_state.ocr_batch.items()):
        if data.get("saved", False):
            continue
        _render_ocr_ticket_form(fname, data)


def _run_ocr_batch(files_to_process: list, scan_dir_path: Path) -> None:
    """Exécute l'extraction OCR sur le batch et stocke les résultats en session."""
    from ...ocr.services.ocr_service import OCRService

    st.session_state.ocr_cancel = False
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
        with st.spinner("🤖 Groq analyse vos tickets..."):
            for count, f in enumerate(files_to_process, 1):
                if st.session_state.get("ocr_cancel", False):
                    raise InterruptedError("Annulé par l'utilisateur")

                if hasattr(f, 'name') and hasattr(f, 'read'):
                    fname = f.name
                    p = scan_dir_path / fname
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

    st.session_state.ocr_batch = {
        fname: {"transaction": trans, "error": err, "saved": False, "temp_path": str(scan_dir_path / fname)}
        for fname, trans, err, _ in results
    }

    if processed_count > 0:
        total_elapsed = time.time() - start_time
        st.toast(f"✅ {processed_count} ticket(s) traité(s) en {total_elapsed:.1f}s", icon="📸")


def _render_ocr_ticket_form(fname: str, data: dict) -> None:
    """Affiche le formulaire de validation pour un ticket OCR."""
    trans = data.get("transaction")
    err = data.get("error")
    temp_path = data.get("temp_path")

    with st.container(border=True):
        col_img, col_form = st.columns([1, 2])

        with col_img:
            if temp_path and Path(temp_path).exists():
                st.image(temp_path, use_container_width=True)
            else:
                st.error("Image introuvable (session expirée ?)")
            if err:
                st.error(f"Erreur OCR: {err}")

        with col_form:
            if not trans:
                st.warning("Impossible de lire ce ticket.")
                return

            # ── Sélection catégorie HORS form (permet st.rerun) ──
            f_cat, f_sub = category_selector(
                default_category=trans.categorie or "Autre",
                default_subcategory=trans.sous_categorie or "",
                key_prefix=f"ocr_{fname}"
            )

            with st.form(key=f"form_{fname}"):
                st.caption(f"Fichier : {fname}")
                c1, c2 = st.columns(2)
                with c1:
                    st.text_input("Catégorie", value=f_cat, disabled=True, key=f"cat_ro_{fname}")
                    st.text_input("Sous-catégorie", value=f_sub, disabled=True, key=f"sub_ro_{fname}")
                    f_desc = st.text_input("Description", value=trans.description or "", key=f"desc_{fname}")
                with c2:
                    f_type = st.selectbox("Type", TRANSACTION_TYPES, index=0, key=f"type_{fname}")
                    f_amt = st.number_input("Montant (€)", value=float(trans.montant), step=0.01, key=f"amt_{fname}")
                    f_date = st.date_input("Date", value=trans.date, key=f"date_{fname}")

                if st.form_submit_button("💾 Valider et Ranger", use_container_width=True, type="primary"):
                    _save_ocr_ticket(fname, f_type, f_cat, f_sub, f_desc, f_amt, f_date, temp_path)


def _save_ocr_ticket(fname: str, f_type: str, f_cat: str, f_sub: str,
                     f_desc: str, f_amt: float, f_date, temp_path: str) -> None:
    """Sauvegarde la transaction OCR validée et son attachment."""
    final_t = Transaction(
        type=f_type, categorie=f_cat, sous_categorie=f_sub, description=f_desc,
        montant=f_amt, date=f_date, source="ocr",
        recurrence=None, date_fin=None, compte_iban=None, external_id=None, id=None,
    )
    new_id = transaction_service.add(final_t)
    if new_id:
        success = attachment_service.add_attachment(
            transaction_id=new_id, file_obj=temp_path, filename=fname,
            category=f_cat, subcategory=f_sub, transaction_type=f_type
        )
        if success:
            toast_success("Ticket validé et rangé !")
            st.session_state.ocr_batch.pop(fname, None)
            if not st.session_state.ocr_batch:
                st.session_state.ocr_cancel = False
                st.session_state.ocr_uploader_key = f"ocr_uploader_{time.time()}"
            st.session_state.pop("all_transactions_df", None)
            st.cache_data.clear()
            time.sleep(1.5)
            st.rerun()
        else:
            toast_error("Transaction sauvée mais erreur lors du rangement du fichier.")
    else:
        toast_error("Erreur sauvegarde Transaction")

