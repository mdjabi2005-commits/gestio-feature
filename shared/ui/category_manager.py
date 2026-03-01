"""
Category Manager — Composant Streamlit partagé.
Permet de sélectionner une catégorie et une sous-catégorie,
avec la possibilité d'en créer de nouvelles directement sauvegardées dans categories.yaml.
"""

import streamlit as st

from shared.utils.categories_loader import (
    get_categories,
    get_subcategories,
    save_category,
    save_subcategory,
)


def category_selector(
    default_category: str = "Autre",
    default_subcategory: str = "",
    key_prefix: str = "cat",
) -> tuple[str, str]:
    """
    Composant de sélection catégorie + sous-catégorie avec ajout dynamique.

    Affiche :
    - Un selectbox catégorie (+ option "➕ Nouvelle catégorie...")
    - Un selectbox sous-catégorie (+ option "➕ Nouvelle sous-catégorie...")
    - Un formulaire d'ajout si l'utilisateur choisit "➕"

    Retourne (categorie, sous_categorie) sélectionnées.
    NB : à utiliser HORS d'un st.form() car utilise st.rerun().
    """
    categories = get_categories()
    cat_options = categories + ["➕ Nouvelle catégorie..."]

    default_idx = categories.index(default_category) if default_category in categories else 0

    selected_cat = st.selectbox(
        "Catégorie",
        cat_options,
        index=default_idx,
        key=f"{key_prefix}_cat_sel"
    )

    # Ajout d'une nouvelle catégorie
    if selected_cat == "➕ Nouvelle catégorie...":
        new_cat = st.text_input("Nom de la nouvelle catégorie", key=f"{key_prefix}_new_cat")
        if st.button("✅ Créer la catégorie", key=f"{key_prefix}_btn_new_cat"):
            if new_cat.strip():
                added = save_category(new_cat)
                if added:
                    st.success(f"Catégorie **{new_cat.title()}** ajoutée !")
                    st.rerun()
                else:
                    st.warning("Cette catégorie existe déjà.")
            else:
                st.error("Le nom ne peut pas être vide.")
        return default_category, default_subcategory

    category = selected_cat

    # Sous-catégories de la catégorie sélectionnée
    subcategories = get_subcategories(category)
    sub_options = subcategories + ["➕ Nouvelle sous-catégorie..."]

    default_sub_idx = subcategories.index(default_subcategory) if default_subcategory in subcategories else len(subcategories)

    selected_sub = st.selectbox(
        "Sous-catégorie",
        sub_options,
        index=default_sub_idx,
        key=f"{key_prefix}_sub_sel"
    )

    # Ajout d'une nouvelle sous-catégorie
    if selected_sub == "➕ Nouvelle sous-catégorie...":
        new_sub = st.text_input(
            f"Nouvelle sous-catégorie pour **{category}**",
            key=f"{key_prefix}_new_sub"
        )
        if st.button("✅ Créer la sous-catégorie", key=f"{key_prefix}_btn_new_sub"):
            if new_sub.strip():
                added = save_subcategory(category, new_sub)
                if added:
                    st.success(f"Sous-catégorie **{new_sub.title()}** ajoutée sous **{category}** !")
                    st.rerun()
                else:
                    st.warning("Cette sous-catégorie existe déjà.")
            else:
                st.error("Le nom ne peut pas être vide.")
        return category, default_subcategory

    return category, selected_sub


def category_selector_in_form(
    default_category: str = "Autre",
    default_subcategory: str = "",
    key_prefix: str = "cat",
) -> tuple[str, str]:
    """
    Version simplifiée pour usage DANS un st.form().
    Pas d'ajout dynamique (impossible dans un form), mais affiche
    un champ texte libre si "➕ Autre..." est sélectionné.
    """
    categories = get_categories()
    cat_options = categories + ["➕ Autre..."]
    default_idx = categories.index(default_category) if default_category in categories else 0

    selected_cat = st.selectbox(
        "Catégorie", cat_options, index=default_idx, key=f"{key_prefix}_cat"
    )
    if selected_cat == "➕ Autre...":
        category = st.text_input("Nom de la catégorie", key=f"{key_prefix}_cat_txt")
    else:
        category = selected_cat

    subcategories = get_subcategories(category) if category else []
    sub_options = subcategories + ["✏️ Autre..."]
    default_sub_idx = subcategories.index(default_subcategory) if default_subcategory in subcategories else len(subcategories)

    selected_sub = st.selectbox(
        "Sous-catégorie", sub_options, index=default_sub_idx, key=f"{key_prefix}_sub"
    )
    subcategory = st.text_input("Nom de la sous-catégorie", key=f"{key_prefix}_sub_txt") if selected_sub == "✏️ Autre..." else selected_sub

    return category, subcategory

