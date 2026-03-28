"""
Tests pour la configuration OCR et le salary plan.
"""

import pytest

from backend.config.ocr_config import get_ocr_config, save_ocr_config


class TestOCRConfig:
    """Tests de la configuration OCR."""

    def test_save_and_get_config(self):
        """Test sauvegarde et récupération de la config."""
        result = save_ocr_config("gsk_testkey123")
        assert result["api_key"] == "gsk_testkey123"

    def test_get_config_empty(self):
        """Test récupération config vide."""
        result = get_ocr_config()
        assert "api_key" in result

    def test_api_key_validation(self):
        """Test validation du format de clé API."""
        from fastapi.testclient import TestClient
        from backend.main import app

        client = TestClient(app)

        response = client.post("/api/ocr/config", json={"api_key": "invalid_key"})
        assert response.status_code == 400

    def test_api_key_validation_valid(self):
        """Test avec clé valide."""
        from fastapi.testclient import TestClient
        from backend.main import app

        client = TestClient(app)

        response = client.post("/api/ocr/config", json={"api_key": "gsk_validkey"})
        assert response.status_code == 200


class TestSalaryPlanService:
    """Tests du service salary plan."""

    def test_load_salary_plan_default(self):
        """Test chargement du plan par défaut."""
        from backend.domains.transactions.services.salary_plan_service import (
            load_salary_plan,
        )

        plan = load_salary_plan("salary_plan_default.yaml")

        assert "allocations" in plan
        assert "name" in plan

    def test_validate_salary_plan_valid(self):
        """Test validation plan valide."""
        from backend.domains.transactions.services.salary_plan_service import (
            validate_salary_plan,
        )

        plan = {
            "name": "Test Plan",
            "is_active": True,
            "reference_salary": 3000,
            "default_remainder_category": "Épargne",
            "allocations": [
                {
                    "category": "Besoins",
                    "value": 50,
                    "type": "percent",
                    "sub_distribution_mode": "equal",
                },
                {
                    "category": "Loisirs",
                    "value": 20,
                    "type": "percent",
                    "sub_distribution_mode": "equal",
                },
            ],
        }

        result = validate_salary_plan(plan)
        assert result is True

    def test_validate_salary_plan_invalid_total(self):
        """Test validation plan invalide (total >= 100%)."""
        from backend.domains.transactions.services.salary_plan_service import (
            validate_salary_plan,
            SalaryPlanError,
        )

        plan = {
            "name": "Test Plan",
            "allocations": [
                {"category": "Besoins", "value": 60, "type": "percent"},
                {"category": "Loisirs", "value": 50, "type": "percent"},
            ],
        }

        with pytest.raises(SalaryPlanError):
            validate_salary_plan(plan)

    def test_apply_salary_split(self):
        """Test application du split salary."""
        from backend.domains.transactions.services.salary_plan_service import (
            apply_salary_split,
        )

        plan = {
            "name": "Test Plan",
            "is_active": True,
            "reference_salary": 3000,
            "default_remainder_category": "Épargne",
            "allocations": [
                {
                    "category": "Besoins",
                    "value": 50,
                    "type": "percent",
                    "sub_distribution_mode": "equal",
                },
            ],
        }

        transactions = apply_salary_split(2000, "2026-01-31", plan=plan)

        assert len(transactions) > 0
        total = sum(t.montant for t in transactions)
        assert total == 2000

    def test_get_available_plans(self):
        """Test récupération des plans disponibles."""
        from backend.domains.transactions.services.salary_plan_service import (
            get_available_plans,
        )

        plans = get_available_plans()

        assert isinstance(plans, list)
