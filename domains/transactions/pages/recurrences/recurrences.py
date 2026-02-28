"""
Page Récurrences - Analyse des abonnements et dépenses récurrentes
"""

import logging
from datetime import datetime

import pandas as pd
import plotly.express as px
import streamlit as st

from shared.ui.toast_components import toast_success, toast_error
from ...database.repository_recurrence import RecurrenceRepository

logger = logging.getLogger(__name__)


def render_recurrence_kpis(recurrences_df: pd.DataFrame):
    """Affiche les KPIs des récurrences (Revenus vs Dépenses)."""
    if recurrences_df.empty:
        st.info("Aucune récurrence trouvée")
        return

    # Séparer Revenus et Dépenses
    revenus_df = recurrences_df[recurrences_df['type'] == 'Revenu']
    depenses_df = recurrences_df[recurrences_df['type'] == 'Dépense']

    # Calculs Dépenses
    total_depenses_mensuel = depenses_df['cout_mensuel'].sum()
    total_depenses_annuel = depenses_df['cout_annuel'].sum()

    # Calculs Revenus
    total_revenus_mensuel = revenus_df['cout_mensuel'].sum()
    total_revenus_annuel = revenus_df['cout_annuel'].sum()

    # Solde théorique
    solde_mensuel = total_revenus_mensuel - total_depenses_mensuel

    # Identifier les récurrences inactives (date de fin passée)
    today = datetime.now().date()
    potential_savings = 0
    if 'date_fin' in recurrences_df.columns:
        recurrences_df['date_fin'] = pd.to_datetime(
            recurrences_df['date_fin'], errors='coerce'
        ).apply(lambda x: x.date() if pd.notna(x) else None)
        inactive = recurrences_df[
            (recurrences_df['date_fin'].notna()) &
            (recurrences_df['date_fin'] < today) &
            (recurrences_df['type'] == 'Dépense')  # On ne compte que les économies sur les dépenses
            ]
        potential_savings = inactive['cout_annuel'].sum() if not inactive.empty else 0

    # Afficher les KPIs
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric(
            label="📉 Dépenses Mensuelles",
            value=f"{total_depenses_mensuel:.2f} €",
            delta=f"-{total_depenses_annuel:.0f} € / an",
            delta_color="inverse"
        )

    with col2:
        st.metric(
            label="📈 Revenus Mensuels",
            value=f"{total_revenus_mensuel:.2f} €",
            delta=f"+{total_revenus_annuel:.0f} € / an"
        )

    with col3:
        st.metric(
            label="⚖️ Solde Fixe Mensuel",
            value=f"{solde_mensuel:.2f} €",
            delta="Reste à vivre (hors var.)" if solde_mensuel > 0 else "Déficit structurel"
        )

    with col4:
        if potential_savings > 0:
            st.metric(
                label="💡 Économies Potentielles",
                value=f"{potential_savings:.2f} €/an",
                delta="Abonnements terminés"
            )
        else:
            st.metric(
                label="🔄 Abonnements Actifs",
                value=f"{len(depenses_df)}",
                help="Nombre de dépenses récurrentes actives"
            )


def render_recurrence_charts(recurrences_df: pd.DataFrame):
    """Affiche les graphiques des récurrences (Focus Dépenses)."""
    if recurrences_df.empty:
        return

    # On se concentre souvent sur les dépenses pour l'analyse
    depenses_df = recurrences_df[recurrences_df['type'] == 'Dépense']

    if depenses_df.empty:
        st.info("Pas assez de données de dépenses pour afficher les graphiques")
        return

    col1, col2 = st.columns(2)

    with col1:
        # Répartition par catégorie (Dépenses uniquement)
        category_costs = depenses_df.groupby('categorie')['cout_annuel'].sum().reset_index()
        category_costs = category_costs.sort_values('cout_annuel', ascending=False)

        fig_category = px.bar(
            category_costs,
            x='categorie',
            y='cout_annuel',
            title="💰 Dépenses Annuelles par Catégorie",
            labels={'categorie': 'Catégorie', 'cout_annuel': 'Coût Annuel (€)'},
            color='cout_annuel',
            color_continuous_scale='Reds'
        )
        fig_category.update_layout(showlegend=False)
        st.plotly_chart(fig_category, use_container_width=True)

    with col2:
        # Répartition par fréquence (Dépenses uniquement)
        frequency_costs = depenses_df.groupby('frequence')['cout_annuel'].sum().reset_index()

        fig_frequency = px.pie(
            frequency_costs,
            values='cout_annuel',
            names='frequence',
            title="📊 Fréquence des Dépenses",
            hole=0.4
        )
        st.plotly_chart(fig_frequency, use_container_width=True)


