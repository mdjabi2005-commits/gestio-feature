# Transactions Domain

## Fonctionnalité

Centre nerveux de l'application. Gère **toutes** les opérations financières courantes et structurées (dépenses, revenus, virements internes). Fournit la vérité fondamentale du solde et de l'historique bancaire.

## Fichiers

- `model.py` - Modèle Pydantic `Transaction`
- `schema.py` - Schéma SQL (SQLite)
- `repository.py` - Opérations CRUD et requêtes avancées (listes filtrées)
- `service.py` - Logique métier (calcul de statistiques, validations complexes)
- `constants.py` - Énumérations et constantes (types de transactions, catégories)
- `GLOSSARY.md` - Dictionnaire métier du vocabulaire financier utilisé

## Usage

### Manipulation de Transactions

```python
from backend.domains.transactions.repository import transaction_repository
from backend.domains.transactions.model import Transaction

# Récupérer l'historique d'un mois
transactions = transaction_repository.get_all(month=4, year=2026)

# Ajouter une transaction manuelle
tx = Transaction(
    type="dépense",
    categorie="Transport",
    sous_categorie="Péage",
    montant=15.50,
    date="2026-04-09",
    description="Autoroute"
)
transaction_repository.add(tx)

# Mettre à jour une transaction
transaction_repository.update("tx_123", tx)
```

## Stratégie de Données

Les transactions sont considérées comme la **source de vérité (SSOT)**.
- Le solde actuel global est la somme dynamique de toutes les transactions réelles stockées.
- Toute automatisation (échéance ou OCR) passe ultimement par la création d'une `Transaction` pour impacter les bilans.

---

## 🔧 Quick Reference

### Endpoints API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/transactions/` | Récupère les transactions (pagination/filtres) |
| `POST` | `/api/transactions/` | Créer une transaction |
| `PUT`| `/api/transactions/{id}` | Modifier une transaction |
| `DELETE`| `/api/transactions/{id}`| Supprimer une transaction |

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Catégorie inconnue` | Erreur de saisie | Utiliser `constants.py` pour valider les catégories |
| `Sync Error` | Différence de typage Front/Back | Aligner `Transaction` (`model.py`) avec `frontend/src/api.ts` |
| `Exception: Date invalide` | Format string inapproprié | Toujours utiliser le standard ISO 8601 (`YYYY-MM-DD`) |
