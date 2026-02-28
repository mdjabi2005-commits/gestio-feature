# Test Database Configuration

## Comment utiliser test_base.db

### Option 1 : Variable d'environnement (Recommandé)

**PowerShell** :
```powershell
$env:TEST_MODE="true"
streamlit run main.py
```

**CMD** :
```cmd
set TEST_MODE=true
streamlit run main.py
```

### Option 2 : Modifier directement config/__init__.py

Changer la ligne :
```python
TEST_MODE = os.getenv('TEST_MODE', 'false').lower() == 'true'
```

En :
```python
TEST_MODE = True  # Force test mode
```

## Vérification

Quand TEST_MODE est activé, vous verrez au démarrage :
```
⚠️ MODE TEST ACTIVÉ - Utilisation de test_base.db
```

## Bases de données

- **Production** : `data/base.db` (vos vraies données)
- **Test** : `data/test_base.db` (pour tester)

## Workflow de test

1. Activer TEST_MODE
2. Lancer l'app
3. Faire vos tests (ajouter transactions, etc.)
4. Vérifier que tout fonctionne
5. Désactiver TEST_MODE
6. Revenir sur base.db (production)

## Nettoyage

Pour réinitialiser la base de test :
```powershell
Remove-Item data\test_base.db
```

La base sera recréée automatiquement au prochain lancement en mode test.
