"""
Tests du module OCR — parsers et hardware_utils.
Tests purement unitaires : aucune DB, aucun fichier image, aucun modèle chargé.
"""

import pytest
from datetime import date

from domains.transactions.ocr.core.parser import parse_amount, parse_date
from domains.transactions.ocr.core.hardware_utils import get_optimal_workers, get_cpu_info


# ─────────────────────────────────────────────────────────────────────────────
# Patterns réutilisables (copiés depuis ocr_patterns.yaml pour les tests)
# ─────────────────────────────────────────────────────────────────────────────

AMOUNT_PATTERNS = [
    r"TOTAL\s*:?\s*(\d+[.,]\d{2})",
    r"MONTANT\s*:?\s*(\d+[.,]\d{2})",
    r"(\d+[.,]\d{2})\s*€",
    r"(\d+[.,]\d{2})\s*EUR",
]

DATE_PATTERNS = [
    r"(\d{2})[/\-\.](\d{2})[/\-\.](\d{4})",
    r"(\d{2})[/\-\.](\d{2})[/\-\.](\d{2})",
]


# ─────────────────────────────────────────────────────────────────────────────
# Tests parse_amount
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.unit
@pytest.mark.ocr
class TestParseAmount:

    def test_total_simple(self):
        """Extrait le montant après TOTAL."""
        result = parse_amount("TOTAL : 42.50", AMOUNT_PATTERNS)
        assert result == pytest.approx(42.50)

    def test_montant_avec_virgule(self):
        """Accepte la virgule comme séparateur décimal."""
        result = parse_amount("MONTANT : 12,99", AMOUNT_PATTERNS)
        assert result == pytest.approx(12.99)

    def test_montant_avec_euro(self):
        """Extrait le montant suivi du symbole €."""
        result = parse_amount("25.00 €", AMOUNT_PATTERNS)
        assert result == pytest.approx(25.00)

    def test_prend_la_derniere_occurrence(self):
        """Quand plusieurs montants, prend le dernier (= total final)."""
        text = "Sous-total 10.00\nTOTAL 55.00"
        result = parse_amount(text, AMOUNT_PATTERNS)
        assert result == pytest.approx(55.00)

    def test_texte_vide_retourne_none(self):
        """Un texte vide doit retourner None sans exception."""
        assert parse_amount("", AMOUNT_PATTERNS) is None

    def test_aucun_montant_retourne_none(self):
        """Un texte sans montant reconnaissable doit retourner None."""
        assert parse_amount("Bonjour, merci de votre visite", AMOUNT_PATTERNS) is None



# ─────────────────────────────────────────────────────────────────────────────
# Tests parse_date
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.unit
@pytest.mark.ocr
class TestParseDate:

    def test_date_format_slash(self):
        """Extrait une date au format JJ/MM/AAAA."""
        result = parse_date("Date: 15/01/2026", DATE_PATTERNS)
        assert result == date(2026, 1, 15)

    def test_date_format_tiret(self):
        """Extrait une date au format JJ-MM-AAAA."""
        result = parse_date("15-01-2026", DATE_PATTERNS)
        assert result == date(2026, 1, 15)

    def test_date_format_court(self):
        """Extrait une date au format JJ/MM/AA."""
        result = parse_date("15/01/26", DATE_PATTERNS)
        assert result == date(2026, 1, 15)

    def test_texte_sans_date_retourne_none(self):
        """Un texte sans date reconnaissable doit retourner None."""
        assert parse_date("Aucune date ici", DATE_PATTERNS) is None

    def test_texte_vide_retourne_none(self):
        """Un texte vide doit retourner None sans exception."""
        assert parse_date("", DATE_PATTERNS) is None



# ─────────────────────────────────────────────────────────────────────────────
# Tests get_optimal_workers (Pilier 1)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.unit
class TestGetOptimalWorkers:

    def test_zero_taches_retourne_1(self):
        """0 tâches → toujours 1 worker minimum."""
        assert get_optimal_workers(0) == 1

    def test_une_tache_retourne_1(self):
        """1 seule tâche → pas besoin de plusieurs workers."""
        assert get_optimal_workers(1) == 1

    def test_ne_depasse_pas_les_taches(self):
        """On ne crée jamais plus de workers que de tâches."""
        workers = get_optimal_workers(2)
        assert workers <= 2

    def test_retourne_au_moins_1(self):
        """Le résultat est toujours >= 1, même sur une machine minimale."""
        assert get_optimal_workers(100) >= 1

    def test_type_retourne_int(self):
        """Le type de retour doit être un entier."""
        assert isinstance(get_optimal_workers(5), int)

    def test_get_cpu_info_contient_les_cles(self):
        """get_cpu_info() doit retourner les 4 clés attendues."""
        info = get_cpu_info()
        assert "physical_cores" in info
        assert "logical_cores" in info
        assert "total_ram_gb" in info
        assert "available_ram_gb" in info

