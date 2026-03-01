"""
Tests pour shared/utils/categories_loader.py
Couvre : chargement YAML, get_categories, get_subcategories,
         save_category, save_subcategory, fallback, reload.
"""

import pytest
import yaml
from pathlib import Path


# ─── Fixtures ───────────────────────────────────────────────

@pytest.fixture
def yaml_path(tmp_path) -> Path:
    """Crée un categories.yaml minimal dans un dossier temporaire."""
    p = tmp_path / "categories.yaml"
    data = {
        "categories": [
            {"name": "Alimentation", "subcategories": ["Supermarché", "Restaurant"]},
            {"name": "Voiture", "subcategories": ["Essence", "Péage"]},
            {"name": "Autre", "subcategories": []},
        ]
    }
    p.write_text(yaml.dump(data, allow_unicode=True), encoding="utf-8")
    return p


@pytest.fixture(autouse=True)
def patch_yaml_path(yaml_path, monkeypatch):
    """Redirige le loader vers le YAML temporaire et vide le cache."""
    import shared.utils.categories_loader as loader
    monkeypatch.setattr(loader, "_YAML_PATH", yaml_path)
    monkeypatch.setattr(loader, "_cache", None)
    yield
    monkeypatch.setattr(loader, "_cache", None)


# ─── get_categories ─────────────────────────────────────────

class TestGetCategories:

    def test_retourne_les_noms(self):
        from shared.utils.categories_loader import get_categories
        cats = get_categories()
        assert "Alimentation" in cats
        assert "Voiture" in cats

    def test_ordre_preserve(self):
        from shared.utils.categories_loader import get_categories
        cats = get_categories()
        assert cats[0] == "Alimentation"
        assert cats[1] == "Voiture"

    def test_fallback_si_yaml_absent(self, monkeypatch, tmp_path):
        import shared.utils.categories_loader as loader
        monkeypatch.setattr(loader, "_YAML_PATH", tmp_path / "inexistant.yaml")
        monkeypatch.setattr(loader, "_cache", None)
        cats = loader.get_categories()
        assert len(cats) > 0  # fallback constants actif
        assert "Autre" in cats


# ─── get_subcategories ──────────────────────────────────────

class TestGetSubcategories:

    def test_retourne_sous_categories(self):
        from shared.utils.categories_loader import get_subcategories
        subs = get_subcategories("Alimentation")
        assert "Supermarché" in subs
        assert "Restaurant" in subs

    def test_categorie_inexistante_retourne_vide(self):
        from shared.utils.categories_loader import get_subcategories
        assert get_subcategories("CatégorieInventée") == []

    def test_categorie_sans_sous_categories(self):
        from shared.utils.categories_loader import get_subcategories
        assert get_subcategories("Autre") == []


# ─── save_category ──────────────────────────────────────────

class TestSaveCategory:

    def test_ajoute_nouvelle_categorie(self):
        from shared.utils.categories_loader import save_category, get_categories
        added = save_category("Animaux")
        assert added is True
        assert "Animaux" in get_categories()

    def test_refuse_doublon(self):
        from shared.utils.categories_loader import save_category
        save_category("Animaux")
        added = save_category("Animaux")
        assert added is False

    def test_normalise_en_title_case(self):
        from shared.utils.categories_loader import save_category, get_categories
        save_category("SPORT ET FITNESS")
        cats = get_categories()
        assert "Sport Et Fitness" in cats

    def test_refuse_nom_vide(self):
        from shared.utils.categories_loader import save_category
        assert save_category("") is False
        assert save_category("   ") is False

    def test_persiste_dans_yaml(self, yaml_path):
        from shared.utils.categories_loader import save_category
        save_category("Jardin")
        data = yaml.safe_load(yaml_path.read_text(encoding="utf-8"))
        names = [c["name"] for c in data["categories"]]
        assert "Jardin" in names


# ─── save_subcategory ───────────────────────────────────────

class TestSaveSubcategory:

    def test_ajoute_sous_categorie(self):
        from shared.utils.categories_loader import save_subcategory, get_subcategories
        added = save_subcategory("Alimentation", "Boulangerie")
        assert added is True
        assert "Boulangerie" in get_subcategories("Alimentation")

    def test_refuse_doublon(self):
        from shared.utils.categories_loader import save_subcategory
        save_subcategory("Alimentation", "Boulangerie")
        added = save_subcategory("Alimentation", "Boulangerie")
        assert added is False

    def test_cree_categorie_si_inexistante(self):
        from shared.utils.categories_loader import save_subcategory, get_categories
        save_subcategory("Jardinage", "Outillage")
        assert "Jardinage" in get_categories()

    def test_refuse_valeurs_vides(self):
        from shared.utils.categories_loader import save_subcategory
        assert save_subcategory("", "Supermarché") is False
        assert save_subcategory("Alimentation", "") is False

    def test_persiste_dans_yaml(self, yaml_path):
        from shared.utils.categories_loader import save_subcategory
        save_subcategory("Voiture", "Assurance")
        data = yaml.safe_load(yaml_path.read_text(encoding="utf-8"))
        voiture = next(c for c in data["categories"] if c["name"] == "Voiture")
        assert "Assurance" in voiture["subcategories"]


# ─── reload ─────────────────────────────────────────────────

class TestReload:

    def test_recharge_apres_modification(self, yaml_path):
        import shared.utils.categories_loader as loader
        # Charger une première fois
        loader.get_categories()
        # Modifier le fichier directement
        data = yaml.safe_load(yaml_path.read_text(encoding="utf-8"))
        data["categories"].append({"name": "NouvelleApresReload", "subcategories": []})
        yaml_path.write_text(yaml.dump(data, allow_unicode=True), encoding="utf-8")
        # Recharger
        loader.reload()
        assert "NouvelleApresReload" in loader.get_categories()

