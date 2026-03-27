"""
Tests pour l'archivage des documents et le watcher OCR.
"""

import os
import tempfile
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock

from backend.api.ocr.ocr import (
    _archive_file,
    _archive_ticket_file,
    _archive_payroll_file,
)
from backend.domains.transactions.database.model import Transaction


class TestArchiveFile:
    """Tests de la fonction d'archivage _archive_file."""

    @pytest.fixture
    def temp_dir(self):
        """Crée un répertoire temporaire pour les tests."""
        with tempfile.TemporaryDirectory() as tmpdir:
            yield tmpdir

    def test_archive_ticket_with_category(self, temp_dir):
        """Test archivage ticket avec catégorie."""
        test_file = os.path.join(temp_dir, "test_ticket.jpg")
        with open(test_file, "wb") as f:
            f.write(b"fake image data")

        result = _archive_file(
            source_path=test_file,
            category="Alimentation",
            sub_category="Supermarché",
            target_base_dir=temp_dir,
            is_ticket=True,
        )

        assert result is not None
        assert os.path.exists(result)
        assert "Alimentation" in result
        assert "Supermarché" in result
        assert "test_ticket.jpg" in result

    def test_archive_ticket_without_subcategory(self, temp_dir):
        """Test archivage ticket sans sous-catégorie."""
        test_file = os.path.join(temp_dir, "ticket.jpg")
        with open(test_file, "wb") as f:
            f.write(b"fake data")

        result = _archive_file(
            source_path=test_file,
            category="Transport",
            sub_category=None,
            target_base_dir=temp_dir,
            is_ticket=True,
        )

        assert result is not None
        assert "Transport" in result
        assert "Divers" in result

    def test_archive_handles_duplicate_names(self, temp_dir):
        """Test que les doublons sont gérés avec suffixe numérique."""
        test_file1 = os.path.join(temp_dir, "ticket.jpg")
        test_file2 = os.path.join(temp_dir, "ticket_1.jpg")

        with open(test_file1, "wb") as f:
            f.write(b"data1")
        with open(test_file2, "wb") as f:
            f.write(b"data2")

        result1 = _archive_file(
            source_path=test_file1,
            category="Test",
            sub_category="Cat1",
            target_base_dir=temp_dir,
            is_ticket=True,
        )

        result2 = _archive_file(
            source_path=test_file2,
            category="Test",
            sub_category="Cat1",
            target_base_dir=temp_dir,
            is_ticket=True,
        )

        assert result1 != result2
        assert os.path.exists(result1)
        assert os.path.exists(result2)

    def test_archive_removes_temp_prefixes(self, temp_dir):
        """Test que les préfixes temporaires sont retirés."""
        test_file = os.path.join(temp_dir, "ocr_ticket.jpg")
        with open(test_file, "wb") as f:
            f.write(b"data")

        result = _archive_file(
            source_path=test_file,
            category="Test",
            sub_category="Sub",
            target_base_dir=temp_dir,
            is_ticket=True,
        )

        assert "ocr_" not in os.path.basename(result)
        assert "ticket.jpg" in result

    def test_archive_income_pdf(self, temp_dir):
        """Test archivage PDF de revenu."""
        test_file = os.path.join(temp_dir, "income_fiche.pdf")
        with open(test_file, "wb") as f:
            f.write(b"fake pdf data")

        result = _archive_file(
            source_path=test_file,
            category="Épargne",
            sub_category="Salaire",
            target_base_dir=temp_dir,
            is_ticket=False,
        )

        assert result is not None
        assert "Épargne" in result
        assert "Salaire" in result


class TestArchiveTicketFile:
    """Tests de la fonction _archive_ticket_file."""

    @pytest.fixture
    def temp_dir(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            yield tmpdir

    @pytest.fixture
    def sample_transaction(self):
        return Transaction(
            id=1,
            type="Dépense",
            categorie="Alimentation",
            sous_categorie="Supermarché",
            description="Courses",
            montant=50.0,
            date="2026-01-15",
            source="ocr",
            recurrence=None,
            date_fin=None,
            compte_iban=None,
            external_id=None,
            echeance_id=None,
        )

    def test_archive_ticket_with_transaction(self, temp_dir, sample_transaction):
        """Test archivage avec transaction."""
        test_file = os.path.join(temp_dir, "ocr_test.jpg")
        with open(test_file, "wb") as f:
            f.write(b"data")

        result = _archive_ticket_file(test_file, sample_transaction)

        assert result is not None
        assert "Alimentation" in result
        assert "Supermarché" in result

    def test_archive_ticket_without_transaction(self, temp_dir):
        """Test archivage sans transaction retourne None."""
        test_file = os.path.join(temp_dir, "test.jpg")
        with open(test_file, "wb") as f:
            f.write(b"data")

        result = _archive_ticket_file(test_file, None)

        assert result is None


class TestArchivePayrollFile:
    """Tests de la fonction _archive_payroll_file."""

    @pytest.fixture
    def temp_dir(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            yield tmpdir

    @pytest.fixture
    def transactions_list(self):
        return [
            Transaction(
                type="Revenu",
                categorie="Épargne",
                sous_categorie="Salaire",
                description="Salaire",
                montant=2000.0,
                date="2026-01-31",
                source="scan_income",
                recurrence=None,
                date_fin=None,
                compte_iban=None,
                external_id=None,
                echeance_id=None,
            )
        ]

    def test_archive_payroll_with_transactions(self, temp_dir, transactions_list):
        """Test archivage fiche de paie."""
        test_file = os.path.join(temp_dir, "income_test.pdf")
        with open(test_file, "wb") as f:
            f.write(b"pdf data")

        result = _archive_payroll_file(test_file, transactions_list)

        assert result is not None
        assert "Épargne" in result
        assert "Salaire" in result

    def test_archive_payroll_without_transactions(self, temp_dir):
        """Test archivage sans transactions retourne None."""
        test_file = os.path.join(temp_dir, "test.pdf")
        with open(test_file, "wb") as f:
            f.write(b"data")

        result = _archive_payroll_file(test_file, [])

        assert result is None


class TestWatcherFunctions:
    """Tests des fonctions utilitaires du watcher."""

    def test_is_valid_file_images(self):
        """Test validation des fichiers image."""
        from backend.api.ocr.watcher import _is_valid_file

        assert _is_valid_file("ticket.jpg") == "image"
        assert _is_valid_file("ticket.jpeg") == "image"
        assert _is_valid_file("ticket.png") == "image"
        assert _is_valid_file("ticket.bmp") == "image"
        assert _is_valid_file("ticket.tiff") == "image"
        assert _is_valid_file("ticket.webp") == "image"

    def test_is_valid_file_pdf(self):
        """Test validation des fichiers PDF."""
        from backend.api.ocr.watcher import _is_valid_file

        assert _is_valid_file("fiche_paie.pdf") == "pdf"

    def test_is_valid_file_invalid(self):
        """Test fichiers invalides."""
        from backend.api.ocr.watcher import _is_valid_file

        assert _is_valid_file("readme.txt") is None
        assert _is_valid_file("document.doc") is None
        assert _is_valid_file("image.gif") is None
