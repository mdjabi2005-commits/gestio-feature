# Services (Logique Métier)

Ce dossier contient la **couche service** qui fait le lien entre les Pages (UI) et les Repositories (Données).

## 🎯 Rôle

Les Services encapsulent la **logique métier** :
- Transformation de données (mapping, conversion)
- Appels aux Repositories
- Logique complexe (calculs, aggregations)
- Orchestration de plusieurs opérations

## 📂 Contenu

| Fichier                      | Responsabilité                                      |
|------------------------------|-----------------------------------------------------|
| **`transaction_service.py`**  | Lecture/filtrage des transactions, mapping DB↔Model |
| **`attachment_service.py`**  | Gestion des fichiers joints (tickets, PDF)          |
| **`salary_plan_service.py`** | Gestion des plans de salaire et allocation          |
| **`echeance_service.py`**    | Gestion des échéances et backfill                  |

## 🔄 Flux de données

```mermaid
graph LR
    Pages[Pages UI] -->|Appelle| Services
    Services -->|CRUD| Repositories
    Repositories -->|SQL| DB[(SQLite)]

    subgraph "Services"
        TxS[TransactionService]
        AttS[AttachmentService]
        SPS[SalaryPlanService]
        EcheS[EcheanceService]
    end

    subgraph "Repositories"
        TxR[TransactionRepository]
        AttR[AttachmentRepository]
    end
```

## 📋 Méthodes par Service

### TransactionService
- `get_transaction_by_id(tx_id)` → Transaction
- `get_filtered_transactions_df(start, end, category)` → pd.DataFrame

### SalaryPlanService
- `load_salary_plan(filename)` → Dict
- `validate_salary_plan(plan)` → bool
- `apply_salary_split(net_amount, payroll_date, plan)` → List[Transaction]
- `get_available_plans()` → List[str]

### EcheanceService
- `calculate_next_occurrence(echeance)` → date
- `backfill_echeances(months_back)` → int
- `cleanup_past_echeances()` → int
- `refresh_echeances()` → None

### AttachmentService
- `add_attachment(...)` → bool
- `get_attachments(transaction_id)` → List[TransactionAttachment]
- `delete_attachment(attachment_id)` → bool
- `archive_income_file(...)` → str

## ⚡ Point important

Les Services **ne font pas de SQL direct** (sauf pour la récurrence qui est un cas spécial). Ils délèguent tout au Repository.

Voir aussi :
- [README principal du domaine](../README.md)
- [Database README](../database/README.md)
