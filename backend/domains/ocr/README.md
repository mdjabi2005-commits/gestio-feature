# OCR Domain

## Fonctionnalité

Extraction intelligente de données textuelles à partir de documents physiques ou numériques (tickets de caisse, fiches de paie). Automatise la saisie des transactions via des algorithmes et modèles.

## Fichiers

- `core/pdfplumber_engine.py` - Moteur d'extraction PDF pour les fiches de paie
- `core/groq_parser.py` - Analyseur NLP via Groq
- `core/parser.py` - Utilitaires de parsing (montants, dates)
- `services/ocr_service.py` - Logique d'analyse combinant résultats bruts en Transactions

## Usage

### Scan Ticket

```python
from backend.domains.ocr.services.ocr_service import get_ocr_service

ocr = get_ocr_service()
transaction = ocr.process_ticket("chemin/vers/ticket.jpg")
print(transaction.montant, transaction.categorie)
```

### Extraction Fiche de Paie

```python
from backend.domains.ocr.core.pdfplumber_engine import pdfplumber_engine

data = pdfplumber_engine.extract_payroll_data("chemin/vers/salaire.pdf")
print("Salaire Net:", data.get("net"))
```

---

## 🔧 Quick Reference

### Endpoints API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/ocr/scan` | Scanner un ticket de caisse |
| `POST` | `/api/ocr/scan-batch` | Scanner plusieurs tickets |
| `POST` | `/api/ocr/scan-income` | Scanner une fiche de paie (PDF) |
| `GET/POST` | `/api/ocr/config` | Gérer la configuration (clé API Groq) |

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `pdfplumber non installé` | Dépendance optionnelle manquante | Exécuter `uv add pdfplumber` |
| `Format non supporté` | Fichier invalide envoyé | Envoyer jpg/png pour tickets, pdf pour revenus |
| `Clé API Groq invalide` | Clé mal formatée | Fournir une clé commençant par `gsk_` |
