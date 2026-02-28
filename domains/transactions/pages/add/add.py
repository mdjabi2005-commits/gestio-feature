# noinspection GrazieInspection
"""
Page d'Ajout de Transactions
Interface unifiée pour ajouter des transactions.
Version simplifiée : OCR Batch -> Validation -> Rangement automatique.
Refactorisé avec st.fragment pour pywebview.
"""

import concurrent.futures
import logging
import time
from datetime import date, datetime
from pathlib import Path

import streamlit as st

from shared.ui.toast_components import toast_success, toast_error
from ..import_page.import_page import import_transactions_page
from ...database.model import Transaction
from ...database.constants import TRANSACTION_CATEGORIES, TRANSACTION_TYPES
from ...ocr.core.hardware_utils import get_optimal_workers
from ...services.attachment_service import attachment_service
from ...services.transaction_service import transaction_service


logger = logging.getLogger(__name__)

TEMP_OCR_DIR = Path("temp_ocr")


# ============================================================
# FRAGMENT 1: OCR UPLOAD & TRAITEMENT
# ============================================================
def render_ocr_upload_fragment():
    """
    Fragment pour l'upload et le traitement OCR.
    Se recharge indépendamment lors de l'upload de nouveaux fichiers.
    """
    st.subheader("📸 Scan par OCR (Simple & Rapide)")
    st.info("💡 Chargez vos tickets, vérifiez, et validez. Ils seront automatiquement rangés.")

    # 1. UPLOAD
    uploaded_files = st.file_uploader(
        "Choisissez vos images (Tickets)",
        type=["jpg", "jpeg", "png"],
        accept_multiple_files=True,
        key="ocr_uploader"
    )

    # 2. SESSION STATE
    if "ocr_batch" not in st.session_state:
        st.session_state.ocr_batch = {}
    if "ocr_cancel" not in st.session_state:
        st.session_state.ocr_cancel = False

    # 3. EXTRACTION
    if uploaded_files:
        col_btn, col_cancel = st.columns([3, 1])
        with col_btn:
            start = st.button("🔍 Lancer le traitement", type="primary", key="btn_ocr_start")
        with col_cancel:
            if st.button("❌ Annuler", key="btn_ocr_cancel"):
                st.session_state.ocr_cancel = True

        if start:
            st.session_state.ocr_cancel = False
            total = len(uploaded_files)
            max_workers = get_optimal_workers(total)

            results = []
            processed_count = 0

            progress_bar = st.progress(0)
            status_text = st.empty()
            timer_text = st.empty()

            # Info workers
            st.caption(f"⚙️ {max_workers} workers CPU activés pour {total} ticket(s)")

            # Assurer que le dossier temp existe
            TEMP_OCR_DIR.mkdir(exist_ok=True)

            # Sauvegarde des fichiers uploadés sur disque
            paths = []
            for f in uploaded_files:
                p = TEMP_OCR_DIR / f.name  # type: ignore[union-attr]
                f.seek(0)  # type: ignore[union-attr]
                p.write_bytes(f.read())  # type: ignore[union-attr]
                paths.append(str(p))

            # Import ici pour éviter tout effet de bord au niveau module
            from ...ocr.services.ocr_service import process_ticket_standalone

            start_time = time.time()

            executor = concurrent.futures.ProcessPoolExecutor(max_workers=max_workers)
            try:
                future_to_name = {
                    executor.submit(process_ticket_standalone, p): Path(p).name
                    for p in paths
                }

                for future in concurrent.futures.as_completed(future_to_name):
                    # Vérifier si l'utilisateur a cliqué Annuler
                    if st.session_state.get("ocr_cancel", False):
                        executor.shutdown(wait=False, cancel_futures=True)
                        status_text.warning("⚠️ Traitement annulé.")
                        progress_bar.empty()
                        timer_text.empty()
                        break

                    fname = future_to_name[future]
                    elapsed = time.time() - start_time

                    try:
                        result_dict = future.result()
                        # Reconstruire la Transaction depuis le dict (frontière inter-process)
                        if result_dict["error"] is None:
                            parsed_date = (
                                datetime.fromisoformat(result_dict["date"]).date()
                                if result_dict["date"] else date.today()
                            )
                            trans = Transaction(
                                type="Dépense",
                                categorie="Non catégorisé",
                                montant=result_dict["montant"] or 0.0,
                                date=parsed_date,
                                description="",
                                source="ocr",
                                sous_categorie=None,
                                recurrence=None,
                                date_fin=None,
                                compte_iban=None,
                                external_id=None,
                                id=None,
                            )
                            results.append((fname, trans, None))
                        else:
                            results.append((fname, None, result_dict["error"]))
                    except Exception as e:
                        results.append((fname, None, str(e)))

                    processed_count += 1
                    progress_bar.progress(processed_count / total)
                    status_text.text(f"✅ Traité : {fname}  ({processed_count}/{total})")
                    timer_text.caption(f"⏱️ Temps écoulé : {elapsed:.1f}s")

            finally:
                executor.shutdown(wait=False)

            # Mise à jour session
            st.session_state.ocr_batch = {}
            for fname, trans, err in results:
                st.session_state.ocr_batch[fname] = {
                    "transaction": trans,
                    "error": err,
                    "saved": False,
                    "temp_path": str(TEMP_OCR_DIR / fname)
                }

            total_elapsed = time.time() - start_time
            if processed_count > 0:
                st.toast(
                    f"✅ {processed_count} ticket(s) traité(s) en {total_elapsed:.1f}s "
                    f"({max_workers} cœurs)",
                    icon="📸"
                )
            status_text.empty()
            progress_bar.empty()
            timer_text.empty()



