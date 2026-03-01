"""
Tests pour shared/utils/amount_parser.py
Couvre : formats FR/EN, symboles €/$, None, vide, chaînes invalides.
"""

import pytest
import pandas as pd
from shared.utils.amount_parser import parse_amount


class TestParseAmount:
    """Tests unitaires pour parse_amount."""

    # ─── Cas nominaux ────────────────────────────────────────

    def test_float_simple(self):
        assert parse_amount(42.50) == 42.50

    def test_entier(self):
        assert parse_amount(100) == 100.0

    def test_string_point(self):
        assert parse_amount("25.99") == 25.99

    def test_string_virgule_fr(self):
        """Format français : virgule comme séparateur décimal."""
        assert parse_amount("25,99") == 25.99

    def test_string_virgule_et_point_fr(self):
        """Format 1.000,50 → 1000.50."""
        assert parse_amount("1.000,50") == 1000.50

    def test_string_point_et_virgule_en(self):
        """Format 1,000.50 → 1000.50."""
        assert parse_amount("1,000.50") == 1000.50

    # ─── Symboles et espaces ─────────────────────────────────

    def test_symbole_euro(self):
        assert parse_amount("25.99 €") == 25.99

    def test_symbole_eur(self):
        assert parse_amount("25.99 EUR") == 25.99

    def test_symbole_dollar(self):
        assert parse_amount("$12.50") == 12.50

    def test_espace_insecable(self):
        assert parse_amount("1\xa0500,00") == 1500.0

    # ─── Valeurs limites ─────────────────────────────────────

    def test_zero(self):
        assert parse_amount(0) == 0.0

    def test_negatif(self):
        assert parse_amount("-15.50") == -15.50

    # ─── Cas d'erreur → retourne 0.0 ────────────────────────

    def test_none_retourne_zero(self):
        assert parse_amount(None) == 0.0

    def test_nan_retourne_zero(self):
        assert parse_amount(float("nan")) == 0.0

    def test_pd_na_retourne_zero(self):
        assert parse_amount(pd.NA) == 0.0

    def test_chaine_vide_retourne_zero(self):
        assert parse_amount("") == 0.0

    def test_chaine_invalide_retourne_zero(self):
        assert parse_amount("abc") == 0.0

    def test_chaine_que_symbole_retourne_zero(self):
        assert parse_amount("€") == 0.0

