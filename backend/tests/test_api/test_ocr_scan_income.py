"""
Tests de l'endpoint OCR /api/ocr/scan-income

Tests d'intégration avec FastAPI TestClient.
"""

import io
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


class TestScanIncomeEndpoint:
    """Tests de l'endpoint /api/ocr/scan-income."""

    def test_scan_income_invalid_format(self):
        """Test upload fichier non-PDF → 400."""
        response = client.post(
            "/api/ocr/scan-income",
            files={"file": ("test.txt", b"not a pdf", "text/plain")},
        )
        assert response.status_code == 400
        assert "Format non supporté" in response.json()["detail"]

    def test_scan_income_without_file(self):
        """Test sans fichier → 422."""
        response = client.post("/api/ocr/scan-income")
        assert response.status_code == 422


class TestSalaryPlansEndpoint:
    """Tests de l'endpoint /api/budgets/salary-plans."""

    def test_get_salary_plans(self):
        """Récupère la liste des salary plans."""
        response = client.get("/api/budgets/salary-plans")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_save_salary_plan(self):
        """Sauvegarde un salary plan."""
        plan_data = {
            "nom": "Plan Test",
            "is_active": True,
            "reference_salary": 3000.0,
            "default_remainder_category": "Épargne",
            "items": [
                {
                    "categorie": "Alimentation",
                    "montant": 50,
                    "type": "percent",
                    "sub_distribution_mode": "equal",
                },
                {
                    "categorie": "Voiture",
                    "montant": 20,
                    "type": "percent",
                    "sub_distribution_mode": "equal",
                },
            ],
        }
        response = client.post("/api/budgets/salary-plans", json=plan_data)
        assert response.status_code == 200
        data = response.json()
        assert data["nom"] == "Plan Test"

    def test_save_salary_plan_invalid_total(self):
        """Sauvegarde un salary plan avec total > 100% → 400."""
        plan_data = {
            "nom": "Plan Invalide",
            "reference_salary": 3000.0,
            "items": [
                {
                    "categorie": "Alimentation",
                    "montant": 60,
                    "type": "percent",
                    "sub_distribution_mode": "equal",
                },
                {
                    "categorie": "Voiture",
                    "montant": 50,
                    "type": "percent",
                    "sub_distribution_mode": "equal",
                },
            ],
        }
        response = client.post("/api/budgets/salary-plans", json=plan_data)
        assert response.status_code == 400


class TestOCRWarmup:
    """Tests du endpoint warmup."""

    def test_warmup_returns_ready(self):
        """Test le warmup OCR."""
        response = client.get("/api/ocr/warmup")
        assert response.status_code == 200
        assert "status" in response.json()