# ============================================================
# FRAGMENT 2: OCR VALIDATION
# ============================================================
def render_ocr_validation_fragment():
    """
    Fragment pour la validation des tickets OCR.
    Se recharge indépendamment lors de la validation/modification.
    """
    st.markdown("---")
    st.subheader("✅ Validation des Tickets")

    if not st.session_state.get("ocr_batch"):
        st.info("Aucun ticket à valider. Importez des images ci-dessus.")
        return

    # Pour chaque ticket
    for fname, data in list(st.session_state.ocr_batch.items()):
        if data.get("saved", False):
            continue

        trans = data.get("transaction")
        err = data.get("error")
        temp_path = data.get("temp_path")

        with st.container(border=True):
            col_img, col_form = st.columns([1, 2])

            # Image
            with col_img:
                if temp_path and Path(temp_path).exists():
                    st.image(temp_path, use_container_width=True)
                else:
                    st.error("Image introuvable (session expirée ?)")

                if err:
                    st.error(f"Erreur OCR: {err}")

            # Formulaire
            with col_form:
                if not trans:
                    st.warning("Impossible de lire ce ticket.")
                    continue

                with st.form(key=f"form_{fname}"):
                    st.caption(f"Fichier : {fname}")

                    c1, c2 = st.columns(2)
                    with c1:
                        cat_options = TRANSACTION_CATEGORIES + ["➕ Autre..."]
                        f_cat_sel = st.selectbox("Catégorie", cat_options, key=f"cat_{fname}")
                        if f_cat_sel == "➕ Autre...":
                            f_cat = st.text_input("Nouvelle catégorie", key=f"newcat_{fname}")
                        else:
                            f_cat = f_cat_sel

                        f_sub = st.text_input("Sous-catégorie", value=trans.sous_categorie or "", key=f"sub_{fname}")
                        f_desc = st.text_input("Description", value=trans.description or "", key=f"desc_{fname}")

                    with c2:
                        f_amt = st.number_input("Montant (€)", value=float(trans.montant), step=0.01,
                                                key=f"amt_{fname}")
                        f_date = st.date_input("Date", value=trans.date, key=f"date_{fname}")

                    sender = st.form_submit_button("💾 Valider et Ranger", use_container_width=True, type="primary")

                    if sender:
                        # 1. Créer Transaction (avec clés FR)
                        final_t = Transaction(
                            type="Dépense",
                            categorie=f_cat,
                            sous_categorie=f_sub,
                            description=f_desc,
                            montant=f_amt,
                            date=f_date,
                            source="ocr",
                            recurrence=None,
                            date_fin=None,
                            compte_iban=None,
                            external_id=None,
                            id=None,
                        )

                        new_id = transaction_service.add(final_t)

                        if new_id:
                            # 2. Attacher et Ranger le fichier
                            success = attachment_service.add_attachment(
                                transaction_id=new_id,
                                file_obj=temp_path,
                                filename=fname,
                                category=f_cat,
                                subcategory=f_sub,
                                transaction_type="Dépense"
                            )

                            if success:
                                toast_success("Ticket validé et rangé !")
                                st.session_state.ocr_batch[fname]["saved"] = True
                                st.rerun()
                            else:
                                toast_error("Transaction sauvée mais erreur lors du rangement du fichier.")
                        else:
                            toast_error("Erreur sauvegarde Transaction")


