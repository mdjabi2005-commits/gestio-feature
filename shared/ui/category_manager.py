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
from shared.ui.toast_components import toast_success, toast_error, toast_warning

_NEW_CAT_OPTION = "➕ Nouvelle catégorie"
_NEW_SUB_OPTION = "➕ Nouvelle sous-catégorie"


def category_selector(
    default_category: str = "Autre",
    default_subcategory: str = "",
    key_prefix: str = "cat",
) -> tuple[str, str]:
    """
    Composant de sélection catégorie + sous-catégorie avec ajout dynamique.
    Affiche les deux colonnes en parallèle — la sous-catégorie n'est jamais masquée.
    À utiliser HORS d'un st.form() — utilise st.rerun() après création.

    Retourne (categorie, sous_categorie) sélectionnées.
    """
    categories = get_categories()
    cat_options = categories + [_NEW_CAT_OPTION]
    default_cat_idx = categories.index(default_category) if default_category in categories else 0

    col_cat, col_sub = st.columns(2)

    # ── Colonne gauche : Catégorie ───────────────────────────
    with col_cat:
        selected_cat = st.selectbox(
            "Catégorie", cat_options, index=default_cat_idx, key=f"{key_prefix}_cat_sel"
        )

        if selected_cat == _NEW_CAT_OPTION:
            new_cat = st.text_input(
                "Nom de la nouvelle catégorie",
                placeholder="ex: Animaux, Jardinage...",
                key=f"{key_prefix}_new_cat",
            )
            if st.button("✅ Créer la catégorie", key=f"{key_prefix}_btn_new_cat", type="primary"):
                if new_cat.strip():
                    added = save_category(new_cat)
                    if added:
                        toast_success(f"Catégorie **{new_cat.title()}** ajoutée !")
                        st.rerun()
                    else:
                        toast_warning("Cette catégorie existe déjà.")
                else:
                    toast_error("Le nom ne peut pas être vide.")
            # Tant que la nouvelle cat n'est pas confirmée, on utilise la valeur par défaut
            category = default_category
        else:
            category = selected_cat

    # ── Colonne droite : Sous-catégorie ─────────────────────
    with col_sub:
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

        if selected_sub == _NEW_SUB_OPTION:
            new_sub = st.text_input(
                f"Nouvelle sous-catégorie",
                placeholder="ex: Supermarché, Essence...",
                key=f"{key_prefix}_new_sub",
            )
            if st.button("✅ Créer la sous-catégorie", key=f"{key_prefix}_btn_new_sub", type="primary"):
                if new_sub.strip():
                    added = save_subcategory(category, new_sub)
                    if added:
                        toast_success(f"Sous-catégorie **{new_sub.title()}** ajoutée sous **{category}** !")
                        st.rerun()
                    else:
                        toast_warning("Cette sous-catégorie existe déjà.")
                else:
                    toast_error("Le nom ne peut pas être vide.")
            subcategory = default_subcategory
        else:
            subcategory = selected_sub

    return category, subcategory
