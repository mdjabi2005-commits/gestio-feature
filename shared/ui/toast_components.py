"""Reusable UI components for the application.

This module contains toast notifications, badges, and transaction display components.
"""

import hashlib
import logging
import os
from typing import Dict, Any, Optional

import streamlit as st
import streamlit.components.v1 as components
from PIL import Image

logger = logging.getLogger(__name__)


# ==============================
# 🔔 TOAST NOTIFICATIONS
# ==============================

def show_toast(message: str, toast_type: str = "success", duration: int = 3000) -> None:
    """
    Display a professional toast notification.

    Args:
        message: Message to display
        toast_type: Type of toast - 'success', 'warning', 'error'
        duration: Duration in milliseconds (default: 3000ms)

    Example:
        >>> show_toast("Transaction saved!", "success", 3000)
        >>> show_toast("Warning: duplicate detected", "warning", 5000)
    """
    # Define color and icon based on type
    toast_config = {
        "success": {"color": "#10b981", "icon": "✅", "bg_light": "#d1fae5"},
        "warning": {"color": "#f59e0b", "icon": "⚠️", "bg_light": "#fef3c7"},
        "error": {"color": "#ef4444", "icon": "❌", "bg_light": "#fee2e2"}
    }

    config = toast_config.get(toast_type, toast_config["success"])

    # Unique ID et calcul dynamique d'empilement (Toast Stack)
    import time, random
    toast_id = f"toast_{int(time.time() * 1000)}_{random.randint(100,999)}"

    components.html(f"""
        <div id="{toast_id}" class="custom-toast" style="
            position:fixed;
            right:30px;
            /* Le bottom initial est caché, le script JS l'ajustera selon l'empilement */
            bottom: -100px;
            background:linear-gradient(135deg, {config['color']} 0%, {config['bg_light']} 100%);
            color:#1f2937;
            padding:12px 24px;
            border-radius:12px;
            font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
            font-weight:600;
            box-shadow:0 4px 20px rgba(0,0,0,0.15);
            border-left:4px solid {config['color']};
            z-index:9999;
            transition: bottom 0.3s ease;
            animation: slideInCustom 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards, fadeOut {duration / 1000}s {(duration - 1000) / 1000}s forwards;">
            <span style="font-size:18px;margin-right:8px;">{config['icon']}</span>
            {message}
        </div>
        <script>
            setTimeout(() => {{
                var doc = window.parent.document;
                // Trouver ce toast précis
                var currentToast = document.getElementById("{toast_id}");
                if (!currentToast) return;
                
                // Le remonter dans le parent body pour échapper à l'iframe Streamlit
                if (!currentToast.classList.contains('moved')) {{
                    doc.body.appendChild(currentToast);
                    currentToast.classList.add('moved');
                }}
                
                // Empilement des toasts existants
                var toasts = doc.querySelectorAll('.custom-toast');
                var currentPosition = 30; // 30px du bas pour le premier
                
                // Trier par ordre d'apparition (du plus vieux au plus récent dans le DOM)
                // Ici on veut afficher de bas en haut
                for (var i = toasts.length - 1; i >= 0; i--) {{
                    var t = toasts[i];
                    t.style.bottom = currentPosition + 'px';
                    // On ajoute la hauteur de la bulle (env. 50px) + un espace de 15px
                    currentPosition += t.offsetHeight + 15;
                }}
            }}, 50); // Léger delai pour que Streamlit injecte le html
        </script>
        <style>
        .custom-toast {{
            pointer-events: none; /* Ne pas géner le clic en dessous */
        }}
        @keyframes slideInCustom {{
          from {{
            transform: translateX(400px);
            opacity: 0;
          }}
          to {{
            transform: translateX(0);
            opacity: 1;
          }}
        }}
        @keyframes fadeOut {{
          0% {{opacity:1;}}
          100% {{opacity:0;visibility:hidden;}}
        }}
        </style>
    """, height=0)


def toast_success(message: str, duration: int = 3000) -> None:
    """
    Display a success toast notification.

    Args:
        message: Success message to display
        duration: Duration in milliseconds (default: 3000ms)

    Example:
        >>> toast_success("Transaction successfully saved!")
    """
    show_toast(message, "success", duration)


def toast_warning(message: str, duration: int = 3000) -> None:
    """
    Display a warning toast notification.

    Args:
        message: Warning message to display
        duration: Duration in milliseconds (default: 3000ms)

    Example:
        >>> toast_warning("Duplicate transaction detected")
    """
    show_toast(message, "warning", duration)


