"""
Calendar Component - Calendrier interactif

Composant calendrier pour filtrer les transactions par date.
Affiche une vue mensuelle avec les jours ayant des transactions marquées.
"""

import calendar
from datetime import date, timedelta
from typing import Optional, Dict, Literal

import pandas as pd
import streamlit as st


def render_calendar(
        df: pd.DataFrame,
        key: str = "calendar",
        selected_month: Optional[date] = None
) -> Optional[date]:
    """
    Affiche un calendrier interactif mensuel.

    Args:
        df: DataFrame avec colonne 'date' et 'type'
        key: Clé unique pour les widgets Streamlit
        selected_month: Mois à afficher (défaut: mois en cours)

    Returns:
        Date sélectionnée ou None si aucune sélection
    """
    # Initialiser le mois affiché
    if f"{key}_month" not in st.session_state:
        st.session_state[f"{key}_month"] = selected_month or date.today().replace(day=1)

    # Liste de dates sélectionnées (au lieu d'une seule)
    if f"{key}_selected_dates" not in st.session_state:
        st.session_state[f"{key}_selected_dates"] = []

    current_month = st.session_state[f"{key}_month"]

    # Navigation mois - Version simplifiée sans rerun pour éviter les lags
    col_prev, col_title, col_next = st.columns([1, 3, 1])

    with col_prev:
        if st.button("◀", key=f"{key}_prev", help="Mois précédent", use_container_width=True):
            # Aller au mois précédent - sans rerun pour éviter le lag
            if current_month.month == 1:
                new_month = current_month.replace(year=current_month.year - 1, month=12)
            else:
                new_month = current_month.replace(month=current_month.month - 1)
            st.session_state[f"{key}_month"] = new_month
            st.session_state[f"{key}_selected_dates"] = []

    with col_title:
        mois_noms = [
            "", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
            "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
        ]
        st.markdown(
            f"<h3 class='gestio-cal-title'>{mois_noms[current_month.month]} {current_month.year}</h3>",
            unsafe_allow_html=True
        )

    with col_next:
        if st.button("▶", key=f"{key}_next", help="Mois suivant", use_container_width=True):
            # Aller au mois suivant - sans rerun
            if current_month.month == 12:
                new_month = current_month.replace(year=current_month.year + 1, month=1)
            else:
                new_month = current_month.replace(month=current_month.month + 1)
            st.session_state[f"{key}_month"] = new_month
            st.session_state[f"{key}_selected_dates"] = []

    # Calculer les jours avec transactions
    days_with_transactions = _get_days_with_transactions(df, current_month)

    # CSS ciblé pour compacter les boutons du calendrier
    st.markdown("""
<div class="gestio-calendar-grid"></div>
""", unsafe_allow_html=True)

    # Afficher la grille du calendrier
    _render_calendar_grid(current_month, days_with_transactions, key)

    # Sélection de plage de dates — espace vertical pour descendre le sélecteur
    st.markdown("<div style='margin-top: 1.5rem;'></div>", unsafe_allow_html=True)
    st.caption("📅 Sélection de plage (optionnel)")

    col_start, col_end = st.columns(2)

    with col_start:
        st.date_input(
            "Début",
            value=None,
            key=f"{key}_date_start",
            help="Laisser vide pour afficher toutes les transactions",
            on_change=None
        )

    with col_end:
        st.date_input(
            "Fin",
            value=None,
            key=f"{key}_date_end",
            help="Laisser vide pour afficher toutes les transactions",
            on_change=None
        )

    # Bouton reset sans use_container_width pour éviter les problèmes
    # Afficher indicateur de sélection
    selected_dates = st.session_state.get(f"{key}_selected_dates", [])
    if selected_dates:
        if len(selected_dates) == 1:
            st.info(f"📅 {selected_dates[0].strftime('%d/%m/%Y')}")
        else:
            dates_str = ", ".join([d.strftime('%d/%m') for d in sorted(selected_dates)])
            st.info(f"📅 {len(selected_dates)} jours sélectionnés: {dates_str}")

    # Bouton reset
    if selected_dates or st.session_state.get(f"{key}_date_start") or st.session_state.get(f"{key}_date_end"):
        if st.button("🔄 Réinitialiser", key=f"{key}_reset"):
            st.session_state[f"{key}_selected_dates"] = []

    return selected_dates


def _get_days_with_transactions(df: pd.DataFrame, month: date) -> Dict[int, Dict]:
    """
    Récupère les jours du mois ayant des transactions.
    
    Returns:
        Dict[jour] = {'has_revenue': bool, 'has_expense': bool, 'count': int}
    """
    if df.empty:
        return {}

    df_copy = df.copy()
    df_copy["date"] = pd.to_datetime(df_copy["date"])

    # Filtrer sur le mois
    mask = (
            (df_copy["date"].dt.year == month.year) &
            (df_copy["date"].dt.month == month.month)
    )
    df_month = df_copy[mask]

    if df_month.empty:
        return {}

    days_info = {}
    for _, row in df_month.iterrows():
        day = row["date"].day
        if day not in days_info:
            days_info[day] = {"has_revenue": False, "has_expense": False, "count": 0}

        days_info[day]["count"] += 1
        type_str = str(row["type"]).lower()
        if type_str == "revenu":
            days_info[day]["has_revenue"] = True
        else:
            days_info[day]["has_expense"] = True

    return days_info


