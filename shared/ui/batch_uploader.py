"""
Batch Uploader — Composant partagé pour les imports par lot (OCR, PDF, CSV)
Abstract la logique de session state et d'UI pour éviter la duplication entre fragments.
"""

import time
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

import streamlit as st


@dataclass
class BatchConfig:
    """Configuration pour un module d'import batch."""
    prefix: str              # ex: "ocr", "pdf"
    title: str               # ex: "Scan par OCR", "Import PDF"
    extensions: list[str]     # ex: [".jpg", ".jpeg", ".png"]
    dir_path: Path           # Chemin du dossier de travail
    disk_key: str            # Clé pour trigger fichiers disque


def init_batch_session(prefix: str) -> None:
    """Initialise les clés session_state si absentes."""
    if f"{prefix}_uploader_key" not in st.session_state:
        st.session_state[f"{prefix}_uploader_key"] = f"{prefix}_uploader_0"
    if f"{prefix}_batch" not in st.session_state:
        st.session_state[f"{prefix}_batch"] = {}
    if f"{prefix}_cancel" not in st.session_state:
        st.session_state[f"{prefix}_cancel"] = False


def render_disk_files(config: BatchConfig) -> list:
    """Affiche les fichiers en attente sur le disque et retourne la liste si demandée."""
    existing = [f for f in config.dir_path.iterdir()
               if f.is_file() and f.suffix.lower() in config.extensions]
    if existing:
        st.warning(f"📁 **{len(existing)} fichier(s) en attente** dans le dossier.")
        if st.button(f"🚀 Analyser ces {len(existing)} fichiers maintenant",
                     type="primary", key=f"btn_{config.prefix}_disk"):
            st.session_state[f"{config.prefix}_disk_trigger"] = existing
            return existing
    return []


def render_batch_controls(config: BatchConfig, start_callback: Callable) -> None:
    """Affiche les boutons lancer/annuler et exécute le callback si demandé."""
    # Si le trigger disque est présent, lancer directement sans passer par le bouton
    disk_files = st.session_state.pop(f"{config.prefix}_disk_trigger", [])
    if disk_files:
        start_callback(disk_files)
        return

    uploaded_files = st.file_uploader(
        "Ou glissez-déposez vos fichiers ici",
        type=config.extensions,
        accept_multiple_files=True,
        key=st.session_state[f"{config.prefix}_uploader_key"],
    ) or []

    if not uploaded_files:
        return

    col_btn, col_cancel = st.columns([3, 1])
    with col_btn:
        start = st.button("🔍 Lancer le traitement", type="primary",
                          key=f"btn_{config.prefix}_start")
    with col_cancel:
        if st.button("❌ Annuler", key=f"btn_{config.prefix}_cancel"):
            st.session_state[f"{config.prefix}_cancel"] = True

    if start:
        start_callback(uploaded_files)


def run_batch_processing(
    config: BatchConfig,
    files_to_process: list,
    process_fn: Callable,
    spinner_msg: str = "Traitement en cours...",
) -> tuple[list, float]:
    """
    Boucle de traitement commune pour tous les fragments batch (OCR, PDF, CSV...).
    Retourne une liste de tuples (fname, result, error, duration).
    """
    cancel_key = f"{config.prefix}_cancel"
    st.session_state[cancel_key] = False
    total = len(files_to_process)
    results = []

    ui_placeholder = st.empty()
    with ui_placeholder.container():
        progress_bar = st.progress(0)
        status_text = st.empty()
        timer_text = st.empty()

    start_time = time.time()

    try:
        with st.spinner(spinner_msg):
            for count, f in enumerate(files_to_process, 1):
                if st.session_state.get(cancel_key, False):
                    raise InterruptedError("Annule par l'utilisateur")

                fname, p = handle_file_input(f, config.dir_path)

                progress_bar.progress((count - 1) / total)
                status_text.text(f"Traitement : {fname}  ({count}/{total})")
                doc_start = time.time()
                try:
                    result = process_fn(str(p))
                    results.append((fname, result, None, time.time() - doc_start))
                except Exception as e:
                    results.append((fname, None, str(e), time.time() - doc_start))

                elapsed = time.time() - start_time
                progress_bar.progress(count / total)
                status_text.text(f"Traite : {fname}  ({count}/{total})")
                timer_text.caption(f"Temps ecoule : {elapsed:.1f}s")

    except InterruptedError:
        st.warning("Traitement annule.")
        results = []
    except Exception as e:
        st.error(f"Erreur inattendue : {e}")
        results = []

    ui_placeholder.empty()
    return results, start_time


def render_batch_progress(prefix: str, total: int, results: list,
                          start_time: float) -> int:
    """Affiche la progress bar et retourne le nombre de fichiers traités."""
    processed_count = len([r for r in results if r[2] is None])
    if processed_count > 0:
        total_elapsed = time.time() - start_time
        st.toast(f"✅ {processed_count} fichier(s) traité(s) en {total_elapsed:.1f}s")
    return processed_count


def render_validation_section(prefix: str, title: str, render_form_fn: Callable) -> None:
    """Affiche la section de validation des fichiers traités."""
    st.markdown("---")
    st.subheader(f"✅ Validation des {title}")

    batch = st.session_state.get(f"{prefix}_batch")
    if not batch:
        st.info(f"Aucun {title.lower()} à valider.")
        return

    for fname, data in list(batch.items()):
        if data.get("saved", False):
            continue
        render_form_fn(fname, data)


def finalize_validation(prefix: str, fname: str) -> None:
    """Actions post-validation: nettoie le batch et reset l'uploader."""
    st.session_state[f"{prefix}_batch"].pop(fname, None)
    if not st.session_state[f"{prefix}_batch"]:
        st.session_state[f"{prefix}_cancel"] = False
        st.session_state[f"{prefix}_uploader_key"] = f"{prefix}_uploader_{time.time()}"
    st.session_state.pop("all_transactions_df", None)
    st.cache_data.clear()
    time.sleep(1.5)
    st.rerun()


def write_uploaded_file(f, dir_path: Path) -> tuple[str, Path]:
    """Écrit un fichier uploadé sur le disque et retourne (nom, chemin)."""
    fname = f.name
    p = dir_path / fname
    f.seek(0)
    p.write_bytes(f.read())
    return fname, p


def handle_file_input(f, dir_path: Path) -> tuple[str, Path]:
    """Convertit l'input (uploaded file ou Path) en (nom, chemin)."""
    if hasattr(f, 'name') and hasattr(f, 'read'):
        return write_uploaded_file(f, dir_path)
    return f.name, f