def toast_error(message: str, duration: int = 3000) -> None:
    """
    Display an error toast notification.

    Args:
        message: Error message to display
        duration: Duration in milliseconds (default: 3000ms)

    Example:
        >>> toast_error("Failed to save transaction")
    """
    show_toast(message, "error", duration)


# ==============================
# 🏷️ BADGE COMPONENTS
# ==============================

def get_badge_html(transaction: Dict[str, Any]) -> str:
    """
    Generate HTML badge for a transaction based on its source.

    Args:
        transaction: Transaction dictionary with 'source' and 'type' keys

    Returns:
        HTML string for the badge with appropriate styling

    Example:
        >>> tx = {'source': 'OCR', 'type': 'dépense'}
        >>> badge = get_badge_html(tx)
        >>> '🧾 Ticket' in badge
        True
    """
    source = transaction.get("source", "")
    type_transaction = transaction.get("type", "")

    if source == "OCR":
        badge = "🧾 Ticket"
        couleur = "#1f77b4"
        emoji = "🧾"
    elif source == "PDF":
        if type_transaction == "revenu":
            badge = "💼 Bulletin"
            couleur = "#2ca02c"
            emoji = "💼"
        else:
            badge = "📄 Facture"
            couleur = "#ff7f0e"
            emoji = "📄"
    elif source in ["manuel", "récurrente", "récurrente_auto"]:
        badge = "📝 Manuel"
        couleur = "#7f7f7f"
        emoji = "📝"
    else:
        badge = "📎 Autre"
        couleur = "#9467bd"
        emoji = "📎"

    return f"<span style='background-color: {couleur}; color: white; padding: 4px 12px; border-radius: 16px; font-size: 0.8em; font-weight: bold;'>{emoji} {badge}</span>"


def get_badge_icon(transaction: Dict[str, Any]) -> str:
    """
    Get the icon emoji for a transaction based on its source.

    Args:
        transaction: Transaction dictionary with 'source' and 'type' keys

    Returns:
        Emoji string representing the transaction source

    Example:
        >>> tx = {'source': 'OCR', 'type': 'dépense'}
        >>> icon = get_badge_icon(tx)
        >>> icon
        '🧾'
    """
    source = transaction.get("source", "")
    type_transaction = transaction.get("type", "")

    if source == "OCR":
        return "🧾"
    elif source == "PDF":
        return "💼" if type_transaction == "revenu" else "📄"
    elif source in ["manuel", "récurrente", "récurrente_auto"]:
        return "📝"
    else:
        return "📎"


# ==============================
# 📋 TRANSACTION DISPLAY COMPONENTS
# ==============================

def afficher_carte_transaction(transaction: Dict[str, Any]) -> None:
    """
    Display a transaction card with details and associated documents.

    Creates a two-column layout showing transaction details on the left
    and amount/documents on the right.

    Args:
        transaction: Transaction dictionary with keys:
            - categorie: Category name
            - sous_categorie: Subcategory name
            - date: Transaction date
            - description: Optional description
            - recurrence: Optional recurrence pattern
            - type: 'revenu' or 'dépense'
            - montant: Amount
            - source: Transaction source (OCR, PDF, etc.)

    Example:
        >>> tx = {
        ...     'categorie': 'Alimentation',
        ...     'sous_categorie': 'Restaurant',
        ...     'date': '2025-01-15',
        ...     'type': 'dépense',
        ...     'montant': 45.50,
        ...     'source': 'OCR'
        ... }
        >>> afficher_carte_transaction(tx)
    """
    col1, col2 = st.columns([3, 1])

    with col1:
        st.write(f"**Catégorie :** {transaction['categorie']}")
        st.write(f"**Sous-catégorie :** {transaction['sous_categorie']}")
        st.write(f"**Date :** {transaction['date']}")

        if transaction.get('description'):
            st.write(f"**Description :** {transaction['description']}")

        if transaction.get('recurrence'):
            st.write(f"**Récurrence :** {transaction['recurrence']}")

    with col2:
        montant_color = "green" if transaction['type'] == 'revenu' else "red"
        montant_prefix = "+" if transaction['type'] == 'revenu' else "-"
        st.markdown(
            f"<h2 style='color: {montant_color}; text-align: center;'>"
            f"{montant_prefix}{transaction['montant']:.2f} €</h2>",
            unsafe_allow_html=True
        )

        # Display documents automatically if available
        if transaction['source'] in ['OCR', 'PDF']:
            st.markdown("---")
            st.markdown("**📎 Documents :**")
            # Handle both dict and Series
            if hasattr(transaction, 'to_dict'):
                afficher_documents_associes(transaction.to_dict())
            else:
                afficher_documents_associes(transaction)