def _render_calendar_grid(month: date, days_info: Dict[int, Dict], key: str) -> None:
    """Affiche la grille du calendrier."""

    # En-têtes des jours
    jours = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
    cols = st.columns(7)
    for i, jour in enumerate(jours):
        with cols[i]:
            st.markdown(
                f"<div class='gestio-cal-header'>{jour}</div>",
                unsafe_allow_html=True
            )

    # Obtenir le calendrier du mois
    cal = calendar.monthcalendar(month.year, month.month)

    # Liste des dates sélectionnées
    selected_dates = st.session_state.get(f"{key}_selected_dates", [])

    # Afficher les semaines
    for week_idx, week in enumerate(cal):
        cols = st.columns(7)
        for i, day in enumerate(week):
            with cols[i]:
                if day == 0:
                    # Cellule vide avec hauteur cohérente
                    st.markdown("<div class='gestio-cal-spacer'></div>", unsafe_allow_html=True)
                else:
                    _render_day_cell(day, days_info.get(day), selected_dates, month, key)

        # Ajouter un petit espace entre les semaines pour éviter les chevauchements
        if week_idx < len(cal) - 1:
            st.markdown("<div class='gestio-cal-week-gap'></div>", unsafe_allow_html=True)


def _render_day_cell(
        day: int,
        day_info: Optional[Dict],
        selected_dates: list,
        month: date,
        key: str
) -> None:
    """Affiche une cellule de jour sous forme de capsule colorée cliquable."""
    current_date = month.replace(day=day)
    is_selected = current_date in selected_dates
    has_transactions = day_info is not None

    if not has_transactions:
        # Jour sans transaction : numéro gris, non cliquable
        st.markdown(
            f"<div style='text-align:center;padding:0.4rem 0;"
            f"color:#64748b;font-size:0.875rem;line-height:1.8;'>{day}</div>",
            unsafe_allow_html=True
        )
        return

    # ── Couleur selon le type de transactions ─────────────────────
    has_rev = day_info["has_revenue"]
    has_exp = day_info["has_expense"]

    if has_rev and has_exp:
        color   = "#f59e0b"              # Ambre  — revenus + dépenses
        bg_tint = "rgba(245,158,11,.18)"
    elif has_rev:
        color   = "#10b981"              # Vert   — revenus uniquement
        bg_tint = "rgba(16,185,129,.18)"
    else:
        color   = "#ef4444"              # Rouge  — dépenses uniquement
        bg_tint = "rgba(239,68,68,.18)"

    bg           = color if is_selected else bg_tint
    text_color   = "white" if is_selected else color
    border_width = "2px"  if is_selected else "1px"
    count        = day_info.get("count", 0)

    # ── Marqueur CSS unique par cellule ───────────────────────────
    # Technique : on injecte un marqueur <div class="..."> + une règle
    # CSS :has() qui cible le bouton Streamlit immédiatement après.
    marker = f"gc-{key}-d{day}".replace("_", "-")

    st.markdown(f"""<style>
div[data-testid="stVerticalBlock"]:has(.{marker}) div[data-testid="stButton"] > button {{
    background:     {bg} !important;
    border:         {border_width} solid {color} !important;
    border-radius:  999px !important;
    color:          {text_color} !important;
    font-weight:    700 !important;
    font-size:      0.875rem !important;
    padding:        0.25rem 0 0.35rem !important;
    line-height:    1.3 !important;
    min-height:     unset !important;
    box-shadow:     none !important;
}}
div[data-testid="stVerticalBlock"]:has(.{marker}) div[data-testid="stButton"] > button:hover {{
    background:  {color} !important;
    color:       white !important;
    transform:   scale(1.1) !important;
    box-shadow:  0 3px 12px {color}55 !important;
}}
</style><div class="{marker}"></div>""", unsafe_allow_html=True)

    btn_type: Literal["primary", "secondary"] = "primary" if is_selected else "secondary"

    if st.button(
            f"{day}\n{'🟡' if (has_rev and has_exp) else '🟢' if has_rev else '🔴'}",
            key=f"{key}_day_{day}",
            type=btn_type,
            use_container_width=True,
            help=f"{'🟢' if has_rev and not has_exp else '🔴' if has_exp and not has_rev else '🟡'} {count} transaction(s)"
    ):
        selected_list = st.session_state[f"{key}_selected_dates"].copy()
        if current_date in selected_list:
            selected_list.remove(current_date)
        else:
            selected_list.append(current_date)
        st.session_state[f"{key}_selected_dates"] = selected_list
        st.rerun()

def get_calendar_selected_dates(key: str = "calendar") -> list:
    """
    Retourne la liste des dates sélectionnées pour le filtrage.
    
    Returns:
        Liste de dates sélectionnées, ou liste vide si aucune sélection (affiche tout)
    """
    # Priorité 1 : plage de dates personnalisée
    date_start = st.session_state.get(f"{key}_date_start")
    date_end = st.session_state.get(f"{key}_date_end")

    if date_start and date_end:
        # Générer toutes les dates dans la plage
        dates = []
        current = date_start
        while current <= date_end:
            dates.append(current)
            current += timedelta(days=1)
        return dates
    elif date_start:
        # Seulement date de début: afficher depuis cette date jusqu'à aujourd'hui
        dates = []
        current = date_start
        today = date.today()
        while current <= today:
            dates.append(current)
            current += timedelta(days=1)
        return dates
    elif date_end:
        # Seulement date de fin : retourner juste cette date
        return [date_end]

    # Priorité 2 : dates cliqués sur le calendrier
    selected_dates = st.session_state.get(f"{key}_selected_dates", [])
    if selected_dates:
        return selected_dates

    # Par défaut : liste vide = afficher toutes les transactions
    return []
