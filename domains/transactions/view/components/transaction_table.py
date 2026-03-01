"""
Transaction Table Component - Version Minimaliste
Inspiré du POC data_editor.py
"""

import logging

import streamlit as st

from config.logging_config import log_error
from domains.transactions.database import TRANSACTION_TYPES
from domains.transactions.services.attachment_service import attachment_service
from shared.ui.toast_components import toast_success, toast_error

logger = logging.getLogger(__name__)


def render_transaction_table(filtered_df, transaction_repository):
    """
    Affiche le tableau des transactions en mode éditable.
    Utilise st.session_state pour détecter les changements.
    """
    st.subheader("📝 Transactions (Éditable)")

    if filtered_df.empty:
        st.info("Aucune transaction sur cette période/catégorie.")
        return

    # ========== PRÉPARATION DES DONNÉES ==========
    # Trier par date décroissante
    df = filtered_df.sort_values('date', ascending=False).reset_index(drop=True)

    # Ajouter colonne "Supprimer"
    df.insert(0, "Supprimer", False)
    # Ajouter colonne "Pieces Jointes" pour le bouton d'action
    df.insert(1, "Pieces Jointes", False)

    # ========== DATA EDITOR ==========
    result = st.data_editor(
        df,
        column_config={
            "Supprimer": st.column_config.CheckboxColumn(
                "🗑️",
                default=False,
                help="Cocher pour supprimer"
            ),
            "id": st.column_config.TextColumn("ID", disabled=True),
            "date": st.column_config.DateColumn("Date", format="DD/MM/YYYY"),
            "type": st.column_config.SelectboxColumn(
                "Type",
                options=sorted(TRANSACTION_TYPES),
                required=True
            ),
            "categorie": st.column_config.TextColumn(
                "Catégorie",
                required=True,
                help="Catégorie de la transaction"
            ),
            "sous_categorie": st.column_config.TextColumn("Sous-catégorie"),
            "montant": st.column_config.NumberColumn(
                "Montant",
                format="%.2f €",
                min_value=0
            ),
            "description": st.column_config.TextColumn("Description"),
            "Pieces Jointes": st.column_config.CheckboxColumn(
                "📎",
                default=False,
                help="Cocher pour gérer les fichiers"
            )
        },
        column_order=["Supprimer", "date", "type", "categorie", "sous_categorie", "montant", "description",
                      "Pieces Jointes"],
        hide_index=True,
        num_rows="dynamic",  # Permet l'ajout de lignes
        key="transaction_editor",
        use_container_width=True,
        height=390,
    )

    # ========== GESTION DES ATTACHMENTS (EXPANDER) ==========
    selected_tx_id = None
    editor_state = st.session_state.get("transaction_editor", {})
    edited_rows = editor_state.get("edited_rows", {})
    added_rows = editor_state.get("added_rows", [])

    for idx, changes in edited_rows.items():
        if changes.get("Pieces Jointes") is True:
            if idx < len(df):
                tx_id = df.iloc[idx]["id"]
                if tx_id:
                    selected_tx_id = tx_id

    if selected_tx_id:
        st.write("---")
        with st.expander(f"📂 Pièces jointes (Transaction {selected_tx_id})", expanded=True):
            st.info("💡 Décochez la case dans le tableau pour fermer ce panneau.")

            # 1. Upload
            uploaded_files = st.file_uploader(
                "Ajouter des fichiers",
                accept_multiple_files=True,
                type=["png", "jpg", "jpeg", "pdf"],
                key=f"uploader_{selected_tx_id}"
            )

            if uploaded_files:
                if st.button("Envoyer", type="primary", key=f"send_{selected_tx_id}"):
                    success_count = sum(
                        1 for f in uploaded_files
                        if attachment_service.add_attachment(selected_tx_id, f, f.name)  # type: ignore[union-attr]
                    )
                    if success_count > 0:
                        toast_success(f"{success_count} fichier(s) ajouté(s) !")
                        import time
                        time.sleep(1.5)
                        st.rerun()
                    else:
                        toast_error("Erreur lors de l'envoi")

            st.divider()

            # 2. Liste
            attachments = attachment_service.get_attachments(selected_tx_id)
            if not attachments:
                st.info("Aucune pièce jointe.")
            else:
                st.write(f"**{len(attachments)}** document(s) attaché(s) :")
                for att in attachments:
                    c1, c2, c3 = st.columns([1, 4, 1])
                    with c1:
                        st.write("📄" if att.file_type and "pdf" in att.file_type else "🖼️")
                    with c2:
                        st.write(f"**{att.file_name}**")
                        st.caption(f"{att.upload_date}")
                    with c3:
                        if st.button("🗑️", key=f"del_att_{att.id}"):
                            if attachment_service.delete_attachment(att.id):
                                toast_success("Supprimé !")
                                import time
                                time.sleep(1.5)
                                st.rerun()

    # ========== DÉTECTION DES CHANGEMENTS (SAUVEGARDE) ==========
    to_delete = result["Supprimer"].sum()

    real_edits = sum(
        1 for changes in edited_rows.values()
        if any(col not in ("Supprimer", "Pieces Jointes") for col in changes)
    )
    has_modifications = real_edits > 0 or len(added_rows) > 0

    # ========== AFFICHAGE ET ACTIONS ==========
    if to_delete > 0 or has_modifications:
        st.info(
            f"🔄 Changements détectés: {int(to_delete)} suppression(s), "
            f"{real_edits} modification(s), {len(added_rows)} ajout(s)"
        )

        col1, col2 = st.columns(2)

        with col1:
            if st.button("💾 Sauvegarder", type="primary", use_container_width=True):
                try:
                    debug_logs = []
                    logger.info("Début sauvegarde modifications tableau transactions")

                    # 1. Suppressions
                    deleted_ids = result[result["Supprimer"] == True]["id"].tolist()
                    debug_logs.append("🔍 DEBUG - Début sauvegarde")

                    if deleted_ids:
                        logger.info(f"Suppression de {len(deleted_ids)} transaction(s): {deleted_ids}")

                        # Collecter les fichiers physiques AVANT toute suppression DB
                        files_found = []
                        for tid in deleted_ids:
                            atts = attachment_service.get_attachments(int(tid))
                            logger.info(f"Transaction {tid} : {len(atts)} pièce(s) jointe(s) trouvée(s)")
                            for att in atts:
                                physical = attachment_service.find_file(att.file_name)
                                logger.info(f"  → find_file({att.file_name}) = {physical}")
                                if physical and physical.exists():
                                    files_found.append((att.file_name, str(physical)))

                        if files_found:
                            # Stocker pour confirmation — ne pas encore supprimer
                            st.session_state["pending_delete_ids"] = deleted_ids
                            st.session_state["pending_physical_delete"] = files_found
                            # Pas de rerun ici, on laisse afficher le bloc de confirmation ci-dessous
                        else:
                            # Pas de fichiers → suppression directe
                            if transaction_repository.delete(deleted_ids):
                                toast_success(f"{len(deleted_ids)} transaction(s) supprimée(s)")
                                st.session_state.pop("all_transactions_df", None)
                                st.cache_data.clear()
                                st.session_state.pop("transaction_editor", None)
                                import time; time.sleep(1.5); st.rerun()
                            else:
                                toast_error(f"Erreur lors de la suppression: {deleted_ids}")

                    # 2. Modifications
                    # Champs connus du modèle Transaction (+ id pour l'update)
                    _KNOWN_FIELDS = {
                        "id", "type", "categorie", "sous_categorie", "description",
                        "montant", "date", "source", "recurrence", "date_fin",
                        "compte_iban", "external_id"
                    }
                    for row_idx, changes in edited_rows.items():
                        tx_id_to_edit = result.iloc[row_idx].get('id')
                        # Normaliser en scalaire pour éviter ambiguïté pandas Series
                        if hasattr(tx_id_to_edit, 'item'):
                            tx_id_to_edit = tx_id_to_edit.item()

                        # Ne pas mettre à jour une transaction qu'on vient de supprimer
                        if tx_id_to_edit in deleted_ids:
                            continue
                            
                        updated_row = {
                            k: v for k, v in result.iloc[row_idx].to_dict().items()
                            if k in _KNOWN_FIELDS
                        }
                        debug_logs.append(f"📝 Modification ligne {row_idx}: {updated_row}")

                        if updated_row.get('id'):
                            if updated_row.get('categorie') == '':
                                updated_row['categorie'] = None
                            if updated_row.get('sous_categorie') == '':
                                updated_row['sous_categorie'] = None

                            success = transaction_repository.update(updated_row)
                            debug_logs.append(f"  → Résultat: {'✅ OK' if success else '❌ ERREUR'}")
                            if not success:
                                logger.error(f"Echec update transaction {updated_row.get('id')}")

                    # 3. Ajouts
                    for new_row in added_rows:
                        debug_logs.append(f"➕ Ajout: {new_row}")
                        success = transaction_repository.add(new_row)
                        debug_logs.append(f"  → Résultat: {'✅ OK' if success else '❌ ERREUR'}")
                        if not success:
                            logger.error("Echec ajout nouvelle transaction depuis tableau")

                    logger.info("Fin sauvegarde modifications tableau")

                    if not st.session_state.get("pending_physical_delete"):
                        success_msgs = []
                        if deleted_ids:
                            success_msgs.append(f"🗑️ {len(deleted_ids)} supprimée(s)")
                        if added_rows:
                            success_msgs.append(f"➕ {len(added_rows)} ajoutée(s)")
                        if real_edits:
                            success_msgs.append(f"✏️ {real_edits} modifiée(s)")
                        toast_success(" | ".join(success_msgs) if success_msgs else "Modifications sauvegardées !", duration=4000)

                        st.session_state.pop("all_transactions_df", None)
                        st.cache_data.clear()
                        st.session_state.pop("transaction_editor", None)
                        import time
                        time.sleep(1.5)
                        st.rerun()

                except Exception as e:
                    trace_id = log_error(e, "Erreur sauvegarde tableau transactions")
                    toast_error(f"Erreur lors de la sauvegarde (TraceID: {trace_id})")

        with col2:
            if st.button("↩️ Annuler", use_container_width=True):
                st.rerun()

    # ========== CONFIRMATION SUPPRESSION FICHIERS PHYSIQUES ==========
    pending_files = st.session_state.get("pending_physical_delete", [])
    pending_ids = st.session_state.get("pending_delete_ids", [])
    if pending_files and pending_ids:
        from shared.ui.toast_components import toast_warning
        toast_warning(f"{len(pending_files)} fichier(s) associé(s) seront supprimés du disque")
        for fname, fpath in pending_files:
            st.caption(f"📄 `{fname}`  —  `{fpath}`")

        col_yes, col_no = st.columns(2)
        with col_yes:
            if st.button("🗑️ Supprimer les fichiers", type="primary", use_container_width=True):
                # 1. Supprimer les fichiers physiques
                deleted_count = 0
                from pathlib import Path as _Path
                for fname, fpath in pending_files:
                    try:
                        p = _Path(fpath)
                        if p.exists():
                            p.unlink()
                            deleted_count += 1
                            logger.info(f"Fichier supprimé : {p}")
                    except Exception as e:
                        logger.warning(f"Impossible de supprimer {fpath} : {e}")
                # 2. Supprimer la transaction en DB
                transaction_repository.delete(pending_ids)
                st.session_state.pop("pending_physical_delete", None)
                st.session_state.pop("pending_delete_ids", None)
                st.session_state.pop("all_transactions_df", None)
                st.cache_data.clear()
                st.session_state.pop("transaction_editor", None)
                toast_success(f"{len(pending_ids)} transaction(s) + {deleted_count} fichier(s) supprimé(s)")
                import time; time.sleep(1.5); st.rerun()

        with col_no:
            if st.button("📁 Supprimer sans les fichiers", use_container_width=True):
                # Supprimer uniquement la transaction, garder les fichiers
                transaction_repository.delete(pending_ids)
                st.session_state.pop("pending_physical_delete", None)
                st.session_state.pop("pending_delete_ids", None)
                st.session_state.pop("all_transactions_df", None)
                st.cache_data.clear()
                st.session_state.pop("transaction_editor", None)
                toast_success(f"{len(pending_ids)} transaction(s) supprimée(s), fichiers conservés")
                import time; time.sleep(1.5); st.rerun()