def afficher_documents_associes(transaction: Dict[str, Any], context: Optional[str] = None) -> None:
    """
    Display documents associated with a transaction in an enhanced format.

    Shows images and PDFs in tabs, with OCR text extraction capabilities
    for images and text preview for PDFs.

    Args:
        transaction: Transaction dictionary with keys:
            - categorie: Category name
            - sous_categorie: Subcategory name
            - date: Transaction date
            - source: Transaction source
            - type: Transaction type

        context: Optional unique context identifier to distinguish between
                multiple renders of the same transaction on the same page.
                Used for generating unique Streamlit widget keys.

    Side effects:
        - Displays images using st.image()
        - Shows PDF download buttons
        - May display expanders with OCR text or PDF content

    Example:
        >>> tx = {
        ...     'categorie': 'Alimentation',
        ...     'sous_categorie': 'Restaurant',
        ...     'date': '2025-01-15',
        ...     'source': 'OCR',
        ...     'type': 'dépense'
        ... }
        >>> afficher_documents_associes(tx)
        >>> afficher_documents_associes(tx, context='detail_view')
    """
    # Utilisation du nouveau AttachmentService
    from domains.transactions.services.attachment_service import attachment_service

    # 1. Récupérer les nouvelles pièces jointes (DB)
    attachments = attachment_service.get_attachments(transaction.get("id"))
    fichiers = [att.file_path for att in attachments]

    # 2. (Optionnel) Fallback Legacy si aucune pièce jointe DB
    # On pourrait réimplémenter une recherche disque basique ici si nécessaire
    # mais pour l'instant on se concentre sur le nouveau système.

    # If no context provided, generate one from transaction properties
    if not context:
        # Create a unique context from domains.transactions.core import normalize_category, normalize_subcategory, AND amount
        # The amount is crucial to differentiate transactions with same metadata
        tx_date = str(transaction.get("date", ""))
        tx_cat = str(transaction.get("categorie", ""))
        tx_subcat = str(transaction.get("sous_categorie", ""))
        tx_montant = str(transaction.get("montant", "0"))
        context = f"{tx_date}_{tx_cat}_{tx_subcat}_{tx_montant}"

    if not fichiers:
        source = transaction.get("source", "")
        type_transaction = transaction.get("type", "")

        if source == "OCR":
            st.warning("🧾 Aucun ticket de caisse trouvé dans les dossiers")
        elif source == "PDF":
            if type_transaction == "revenu":
                st.warning("💼 Aucun bulletin de paie trouvé")
            else:
                st.warning("📄 Aucune facture trouvée")
        else:
            st.info("📝 Aucun document associé")
        return

    # Display each file in tabs
    tabs = st.tabs([f"Document {i + 1}" for i in range(len(fichiers))])

    for i, (tab, fichier) in enumerate(zip(tabs, fichiers)):
        with tab:
            nom_fichier = os.path.basename(fichier)

            if fichier.lower().endswith(('.jpg', '.jpeg', '.png')):
                # Display the image
                try:
                    image = Image.open(fichier)
                    st.image(image, caption=f"🧾 {nom_fichier}", use_container_width=True)

                except Exception as e:
                    toast_error(f"Impossible d'afficher l'image: {e}")

            elif fichier.lower().endswith('.pdf'):
                # Display PDF info
                st.success(f"📄 **{nom_fichier}**")

                # Extract text automatically and provide download button
                try:
                    st.info("📄 Document PDF")

                    # Download button (inside try so file open errors are caught)
                    import time
                    with open(fichier, "rb") as f:
                        file_hash = hashlib.md5(fichier.encode()).hexdigest()[:8]
                        # Create context-aware key to avoid duplicates
                        context_suffix = f"_{context}" if context else ""
                        # Add timestamp to guarantee absolute uniqueness even if all metadata is identical
                        unique_id = str(int(time.time() * 1000000))[-8:]  # Last 8 digits of microsecond timestamp
                        st.download_button(
                            label="⬇️ Télécharger le document",
                            data=f.read(),
                            file_name=nom_fichier,
                            mime="application/pdf",
                            use_container_width=True,
                            key=f"dl_{file_hash}_{i}{context_suffix}_{unique_id}"
                        )
                except Exception as e:
                    toast_error(f"Impossible d'afficher le document PDF: {e}")

# ==============================
# Note: Category navigation components moved to domains/transactions/ui/category_navigator.py
# This keeps shared components truly generic and reusable.
# ==============================