# ============================================================
# FRAGMENT 3: PDF IMPORT
# ============================================================
def render_pdf_fragment():
    """
    Fragment pour l'import PDF.
    Se charge indépendamment.
    """
    st.subheader("📄 Import PDF (Revenus)")

    uploaded_file = st.file_uploader("Choisissez un PDF (Relevé, Facture...)", type=["pdf"], key="pdf_uploader")

    if uploaded_file:
        if st.button("Traiter le PDF", type="primary", key="btn_pdf_process"):
            # Save temp
            TEMP_OCR_DIR.mkdir(exist_ok=True)
            temp_path = TEMP_OCR_DIR / uploaded_file.name
            temp_path.write_bytes(uploaded_file.read())

            try:
                from ...ocr.services.ocr_service import OCRService
                ocr = OCRService()
                t = ocr.process_document(str(temp_path))

                toast_success("Données extraites !")

                with st.form("pdf_form"):
                    c1, c2 = st.columns(2)
                    with c1:
                        cat = st.selectbox("Catégorie", TRANSACTION_CATEGORIES, index=0)
                        sub = st.text_input("Sous-catégorie", value="Relevé")
                    with c2:
                        amt = st.number_input("Montant", value=float(t.montant) if t.montant else 0.0)
                        dt = st.date_input("Date", value=t.date if t.date else date.today())

                    if st.form_submit_button("💾 Valider"):
                        final_t = Transaction(
                            type="Revenu",
                            categorie=cat,
                            sous_categorie=sub,
                            montant=amt,
                            date=dt,
                            description=t.description or "",
                            source="pdf",
                            recurrence=None,
                            date_fin=None,
                            compte_iban=None,
                            external_id=None,
                            id=None,
                        )

                        nid = transaction_service.add(final_t)
                        if nid:
                            attachment_service.add_attachment(
                                transaction_id=nid,
                                file_obj=str(temp_path),
                                filename=uploaded_file.name,
                                category=cat,
                                subcategory=sub,
                                transaction_type="Revenu"
                            )
                            toast_success("PDF importé et rangé !")
                            st.rerun()
                        else:
                            toast_error("Erreur")

            except Exception as e:
                toast_error(f"Erreur extraction: {e}")


# ============================================================
# FRAGMENT 4: CSV IMPORT
# ============================================================
def render_csv_fragment():
    """
    Fragment pour l'import CSV/Excel.
    """
    st.subheader("📄 Import CSV/Excel")
    st.info("💡 Importez vos relevés bancaires au format CSV ou Excel.")

    with st.expander("ℹ️ Format attendu", expanded=False):
        st.markdown("""
        ### Colonnes attendues (au moins 2) :
        - **Date** : col date (ex: 01/01/2024, 2024-01-01)
        - **Montant** : col montant (ex: 25.50, 25,50 €)

        ### Colonnes optionnelles :
        - **Catégorie** : si presente, doit correspondre à une catégorie existante
        - **Description** : texte libre

        ### Exemple CSV :
        ```csv
        Date,Montant,Catégorie,Description
        01/01/2024,25.50,Alimentation,Courses Carrefour
        15/01/2024,45.00,Loisirs,Cinema
        ```
        """)

    import_transactions_page()


