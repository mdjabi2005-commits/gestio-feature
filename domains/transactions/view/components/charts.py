"""
Charts Components - Graphiques réutilisables

Ce module contient les fonctions de graphiques partagées
entre différentes pages de l'application.
"""

import pandas as pd
import plotly.graph_objects as go
import streamlit as st


def render_evolution_chart(df: pd.DataFrame, height: int = 400) -> None:
    """
    Affiche le graphique d'évolution Revenus/Dépenses/Solde.
    
    Le graphique s'adapte aux données filtrées passées en paramètre.
    Utilisé par: Accueil + Voir Transactions
    
    Args:
        df: DataFrame avec colonnes 'date', 'type', 'montant'
        height: Hauteur du graphique en pixels
    """
    if df.empty:
        st.info("Aucune donnée disponible pour le graphique")
        return

    # Préparer les données mensuelles
    df_copy = df.copy()
    df_copy["date"] = pd.to_datetime(df_copy["date"])
    df_copy["mois_str"] = df_copy["date"].dt.strftime("%b %Y")

    # Grouper par mois et type (Assurons nous que le type est normalisé ici aussi par sécurité)
    df_copy["type"] = df_copy["type"].astype(str).str.capitalize()

    df_evolution = df_copy.groupby(["mois_str", "type"])["montant"].sum().unstack(fill_value=0)
    df_evolution = df_evolution.reindex(
        sorted(df_evolution.index, key=lambda x: pd.to_datetime(x, format='%b %Y'))
    )

    # S'assurer que les colonnes existent (Capitalized)
    if "Revenu" not in df_evolution.columns:
        df_evolution["Revenu"] = 0
    if "Dépense" not in df_evolution.columns:
        df_evolution["Dépense"] = 0

    # Arrondir les valeurs
    df_evolution["Dépense"] = df_evolution["Dépense"].round(2)
    df_evolution["Revenu"] = df_evolution["Revenu"].round(2)

    # Calculer le solde
    solde = (df_evolution["Revenu"] - df_evolution["Dépense"]).round(2)

    # Créer le graphique
    fig = go.Figure()

    # Barres de revenus
    fig.add_trace(go.Bar(
        name='Revenus',
        x=df_evolution.index,
        y=df_evolution["Revenu"],
        marker=dict(
            color='#00D4AA',
            line=dict(color='#00A87E', width=1.5),
        ),
        hovertemplate='<b>%{x}</b><br>Revenus: %{y:,.0f} €<extra></extra>'
    ))

    # Barres de dépenses
    fig.add_trace(go.Bar(
        name='Dépenses',
        x=df_evolution.index,
        y=df_evolution["Dépense"],
        marker=dict(
            color='#FF6B6B',
            line=dict(color='#CC5555', width=1.5),
        ),
        hovertemplate='<b>%{x}</b><br>Dépenses: %{y:,.0f} €<extra></extra>'
    ))

    # Ligne de solde
    fig.add_trace(go.Scatter(
        name='Solde',
        x=df_evolution.index,
        y=solde,
        mode='lines+markers',
        line=dict(color='#4A90E2', width=3),
        marker=dict(size=8, color='#4A90E2', line=dict(color='white', width=2)),
        hovertemplate='<b>%{x}</b><br>Solde: %{y:+,.0f} €<extra></extra>'
    ))

    # Configuration du layout
    fig.update_layout(
        title=dict(
            text='Évolution Revenus, Dépenses et Solde',
            font=dict(size=14, color='white')
        ),
        xaxis_title='',
        yaxis_title='Montant (€)',
        height=height,
        hovermode='x unified',
        barmode='group',
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.35,
            xanchor="center",
            x=0.5,
            font=dict(size=11, color="white"),
            bgcolor="rgba(0,0,0,0)",
            bordercolor="white",
            borderwidth=1
        ),
        margin=dict(t=40, b=100, l=50, r=20),
        paper_bgcolor='#1E1E1E',
        plot_bgcolor='#1E1E1E',
        font=dict(color='white'),
        xaxis=dict(
            showgrid=False,
            color='white',
            tickangle=-30,
            tickfont=dict(size=10),
            automargin=True,
        ),
        yaxis=dict(
            showgrid=True,
            gridcolor='rgba(255,255,255,0.1)',
            zeroline=True,
            zerolinewidth=2,
            zerolinecolor='rgba(255,255,255,0.3)',
            color='white',
            tickfont=dict(size=10),
        )
    )

    st.plotly_chart(fig, use_container_width=True)
