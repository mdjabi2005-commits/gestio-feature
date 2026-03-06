"""
Transaction Table Component - Version Minimaliste
Inspiré du POC data_editor.py
"""

import logging
import time
from pathlib import Path

import streamlit as st

from config.logging_config import log_error
from domains.transactions.database import TRANSACTION_TYPES
from domains.transactions.services.attachment_service import attachment_service
from shared.ui.toast_components import toast_success, toast_error, toast_warning

logger = logging.getLogger(__name__)


def render_transaction_table(filtered_df, transaction_repository):
    """Affiche le tableau des transactions en mode éditable."""
    st.subheader("📝 Transactions (Éditable)")

    if filtered_df.empty:
        st.info("Aucune transaction sur cette période/catégorie.")
        return

    # Préparation données
    df = filtered_df.sort_values('date', ascending=False).reset_index(drop=True)
    df.insert(0, "Supprimer", False)
    df.insert(1, "Pieces Jointes", False)

    # Data Editor
    result = st.data_editor(
        df,
        column_config={
            "Supprimer": st.column_config.CheckboxColumn("🗑️", default=False, help="Cocher pour supprimer"),
            "id": st.column_config.TextColumn("ID", disabled=True),
            "date": st.column_config.DateColumn("Date", format="DD/MM/YYYY"),
            "type": st.column_config.SelectboxColumn("Type", options=sorted(TRANSACTION_TYPES), required=True),
            "categorie": st.column_config.TextColumn("Catégorie", required=True),
            "sous_categorie": st.column_config.TextColumn("Sous-catégorie"),
            "montant": st.column_config.NumberColumn("Montant", format="%.2f €", min_value=0),
            "description": st.column_config.TextColumn("Description"),
            "Pieces Jointes": st.column_config.CheckboxColumn("📎", default=False, help="Cocher pour gérer les fichiers")
        },
        column_order=["Supprimer", "date", "type", "categorie", "sous_categorie", "montant", "description", "Pieces Jointes"],
        hide_index=True, num_rows="dynamic", key="transaction_editor", use_container_width=True, height=390,
    )

    # Gestion attachments
    _handle_attachments(df, result)

    # Détection changements et sauvegarde
    _handle_modifications(df, result, transaction_repository)

    # Confirmation suppression physique
    _render_physical_delete_confirmation(transaction_repository)


def _handle_attachments(df, result):
    """Gère l'upload et l'affichage des pièces jointes."""
    selected_tx_id = None
    editor_state = st.session_state.get("transaction_editor", {})
    edited_rows = editor_state.get("edited_rows", {})

    for idx, changes in edited_rows.items():
        if changes.get("Pieces Jointes") is True and idx < len(df):
            tx_id = df.iloc[idx]["id"]
            if tx_id:
                selected_tx_id = tx_id
                break

    if not selected_tx_id:
        return

    st.write("---")
    with st.expander(f"📂 Pièces jointes (Transaction {selected_tx_id})", expanded=True):
        st.info("💡 Décochez la case dans le tableau pour fermer ce panneau.")

        # Upload
        uploaded_files = st.file_uploader("Ajouter des fichiers", accept_multiple_files=True,
                                          type=["png", "jpg", "jpeg", "pdf"], key=f"uploader_{selected_tx_id}")

        if uploaded_files and st.button("Envoyer", type="primary", key=f"send_{selected_tx_id}"):
            success_count = sum(1 for f in uploaded_files if attachment_service.add_attachment(selected_tx_id, f, f.name))
            if success_count > 0:
                toast_success(f"{success_count} fichier(s) ajouté(s) !")
                time.sleep(1.5)
                st.rerun()
            else:
                toast_error("Erreur lors de l'envoi")

        st.divider()

        # Liste attachments
        attachments = attachment_service.get_attachments(selected_tx_id)
        if not attachments:
            st.info("Aucune pièce jointe.")
            return

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
                        time.sleep(1.5)
                        st.rerun()


def _handle_modifications(df, result, transaction_repository):
    """Gère les modifications (edit, delete, add)."""
    editor_state = st.session_state.get("transaction_editor", {})
    edited_rows = editor_state.get("edited_rows", {})
    added_rows = editor_state.get("added_rows", [])

    to_delete = result["Supprimer"].sum()
    real_edits = sum(1 for changes in edited_rows.values()
                     if any(col not in ("Supprimer", "Pieces Jointes") for col in changes))
    has_modifications = real_edits > 0 or len(added_rows) > 0

    if not (to_delete > 0 or has_modifications):
        return

    st.info(f"🔄 Changements détectés: {int(to_delete)} suppression(s), {real_edits} modification(s), {len(added_rows)} ajout(s)")

    col1, col2 = st.columns(2)
    with col1:
        if st.button("💾 Sauvegarder", type="primary", use_container_width=True):
            _save_all_changes(df, result, edited_rows, added_rows, to_delete, real_edits, transaction_repository)
    with col2:
        if st.button("↩️ Annuler", use_container_width=True):
            st.rerun()