# ============================================================
# FRAGMENT 5: RECURRENCE
# ============================================================
def render_recurrence_fragment():
    """
    Fragment pour créer une récurrence.
    """
    st.subheader("🔁 Transaction Récurrente")

    with st.form("recurrence_form"):
        col1, col2 = st.columns(2)
        with col1:
            transaction_type = st.selectbox("Type", TRANSACTION_TYPES)

            cat_options = TRANSACTION_CATEGORIES + ["➕ Autre..."]
            category_sel = st.selectbox("Catégorie", cat_options)
            if category_sel == "➕ Autre...":
                category = st.text_input("Nom de la catégorie")
            else:
                category = category_sel

            subcategory = st.text_input("Sous-catégorie")
            amount = st.number_input("Montant (€)", step=0.01, min_value=0.0)

        with col2:
            frequence = st.selectbox("Fréquence", ["Quotidien", "Hebdomadaire", "Mensuel", "Annuel"])
            date_debut = st.date_input("Date de début", value=date.today())
            date_fin = st.date_input("Date de fin (optionnel)", value=None)

        if st.form_submit_button("💾 Créer la récurrence", type="primary"):
            try:
                from ...database.repository_recurrence import RecurrenceRepository
                from ...database.model_recurrence import Recurrence
                repo = RecurrenceRepository()
                new_rec = Recurrence(
                    type=transaction_type, categorie=category, sous_categorie=subcategory,
                    montant=amount, frequence=frequence, date_debut=date_debut,
                    date_fin=date_fin if date_fin else None,
                    description=f"Recurrence auto: {category}",
                    id=None,
                    statut="active",
                    date_creation=None,
                    date_modification=None,
                )
                if repo.add_recurrence(new_rec):
                    toast_success("Récurrence créée !")
                    st.rerun()
                else:
                    toast_error("Erreur")
            except Exception as e:
                toast_error(f"Erreur: {e}")


# ============================================================
# PAGE PRINCIPALE
# ============================================================

# noinspection GrazieInspection
def interface_add_transaction():
    """Page principale d'ajout de transactions avec fragments."""

    st.header("➕ Ajouter une Transaction")

    # Assurer que le dossier temp existe
    TEMP_OCR_DIR.mkdir(exist_ok=True)

    # === SELECTBOX PRINCIPALE ===
    # Le selectbox doit être hors des fragments pour éviter les problèmes de state
    if "add_mode_selection" not in st.session_state:
        st.session_state.add_mode_selection = "📸 Scan OCR (Image)"

    mode = st.selectbox(
        "📌 Mode d'ajout",
        options=["📸 Scan OCR (Image)", "📄 Import PDF", "📄 Import CSV/Excel", "🔁 Transaction Récurrente"],
        index=["📸 Scan OCR (Image)", "📄 Import PDF", "📄 Import CSV/Excel", "🔁 Transaction Récurrente"].index(
            st.session_state.add_mode_selection) if st.session_state.add_mode_selection in ["📸 Scan OCR (Image)",
                                                                                            "📄 Import PDF",
                                                                                            "📄 Import CSV/Excel",
                                                                                            "🔁 Transaction Récurrente"] else 0,
        key="mode_selector",
        help="Sélectionnez comment vous souhaitez ajouter vos transactions"
    )

    # Sauvegarder la sélection
    st.session_state.add_mode_selection = mode

    st.markdown("---")

    # Afficher le fragment correspondant au mode
    if mode == "📸 Scan OCR (Image)":
        render_ocr_upload_fragment()
        render_ocr_validation_fragment()

    elif mode == "📄 Import PDF":
        render_pdf_fragment()

    elif mode == "📄 Import CSV/Excel":
        render_csv_fragment()

    else:  # Transaction Récurrente
        render_recurrence_fragment()