def render_recurrence_table(recurrences_df: pd.DataFrame, repository: RecurrenceRepository):
    """Affiche le tableau des récurrences avec option de suppression."""
    if recurrences_df.empty:
        st.info("Aucune récurrence à afficher")
        return

    st.subheader("📋 Liste des Récurrences (Éditable)")

    # Préparer le tableau d'affichage
    display_df = recurrences_df[[
        'id', 'description', 'type', 'categorie', 'sous_categorie', 'montant', 'frequence',
        'cout_mensuel', 'cout_annuel', 'date_debut', 'date_fin', 'statut'
    ]].copy()

    # Ajouter colonne Supprimer
    display_df.insert(0, "Supprimer", False)

    # Configuration du Data Editor
    edited_df = st.data_editor(
        display_df,
        column_config={
            "Supprimer": st.column_config.CheckboxColumn(
                "🗑️",
                help="Cocher pour supprimer",
                default=False
            ),
            "id": st.column_config.TextColumn("ID", disabled=True),
            "cout_mensuel": st.column_config.NumberColumn("Coût/Mois", format="%.2f €", disabled=True),
            "cout_annuel": st.column_config.NumberColumn("Coût/An", format="%.2f €", disabled=True),
            "montant": st.column_config.NumberColumn("Montant", format="%.2f €"),
        },
        hide_index=True,
        use_container_width=True,
        key="recurrence_editor",
        disabled=["cout_mensuel", "cout_annuel"]  # Bloquer les champs calculés
    )

    # Bouton de suppression si des éléments sont cochés
    to_delete = edited_df[edited_df["Supprimer"] == True]

    if not to_delete.empty:
        st.markdown(
            f"<div class='gestio-cal-header' style='color:#F59E0B;padding:0.75rem 1rem;"
            f"background:rgba(245,158,11,0.10);border-left:4px solid #F59E0B;"
            f"border-radius:0.75rem;margin-bottom:0.5rem;'>"
            f"⚠️ Vous allez supprimer <strong>{len(to_delete)}</strong> récurrence(s).</div>",
            unsafe_allow_html=True
        )
        if st.button("🗑️ Confirmer la suppression", type="primary"):
            try:
                success_count = 0
                for index, row in to_delete.iterrows():
                    rec_id = row['id']
                    if repository.delete_recurrence(rec_id):
                        success_count += 1

                if success_count > 0:
                    toast_success(f"🗑️ {success_count} récurrence(s) supprimée(s) !")
                    st.rerun()
                else:
                    toast_error("Erreur lors de la suppression")

            except Exception as e:
                from config.logging_config import log_error
                log_error(e, "Erreur suppression récurrence depuis tableau")
                toast_error(f"Erreur : {e}")


def interface_recurrences():
    """Interface principale de la page Récurrences."""
    logger.info("Chargement page Récurrences")

    st.title("🔄 Récurrences & Abonnements")
    st.markdown("Analysez vos dépenses récurrentes et identifiez les économies potentielles")

    try:
        # Récupérer les récurrences depuis le nouveau repository
        recurrence_repository = RecurrenceRepository()

        # Header
        col_header, col_admin = st.columns([4, 1])
        with col_header:
            st.header("🔄 Gestion des Récurrences")
            st.markdown("*Gérez vos abonnements et revenus récurrents*")

        with col_admin:
            pass

        all_recurrences = recurrence_repository.get_all_recurrences()

        # Convertir en DataFrame
        if all_recurrences:
            # Convertir les objets Pydantic en dict ET inclure les propriétés calculées
            data = []
            for r in all_recurrences:
                d = {
                    "id": r.id,
                    "type": r.type,
                    "categorie": r.categorie,
                    "sous_categorie": r.sous_categorie,
                    "montant": r.montant,
                    "frequence": r.frequence,
                    "date_debut": r.date_debut,
                    "date_fin": r.date_fin,
                    "description": r.description,
                    "statut": r.statut,
                    "date_creation": r.date_creation,
                    "date_modification": r.date_modification,
                    "cout_annuel": r.cout_annuel,
                    "cout_mensuel": r.cout_mensuel,
                }
                data.append(d)

            df = pd.DataFrame(data)

            # Convertir les dates
            if 'date_debut' in df.columns:
                df['date_debut'] = pd.to_datetime(df['date_debut']).apply(
                    lambda x: x.date() if pd.notna(x) else None
                )
            if 'date_fin' in df.columns:
                df['date_fin'] = pd.to_datetime(df['date_fin'], errors='coerce').apply(
                    lambda x: x.date() if pd.notna(x) else None
                )

            render_recurrence_kpis(df)
            st.markdown("---")
            st.subheader("📊 Visualisations")
            render_recurrence_charts(df)
            st.markdown("---")
            render_recurrence_table(df, recurrence_repository)

        else:
            logger.info("Aucune récurrence à afficher")
            st.info("Aucune récurrence trouvée dans la base de données.")

    except Exception as e:
        from config.logging_config import log_error
        trace_id = log_error(e, "Erreur chargement page Récurrences")
        toast_error(f"Erreur lors du chargement de la page (TraceID: {trace_id})")


if __name__ == "__main__":
    interface_recurrences()