def _save_all_changes(df, result, edited_rows, added_rows, to_delete, real_edits, transaction_repository):
    """Sauvegarde toutes les modifications."""
    try:
        deleted_ids = result[result["Supprimer"] == True]["id"].tolist()

        # 1. Suppressions avec collecte fichiers
        files_to_delete = []
        if deleted_ids:
            for tid in deleted_ids:
                atts = attachment_service.get_attachments(int(tid))
                for att in atts:
                    physical = attachment_service.find_file(att.file_name)
                    if physical and physical.exists():
                        files_to_delete.append((att.file_name, str(physical)))

            if files_to_delete:
                st.session_state["pending_delete_ids"] = deleted_ids
                st.session_state["pending_physical_delete"] = files_to_delete
            else:
                _execute_delete(deleted_ids, transaction_repository)
                return

        # 2. Modifications
        _KNOWN_FIELDS = {"id", "type", "categorie", "sous_categorie", "description",
                        "montant", "date", "source", "recurrence", "date_fin", "compte_iban", "external_id"}

        for row_idx, changes in edited_rows.items():
            tx_id = result.iloc[row_idx].get('id')
            if hasattr(tx_id, 'item'):
                tx_id = tx_id.item()
            if tx_id in deleted_ids:
                continue

            updated_row = {k: v for k, v in result.iloc[row_idx].to_dict().items() if k in _KNOWN_FIELDS}
            if updated_row.get('id'):
                if updated_row.get('categorie') == '':
                    updated_row['categorie'] = None
                if updated_row.get('sous_categorie') == '':
                    updated_row['sous_categorie'] = None
                transaction_repository.update(updated_row)

        # 3. Ajouts
        for new_row in added_rows:
            transaction_repository.add(new_row)

        # Succès
        if not st.session_state.get("pending_physical_delete"):
            msgs = []
            if deleted_ids:
                msgs.append(f"🗑️ {len(deleted_ids)} supprimée(s)")
            if added_rows:
                msgs.append(f"➕ {len(added_rows)} ajoutée(s)")
            if real_edits:
                msgs.append(f"✏️ {real_edits} modifiée(s)")
            toast_success(" | ".join(msgs) if msgs else "Modifications sauvegardées !", duration=4000)
            _clear_cache_and_rerun()

    except Exception as e:
        trace_id = log_error(e, "Erreur sauvegarde tableau transactions")
        toast_error(f"Erreur lors de la sauvegarde (TraceID: {trace_id})")


def _execute_delete(ids, repository):
    """Exécute la suppression et raffraîchit."""
    if repository.delete(ids):
        toast_success(f"{len(ids)} transaction(s) supprimée(s)")
        _clear_cache_and_rerun()
    else:
        toast_error(f"Erreur lors de la suppression")


def _clear_cache_and_rerun():
    """Nettoie le cache et raffraîchit la page."""
    st.session_state.pop("all_transactions_df", None)
    st.cache_data.clear()
    st.session_state.pop("transaction_editor", None)
    time.sleep(1.5)
    st.rerun()


def _render_physical_delete_confirmation(transaction_repository):
    """Affiche la confirmation de suppression physique des fichiers."""
    pending_files = st.session_state.get("pending_physical_delete", [])
    pending_ids = st.session_state.get("pending_delete_ids", [])

    if not (pending_files and pending_ids):
        return

    toast_warning(f"{len(pending_files)} fichier(s) associé(s) seront supprimés du disque")
    for fname, fpath in pending_files:
        st.caption(f"📄 `{fname}`  —  `{fpath}`")

    col_yes, col_no = st.columns(2)
    with col_yes:
        if st.button("🗑️ Supprimer les fichiers", type="primary", use_container_width=True):
            deleted_count = 0
            for fname, fpath in pending_files:
                try:
                    p = Path(fpath)
                    if p.exists():
                        p.unlink()
                        deleted_count += 1
                except Exception as e:
                    logger.warning(f"Impossible de supprimer {fpath} : {e}")
            transaction_repository.delete(pending_ids)
            _cleanup_and_notify(pending_ids, deleted_count)

    with col_no:
        if st.button("📁 Supprimer sans les fichiers", use_container_width=True):
            transaction_repository.delete(pending_ids)
            _cleanup_and_notify(pending_ids, 0, keep_files=True)


def _cleanup_and_notify(ids, file_count, keep_files=False):
    """Nettoie le state et affiche le toast."""
    st.session_state.pop("pending_physical_delete", None)
    st.session_state.pop("pending_delete_ids", None)
    st.session_state.pop("all_transactions_df", None)
    st.cache_data.clear()
    st.session_state.pop("transaction_editor", None)

    msg = f"{len(ids)} transaction(s) supprimée(s)"
    if not keep_files:
        msg += f" + {file_count} fichier(s)"
    toast_success(msg)
    time.sleep(1.5)
    st.rerun()
