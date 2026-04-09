# Attachments Domain

## Fonctionnalité

Traitement, stockage et association des fichiers (pièces jointes) aux opérations métier correspondantes (ex. tickets de caisse rattachés aux transactions, bulletins de salaire).

## Fichiers

- `model.py` - Modèle Pydantic `Attachment`
- `schema.py` - Schéma SQL (SQLite)
- `repository.py` - Accès base de données
- `service.py` - Logique métier et gestion (stockage, archivage physique des fichiers)

## Usage

### Sauvegarder une Pièce Jointe

```python
from backend.domains.attachments.service import attachment_service
from backend.domains.attachments.model import Attachment

attachment_data = Attachment(
    transaction_id="tx_123",
    file_path="/documents/ticket.pdf",
    file_type="application/pdf",
    file_size=2048,
    file_name="ticket_leclerc.pdf"
)
saved_attachment = attachment_service.add(attachment_data)
```

### Archivage lors du Scan OCR

```python
from backend.api.attachments.attachments import archive_file

# Archive automatiquement un fichier de ticket selon sa catégorie
archive_file(
    file_path="temp/scan_123.jpg",
    category="Alimentation",
    sub_category="Courses",
    target_base_dir="sort_dir",
    is_ticket=True
)
```

## Gestion des Chemins

Les chemins de sauvegarde **ne doivent jamais** être codés en dur. Ils utilisent la configuration centralisée des chemins, notamment `backend.config.paths`.

---

## 🔧 Quick Reference

### Endpoints API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/attachments/` | Liste les pièces jointes (optionnel by `transaction_id`) |
| `POST` | `/api/attachments/upload` | Uploader une nouvelle pièce jointe |
| `GET` | `/api/attachments/{id}` | Télécharger/Voir le fichier |
| `DELETE`| `/api/attachments/{id}` | Supprimer une pièce jointe |

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Erreur lors de l'archivage` | Chemin cible inaccessible/inexistant | Vérifier les droits du filesystem et `config.paths` |
| `File not found` | Fichier supprimé du disque mais encore en base | Lancer un outil de nettoyage/synchronisation |
