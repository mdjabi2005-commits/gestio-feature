"""
Tests de l'endpoint OCR /api/ocr/scan

Tests d'intégration avec FastAPI TestClient.
"""

import io
import logging
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from backend.main import app

logger = logging.getLogger(__name__)
client = TestClient(app)


def create_ticket_image(
    width: int = 400,
    height: int = 200,
    text_lines: list[str] | None = None,
    format: str = "JPEG",
) -> io.BytesIO:
    """Crée une image de ticket en mémoire pour les tests."""
    if text_lines is None:
        text_lines = ["TOTAL : 42.50", "Date: 15/01/2026", "Auchan"]

    img = Image.new("RGB", (width, 50 + 50 * len(text_lines)), color="white")
    draw = ImageDraw.Draw(img)
    for i, line in enumerate(text_lines):
        draw.text((50, 30 + 50 * i), line, fill="black")

    buffer = io.BytesIO()
    img.save(buffer, format=format)
    buffer.seek(0)
    return buffer


class TestOCREndpoint:
    """Tests de l'endpoint /api/ocr/scan."""

    def test_scan_ticket_format_invalide(self):
        """Test upload fichier non-image → 400."""
        response = client.post(
            "/api/ocr/scan", files={"file": ("test.txt", b"not an image", "text/plain")}
        )
        assert response.status_code == 400
        assert "Format non supporté" in response.json()["detail"]

    def test_scan_sans_fichier(self):
        """Test sans fichier → 422."""
        response = client.post("/api/ocr/scan")
        assert response.status_code == 422

    def test_scan_ticket_jpeg_reussi(self):
        """Test scan ticket JPEG valide → 200 avec transaction."""
        buffer = create_ticket_image(
            text_lines=["TOTAL : 45.80", "Date: 25/03/2026", "Carrefour"], format="JPEG"
        )

        response = client.post(
            "/api/ocr/scan", files={"file": ("ticket.jpg", buffer, "image/jpeg")}
        )

        assert response.status_code == 200
        data = response.json()

        assert "transaction" in data
        assert "warnings" in data
        assert "raw_ocr_text" in data
        assert data["transaction"]["montant"] > 0

    def test_scan_ticket_png_reussi(self):
        """Test scan ticket PNG valide → 200."""
        buffer = create_ticket_image(
            text_lines=["TOTAL : 12.50", "Date: 10/02/2026", " Leclerc "], format="PNG"
        )

        response = client.post(
            "/api/ocr/scan", files={"file": ("ticket.png", buffer, "image/png")}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["transaction"]["montant"] > 0

    def test_scan_ticket_incomplete_warnings(self):
        """Test scan ticket incomplet → vérifie que warnings est présent."""
        buffer = create_ticket_image(
            text_lines=["Ticket incomplet", "Texte aléatoire sans données"],
            format="JPEG",
        )

        response = client.post(
            "/api/ocr/scan",
            files={"file": ("ticket_incomplete.jpg", buffer, "image/jpeg")},
        )

        assert response.status_code == 200
        data = response.json()

        assert "warnings" in data

    def test_scan_response_structure(self):
        """Test que la réponse a la bonne structure."""
        buffer = create_ticket_image(
            text_lines=["TOTAL : 99.99", "Date: 01/01/2026", "Test Magasin"],
            format="JPEG",
        )

        response = client.post(
            "/api/ocr/scan", files={"file": ("ticket.jpg", buffer, "image/jpeg")}
        )

        assert response.status_code == 200
        data = response.json()

        transaction = data["transaction"]
        assert "type" in transaction
        assert "categorie" in transaction
        assert "montant" in transaction
        assert "date" in transaction
        assert "description" in transaction
        assert "sous_categorie" in transaction
        assert "source" in transaction


class TestTransactionsEndpoint:
    """Tests des endpoints transactions."""

    def test_update_transaction_success(self):
        """Test mise à jour d'une transaction existante → 200."""
        add_response = client.post(
            "/api/transactions/",
            json={
                "type": "Dépense",
                "categorie": "Transport",
                "montant": 10.0,
                "date": "2026-01-15",
                "description": "Ticket metro",
                "source": "Manuel",
            },
        )
        transaction_id = add_response.json()

        update_response = client.put(
            f"/api/transactions/{transaction_id}",
            json={
                "type": "Dépense",
                "categorie": "Alimentation",
                "montant": 25.50,
                "date": "2026-01-20",
                "description": "Courses",
                "source": "Manuel",
            },
        )

        assert update_response.status_code == 200
        data = update_response.json()
        assert data["categorie"] == "Alimentation"
        assert data["montant"] == 25.50

    def test_update_transaction_not_found(self):
        """Test mise à jour transaction inexistante → 404."""
        response = client.put(
            "/api/transactions/99999",
            json={
                "type": "Dépense",
                "categorie": "Test",
                "montant": 10.0,
                "date": "2026-01-15",
                "source": "Manuel",
            },
        )
        assert response.status_code == 404
