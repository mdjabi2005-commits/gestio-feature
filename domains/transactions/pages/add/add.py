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
from ...database.constants import TRANSACTION_CATEGORIES, TRANSACTION_TYPES
from ...services.attachment_service import attachment_service
from ...services.transaction_service import transaction_service


logger = logging.getLogger(__name__)

from ...config.paths import TO_SCAN_DIR, REVENUS_A_TRAITER


# ============================================================
# FRAGMENT 1 & 2: OCR IMPORT & VALIDATION
# ============================================================
def render_ocr_fragment():
    """
    Gère l'upload, l'extraction OCR séquentielle, et la validation des tickets.
    """
    st.subheader("📸 Scan par OCR (Simple & Rapide)")
    st.info("💡 Chargez vos tickets, vérifiez, et validez. Ils seront automatiquement rangés.")

    # Gestion de la clé du uploader pour forcer son vidage
    if "ocr_uploader_key" not in st.session_state:
        st.session_state.ocr_uploader_key = "ocr_uploader_0"

    scan_dir_path = Path(TO_SCAN_DIR)
    
    # 1. FICHIERS EN ATTENTE SUR LE DISQUE
    existing_files = [f for f in scan_dir_path.iterdir() if f.is_file() and f.suffix.lower() in [".jpg", ".jpeg", ".png"]]
    
    if existing_files:
        st.warning(f"📁 **{len(existing_files)} ticket(s) en attente détecté(s)** dans le dossier de scan.")
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

    # 2. SESSION STATE
    if "ocr_batch" not in st.session_state:
        st.session_state.ocr_batch = {}
    if "ocr_cancel" not in st.session_state:
        st.session_state.ocr_cancel = False

    # 3. EXTRACTION
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
            st.session_state.ocr_cancel = False
            total = len(files_to_process)

            results = []
            
            # Zone d'interface amovible pour la progression
            ui_placeholder = st.empty()
            with ui_placeholder.container():
                progress_bar = st.progress(0)
                status_text = st.empty()
                timer_text = st.empty()

            # On travaille directement sur les chemins
            from ...ocr.services.ocr_service import OCRService
            
            ocr_service = OCRService()
            start_time = time.time()
            
            try:
                with st.spinner("🤖 Groq analyse vos tickets... (Super Rapide)"):
                    for count, f in enumerate(files_to_process, 1):
                        if st.session_state.get("ocr_cancel", False):
                            raise InterruptedError("Annulé par l'utilisateur")
                            
                        # Si c'est un fichier uploaded via Streamlit, on le sauve sur le disque
                        if hasattr(f, 'name') and hasattr(f, 'read'):
                            fname = f.name # type: ignore[union-attr]
                            p = scan_dir_path / fname
                            f.seek(0) # type: ignore[union-attr]
                            p.write_bytes(f.read()) # type: ignore[union-attr]
                        else:
                            # C'est un Pathlib object du disque
                            p = f
                            fname = p.name
                            
                        # Interface
                        progress_bar.progress((count - 1) / total)
                        status_text.text(f"⏳ Traitement de : {fname}  ({count}/{total})")
                        
                        doc_start_time = time.time()
                        try:
                            # Extraction simple
                            trans = ocr_service.process_document(str(p))
                            results.append((fname, trans, None, time.time() - doc_start_time))
                        except Exception as e:
                            results.append((fname, None, str(e), time.time() - doc_start_time))
                            
                        elapsed = time.time() - start_time
                        progress_bar.progress(count / total)
                        status_text.text(f"✅ Traité : {fname}  ({count}/{total})")
                        timer_text.caption(f"⏱️ Temps écoulé : {elapsed:.1f}s")
                        
                processed_count = len([r for r in results if r[2] is None])
            except InterruptedError:
                st.warning("⚠️ Traitement annulé.")
                results = []
            except Exception as e:
                st.error(f"Erreur inattendue : {e}")
                results = []

            # Nettoyage de la zone de progression
            ui_placeholder.empty()

            # Mise à jour session
            st.session_state.ocr_batch = {}
            for fname, trans, err, _time_taken in results:
                st.session_state.ocr_batch[fname] = {
                    "transaction": trans,
                    "error": err,
                    "saved": False,
                    "temp_path": str(scan_dir_path / fname)
                }

            total_elapsed = time.time() - start_time
            if processed_count > 0:
                st.toast(
                    f"✅ {processed_count} ticket(s) traité(s) en {total_elapsed:.1f}s",
                    icon="📸"
                )



    # ============================================================
    # 4. VALIDATION ET RANGEMENT
    # ============================================================
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
                        
                        # Trouver l'index de la catégorie prédite par l'OCR
                        default_index = 0
                        if trans.categorie in cat_options:
                            default_index = cat_options.index(trans.categorie)

                        f_cat_sel = st.selectbox("Catégorie", cat_options, index=default_index, key=f"cat_{fname}")
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
                                # Nettoyer l'entrée du dictionnaire OCR plutôt que de la marquer "saved"
                                if fname in st.session_state.ocr_batch:
                                    del st.session_state.ocr_batch[fname]
                                
                                # Si c'était le dernier ticket du batch, on purge proprement l'état pour une remise à neuf totale
                                if not st.session_state.ocr_batch:
                                    st.session_state.ocr_cancel = False
                                    # On incrémente la clé de l'uploader pour FORCER Streamlit à vider la liste visuelle de fichiers
                                    st.session_state.ocr_uploader_key = f"ocr_uploader_{time.time()}"
                                
                                # Purge globale des données (forcera la BDD à se relire sur d'autres vues)
                                st.session_state.pop("all_transactions_df", None)
                                st.cache_data.clear()
                                    
                                time.sleep(1.5) # Laisser le temps au Toast de s'afficher
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

    # Clé dynamique pour forcer la purge du st.file_uploader PDF
    if "pdf_uploader_key" not in st.session_state:
        st.session_state.pdf_uploader_key = "pdf_uploader_0"

    revenus_dir_path = Path(REVENUS_A_TRAITER)
    
    # 1. FICHIERS EN ATTENTE SUR LE DISQUE
    existing_pdfs = [f for f in revenus_dir_path.iterdir() if f.is_file() and f.suffix.lower() == ".pdf"]
    
    if existing_pdfs:
        st.warning(f"📁 **{len(existing_pdfs)} PDF(s) en attente détecté(s)** dans le dossier revenus.")
        if st.button(f"🚀 Analyser ces {len(existing_pdfs)} PDFs maintenant", type="primary", key="btn_pdf_disk"):
            st.session_state.pdf_disk_trigger = existing_pdfs
            
    st.markdown("---")

    uploaded_file = st.file_uploader("Ou glissez-déposez un nouveau PDF ici", type=["pdf"], key=st.session_state.pdf_uploader_key)

    disk_pdfs_to_process = st.session_state.pop("pdf_disk_trigger", [])
    
    # Pour la simplification actuelle, on ne traite qu'un seul PDF à la fois par ce workflow
    active_pdf = None
    is_disk_file = False
    
    if disk_pdfs_to_process:
        active_pdf = disk_pdfs_to_process[0] # On prend le premier
        is_disk_file = True
    elif uploaded_file:
        active_pdf = uploaded_file

    if active_pdf:
        if is_disk_file or st.button("Traiter le PDF", type="primary", key="btn_pdf_process"):
            if not is_disk_file:
                # Save temp from streamlit
                temp_path = revenus_dir_path / active_pdf.name
                temp_path.write_bytes(active_pdf.read())
            else:
                temp_path = active_pdf

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
                                filename=temp_path.name,
                                category=cat,
                                subcategory=sub,
                                transaction_type="Revenu"
                            )
                            
                            st.session_state.pop("all_transactions_df", None)
                            st.cache_data.clear()
                            
                            # Réinitialiser la liste visuelle du uploader PDF
                            st.session_state.pdf_uploader_key = f"pdf_uploader_{time.time()}"
                            
                            import time
                            time.sleep(1.5)
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
                    st.session_state.pop("all_transactions_df", None)
                    st.cache_data.clear()
                    
                    import time
                    time.sleep(1.5)
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

    # (Les dossiers d'extraction exist-ok sont désormais couverts par l'init de la config)

    # === SELECTBOX PRINCIPALE ===
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

    # Afficher le fragment correspondant au mode
    if mode == "📸 Scan OCR (Image)":
        render_ocr_fragment()

    elif mode == "📄 Import PDF":
        render_pdf_fragment()

    elif mode == "📄 Import CSV/Excel":
        render_csv_fragment()

    else:  # Transaction Récurrente
        render_recurrence_fragment()
