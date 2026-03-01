# 🚀 Quick Start - Lancer les Tests

## Installation Rapide

```bash
# 1. Installer pytest
pip install pytest pytest-cov

# 2. Aller dans v4/
cd c:\Users\djabi\gestion-financière\v4
```

## Lancer les Tests

### Tous les tests
```bash
pytest
```

### Avec détails
```bash
pytest -v
```

### Avec coverage
```bash
pytest --cov=domains --cov=shared --cov-report=html
```

### Voir coverage dans navigateur
```bash
start htmlcov\index.html
```

## Tests Créés

✅ **13 tests prêts** :
- 5 tests repository (insert, update, delete, batch, validation)
- 5 tests OCR parser (normalize, tickets, Uber, empty, no amount)
- 3 tests pattern manager (singleton, load, not empty)
- 3 tests CSV export (success, empty error, date filter)

## Résultat Attendu

```
tests/test_transactions/test_repository.py .....     [38%]
tests/test_ocr/test_parsers.py .....                 [76%]
tests/test_ocr/test_pattern_manager.py ...           [100%]
tests/test_services/test_csv_export.py ...           [100%]

========== 13 passed in 2.5s ==========
```

## Si Erreurs

1. **Import errors** → Vérifier que vous êtes dans `v4/`
2. **Database locked** → Fermer Streamlit
3. **Missing modules** → `pip install -r requirements.txt`

## Objectif

🎯 **Coverage cible** : 20-30%  
📊 **Tests actuels** : 13  
✅ **Infrastructure** : 100% prête

---

**Prêt à tester !** Lancez `pytest` dans `v4/` 🚀
