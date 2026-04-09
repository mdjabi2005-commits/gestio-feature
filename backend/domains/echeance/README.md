# Echeance Domain

## Fonctionnalité

Gestion des dépenses et revenus réguliers. Permet de planifier des paiements dans le temps (mensuels, hebdomadaires...) et d'automatiser (backfill) leur prise en compte sous forme de véritables transactions.

## Fichiers

- `model.py` - Modèles Pydantic `Echeance`
- `schema.py` - Schéma SQL (SQLite)
- `repository.py` - Accès base de données
- `service.py` - Logique métier : calcul de la prochaine occurrence, génération automatique de transactions

## Usage

### Calcul de Prochaine Occurrence

```python
from backend.domains.echeance.service import echeance_service
from datetime import date

# Obtenir la prochaine date en fonction de la récurrence
prochaine_date = echeance_service.calculate_next_occurrence(
    start_date=date(2026, 1, 1),
    recurrence_type="Mensuelle",
    recurrence_interval=1
)
```

### Exécution du Backfill (Génération Automatique)

```python
from backend.domains.echeance.service import echeance_service

# Génère toutes les transactions dues jusqu'à aujourdd'hui depuis les échéances actives
transactions_creees = echeance_service.backfill_echeances()
print(f"{transactions_creees} échéances ont été générées automatiquement.")
```

## Symbiose Transaction/Échéance

Lorsque l'échéance génère une transaction (ou que le système crée manuellement une transaction via l'échéance), il est crucial de synchroniser les états : marquer l'échéance à l'état approprié (ex. *paid* pour un mois donné) permet de garder le prévisionnel cohérent côté budget (Strategic Balance).

---

## 🔧 Quick Reference

### Endpoints API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/echeances/` | Lister toutes les échéances |
| `POST` | `/api/echeances/` | Créer une échéance |
| `PUT` | `/api/echeances/{id}` | Modifier une échéance |
| `DELETE`| `/api/echeances/{id}` | Archiver/Supprimer une échéance |
| `POST` | `/api/echeances/run-backfill` | Déclencher manuellement la génération auto |

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Échéance non trouvée` | ID supprimé ou inexistant | Mettre à jour l'ID ciblé ou recharger la liste |
| `Modifications non répercutées` | On modifie l'échéance sans mettre à jour / générer une tx | Trigger update UI et backend backfill |
