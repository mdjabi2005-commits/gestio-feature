"""
Fragment OCR — Scan de tickets (images) par batch.
Flux : upload/disque → extraction OCR → validation formulaire par ticket → save + attachment.
Refactorisé pour utiliser le module partagé batch_uploader.
"""

import logging
import os
import time
from pathlib import Path

import streamlit as st

from shared.ui.batch_uploader import (
    BatchConfig, init_batch_session, render_disk_files,
    render_batch_controls, render_batch_progress, render_validation_section,
    finalize_validation, handle_file_input, run_batch_processing
)
from shared.ui.toast_components import toast_success, toast_error
from ...database.model import Transaction
from ...database.constants import TRANSACTION_TYPES
from shared.ui.category_manager import category_selector
from ...services.attachment_service import attachment_service
from ...services.transaction_service import transaction_service
from config.paths import TO_SCAN_DIR

logger = logging.getLogger(__name__)

# Configuration batch OCR
OCR_CONFIG = BatchConfig(
    prefix="ocr",
    title="Tickets",
    extensions=[".jpg", ".jpeg", ".png"],
    dir_path=Path(TO_SCAN_DIR),
    disk_key="ocr_disk_trigger"
)


def _render_groq_status_banner() -> bool:
    """Affiche un bandeau selon l'état de la clé Groq."""
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    if groq_key:
        st.success(
            "🤖 **Catégorisation IA activée** — Groq analysera automatiquement vos tickets "
            "(montant, catégorie, description).",
            icon="✅",
        )
        return True
    else:
        st.warning(
            "⚠️ **Catégorisation IA désactivée** — Aucune clé Groq configurée.\n\n"
            "Sans Groq, l'OCR extrait uniquement le texte brut : les catégories et descriptions "
            "seront vides et devront être renseignées manuellement.\n\n"
            "👉 **Configurez votre clé Groq gratuitement dans ⚙️ Paramètres** pour automatiser "
            "la catégorisation de vos tickets en 1 seconde.",
        )
        if st.button("⚙️ Configurer Groq maintenant", key="btn_goto_settings", type="primary"):
            pages = st.session_state.get("pages", {})
            settings_page = pages.get("settings")
            if settings_page:
                st.switch_page(settings_page)
            else:
                st.info("Rendez-vous dans ⚙️ **Paramètres** dans le menu de navigation.")
        return False


def render_ocr_fragment():
    """Upload batch de tickets images → OCR → validation ticket par ticket."""
    st.subheader("📸 Scan par OCR (Simple & Rapide)")

    _render_groq_status_banner()
    st.info("💡 Chargez vos tickets, vérifiez, et validez. Ils seront automatiquement rangés.")

    init_batch_session(OCR_CONFIG.prefix)

    # 1. Fichiers sur le disque
    st.markdown("---")
    render_disk_files(OCR_CONFIG)

    # 2. Upload + bouton lancer (file_uploader rendu UNE seule fois dans render_batch_controls)
    render_batch_controls(OCR_CONFIG, _run_ocr_batch)

    # 3. Validation
    render_validation_section(OCR_CONFIG.prefix, OCR_CONFIG.title, _render_ocr_ticket_form)


def _get_ocr_service():
    """Retourne l'OCRService singleton process-level."""
    from ...ocr.services.ocr_service import get_ocr_service
    if "ocr_service_instance" not in st.session_state:
        with st.spinner("⏳ Chargement des modèles OCR (première utilisation)..."):
            st.session_state.ocr_service_instance = get_ocr_service()
    return st.session_state.ocr_service_instance


def _run_ocr_batch(files_to_process: list) -> None:
    """Exécute l'extraction OCR sur le batch."""
    ocr_service = _get_ocr_service()
    groq_active = bool(os.getenv("GROQ_API_KEY", "").strip())
    spinner_msg = "Groq categorise vos tickets..." if groq_active else "OCR en cours..."

    results, start_time = run_batch_processing(
        config=OCR_CONFIG,
        files_to_process=files_to_process,
        process_fn=ocr_service.process_document,
        spinner_msg=spinner_msg,
    )

    st.session_state.ocr_batch = {
        fname: {"transaction": trans, "error": err, "saved": False,
                "temp_path": str(OCR_CONFIG.dir_path / fname)}
        for fname, trans, err, _ in results
    }
    render_batch_progress(OCR_CONFIG.prefix, len(files_to_process), results, start_time)


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

            st.caption(f"📄 {fname}")
            c1, c2 = st.columns(2)
            with c1:
                f_cat, f_sub = category_selector(
                    default_category=trans.categorie or "Autre",
                    default_subcategory=trans.sous_categorie or "",
                    key_prefix=f"ocr_{fname}"
                )
                f_desc = st.text_input("Description", value=trans.description or "", key=f"desc_{fname}")
            with c2:
                f_type = st.selectbox("Type", TRANSACTION_TYPES, index=0, key=f"type_{fname}")
                f_amt = st.number_input("Montant (€)", value=float(trans.montant), step=0.01, key=f"amt_{fname}")
                f_date = st.date_input("Date", value=trans.date, key=f"date_{fname}")

            if st.button("💾 Valider et Ranger", key=f"save_{fname}", use_container_width=True, type="primary"):
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
            finalize_validation(OCR_CONFIG.prefix, fname)
        else:
            toast_error("Transaction sauvée mais erreur lors du rangement du fichier.")
    else:
        toast_error("Erreur sauvegarde Transaction")
