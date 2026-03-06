"""
Fragment PDF — Import de PDFs (revenus) par batch.
Flux : upload/disque → extraction OCR PDF → validation formulaire par PDF → save + attachment.
Refactorisé pour utiliser le module partagé batch_uploader.
"""

import logging
from datetime import date as date_type
from pathlib import Path

import streamlit as st

from shared.ui.batch_uploader import (
    BatchConfig, init_batch_session, render_disk_files,
    render_batch_controls, render_batch_progress, render_validation_section,
    finalize_validation, run_batch_processing
)
from shared.ui.toast_components import toast_success, toast_error
from ...database.model import Transaction
from ...database.constants import TRANSACTION_TYPES
from shared.ui.category_manager import category_selector
from ...services.attachment_service import attachment_service
from ...services.transaction_service import transaction_service
from config.paths import REVENUS_A_TRAITER

logger = logging.getLogger(__name__)

# Configuration batch PDF
PDF_CONFIG = BatchConfig(
    prefix="pdf",
    title="PDFs",
    extensions=[".pdf"],
    dir_path=Path(REVENUS_A_TRAITER),
    disk_key="pdf_disk_trigger"
)


def render_pdf_fragment():
    """Upload batch de PDFs → extraction → validation PDF par PDF."""
    st.subheader("📄 Import PDF (Revenus)")
    st.info("💡 Chargez vos PDFs, vérifiez les données extraites, et validez.")

    init_batch_session(PDF_CONFIG.prefix)

    # 1. Fichiers sur le disque
    st.markdown("---")
    render_disk_files(PDF_CONFIG)

    # 2. Upload + bouton lancer (file_uploader rendu UNE seule fois dans render_batch_controls)
    render_batch_controls(PDF_CONFIG, _run_pdf_batch)

    # 3. Validation
    render_validation_section(PDF_CONFIG.prefix, PDF_CONFIG.title, _render_pdf_form)


def _run_pdf_batch(files_to_process: list) -> None:
    """Exécute l'extraction PDF sur le batch."""
    from ...ocr.services.ocr_service import OCRService
    ocr_service = OCRService()

    results, start_time = run_batch_processing(
        config=PDF_CONFIG,
        files_to_process=files_to_process,
        process_fn=ocr_service.process_document,
        spinner_msg="Extraction des donnees PDF en cours...",
    )

    st.session_state.pdf_batch = {
        fname: {"transaction": trans, "error": err, "saved": False,
                "temp_path": str(PDF_CONFIG.dir_path / fname)}
        for fname, trans, err, _ in results
    }
    render_batch_progress(PDF_CONFIG.prefix, len(files_to_process), results, start_time)


def _render_pdf_form(fname: str, data: dict) -> None:
    """Affiche le formulaire de validation pour un PDF."""
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

        c1, c2 = st.columns(2)
        with c1:
            cat, sub = category_selector(
                default_category=trans.categorie or "Autre",
                default_subcategory=trans.sous_categorie or "Relevé",
                key_prefix=f"pdf_{fname}"
            )
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

        if st.button("💾 Valider et Ranger", key=f"save_pdf_{fname}", use_container_width=True, type="primary"):
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
        finalize_validation(PDF_CONFIG.prefix, fname)
    else:
        toast_error("Erreur sauvegarde Transaction")
