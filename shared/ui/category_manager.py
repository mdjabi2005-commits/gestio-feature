"""
Category Manager — Composant Streamlit partagé.
Permet de sélectionner une catégorie et une sous-catégorie,
avec la possibilité d'en créer de nouvelles directement sauvegardées dans categories.yaml.

IMPORTANT : category_selector() doit être utilisé HORS d'un st.form().
Les fragments OCR/PDF/Récurrence doivent extraire la sélection catégorie
hors du form et ne passer que les valeurs choisies au form.
"""

import streamlit as st

from shared.utils.categories_loader import (
    get_categories,
    get_subcategories,
    save_category,
    save_subcategory,
)

_NEW_CAT_OPTION = "✏️ Nouvelle catégorie..."
_NEW_SUB_OPTION = "✏️ Nouvelle sous-catégorie..."


def category_selector(
    default_category: str = "Autre",
    default_subcategory: str = "",
    key_prefix: str = "cat",
) -> tuple[str, str]:
    """
    Composant de sélection catégorie + sous-catégorie avec ajout dynamique.
    À utiliser HORS d'un st.form() — utilise st.rerun() après création.

    Retourne (categorie, sous_categorie) sélectionnées.
    """
    categories = get_categories()
    cat_options = categories + [_NEW_CAT_OPTION]
    default_idx = categories.index(default_category) if default_category in categories else 0

    selected_cat = st.selectbox(
        "Catégorie", cat_options, index=default_idx, key=f"{key_prefix}_cat_sel"
    )

    # ── Création nouvelle catégorie ──────────────────────────
    if selected_cat == _NEW_CAT_OPTION:
        new_cat = st.text_input(
            "Nom de la nouvelle catégorie",
            placeholder="ex: Animaux, Jardinage...",
            key=f"{key_prefix}_new_cat"
        )
        if st.button("✅ Créer", key=f"{key_prefix}_btn_new_cat", type="primary"):
            if new_cat.strip():
                added = save_category(new_cat)
                if added:
                    st.success(f"✅ Catégorie **{new_cat.title()}** ajoutée !")
                    st.rerun()
                else:
                    st.warning("⚠️ Cette catégorie existe déjà.")
            else:
                st.error("❌ Le nom ne peut pas être vide.")
        return default_category, default_subcategory

    category = selected_cat

    # ── Sous-catégories ──────────────────────────────────────
    subcategories = get_subcategories(category)
    sub_options = subcategories + [_NEW_SUB_OPTION]
    default_sub_idx = (
        subcategories.index(default_subcategory)
        if default_subcategory in subcategories
        else len(subcategories)
    )

    selected_sub = st.selectbox(
        "Sous-catégorie", sub_options, index=default_sub_idx, key=f"{key_prefix}_sub_sel"
    )

    # ── Création nouvelle sous-catégorie ─────────────────────
    if selected_sub == _NEW_SUB_OPTION:
        new_sub = st.text_input(
            f"Nouvelle sous-catégorie pour **{category}**",
            placeholder="ex: Supermarché, Essence...",
            key=f"{key_prefix}_new_sub"
        )
        if st.button("✅ Créer", key=f"{key_prefix}_btn_new_sub", type="primary"):
            if new_sub.strip():
                added = save_subcategory(category, new_sub)
                if added:
                    st.success(f"✅ Sous-catégorie **{new_sub.title()}** ajoutée sous **{category}** !")
                    st.rerun()
                else:
                    st.warning("⚠️ Cette sous-catégorie existe déjà.")
            else:
                st.error("❌ Le nom ne peut pas être vide.")
        return category, default_subcategory

    return category, selected_sub

