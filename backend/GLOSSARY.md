# 📖 Glossaire Global du Backend

Ce document explique les termes techniques utilisés dans l'API et ses différents domaines.

---

## 🏷️ Champs de Transaction

### `type`

**Type de transaction**

- `Dépense` - Argent qui sort
- `Revenu` - Argent qui rentre
- `Transfert+` - Virement entrant
- `Transfert-` - Virement sortant

### `categorie` / `sous_categorie`

**Classification hiérarchique des dépenses/revenus**

Exemples :

- `Alimentation` / `Supermarché`
- `Logement` / `Loyer`
- `Voiture` / `Essence`

> Les valeurs disponibles sont définies dans `domains/transactions/constants.py` → `TRANSACTION_CATEGORIES`.
> La catégorie est automatiquement normalisée en **Title Case** par Pydantic à l'instanciation.

### `montant`

**Montant en euros** - Toujours positif dans la DB. Le type (Dépense/Revenu) détermine le sens.

### `source`

**Origine de la transaction**

| Valeur           | Signification                           |
|------------------|-----------------------------------------|
| `manual`         | Saisie manuelle                         |
| `ocr`            | Ticket scanné via OCR                   |
| `pdf`            | Relevé ou facture PDF                   |
| `csv`            | Import CSV                              |
| `import_v2`      | Import CSV/Excel via la page d'import   |
| `ofx`            | Import fichier OFX/QFX bancaire         |
| `enable_banking` | Import via API Enable Banking           |

> Valeurs définies dans `domains/transactions/constants.py` → `TRANSACTION_SOURCES`.

### `external_id`

**Identifiant externe unique**

- **Usage principal** : Éviter les doublons lors des imports bancaires
- **Sources communes** : ID de la banque (FITID), hash du ticket OCR
- **Indexé** : `UNIQUE` en base de données

### `compte_iban`

**IBAN du compte** - Permet de suivre sur quel compte la transaction a eu lieu.

### `recurrence`

**Fréquence de répétition** (si applicable)

- `mensuelle`
- `hebdomadaire`
- `annuelle`

### `date_fin`

**Date de fin** - Pour les transactions récurrentes : quand la récurrence s'arrête.

---

## 🔄 Récurrence

### `backfill` (Rattrapage)

**Génération des transactions passées**

À chaque démarrage, le système vérifie si des occurrences ont été manquées depuis la dernière exécution et les crée avec
`source='récurrente_auto'`.

### `projection` / `echeances`

**Prévision future**

Les occurrences futures sont stockées dans la table `echeances` (pas dans `transactions`) pour permettre :

- Affichage du "reste à vivre"
- Alertes de trésorerie
- Planning des paiements à venir

### `statut` (de récurrence)

**État d'une récurrence**

- `active` - En cours
- `paused` - En pause
- `terminated` - Terminée

---

## 📎 Pièces Jointes (Attachments)

### `SORTED_DIR`

**Dossier des tickets triés**

Structure : `sorted/{Catégorie}/{Sous-catégorie}/{timestamp}_{fichier}`

### `REVENUS_TRAITES`

**Dossier des revenus importés**

Structure : `revenus/{Catégorie}/{Sous-catégorie}/{timestamp}_{fichier}`

---

## 💸 Virements

### `iban_source` / `iban_destination`

IBAN du compte émetteur / destinataire.

### `external_id_source` / `external_id_destination`

Identifiants externes des virements (ID banque).

---

## 🔧 Conventions

### Langue des clés — Français partout

Toutes les clés sont en **français** à tous les niveaux du code, sans exception.

| Emplacement          | Langue        |
|----------------------|---------------|
| Base de données      | 🇫🇷 Français |
| Modèles Pydantic     | 🇫🇷 Français |
| Services             | 🇫🇷 Français |
| Repositories         | 🇫🇷 Français |
| Pages UI (React/Next)  | 🇫🇷 Français |
| README / Doc         | 🇫🇷 Français |

> **Règle absolue** : il n'existe aucun mapping EN → FR dans le code.
> Si une source externe (CSV, API bancaire) utilise des clés anglaises,
> c'est à la couche d'import de les renommer **avant** de construire l'objet métier.

---

### Validation des données — Pydantic est la seule source de vérité

Toute validation et normalisation passe par `Transaction.model_validate(data)`.
Il n'existe pas de validateur manuel en dehors du modèle Pydantic.

| Règle                        | Où elle est définie               |
|------------------------------|-----------------------------------|
| Type valide (Dépense/Revenu) | `@field_validator("type")`        |
| Montant > 0, arrondi 2 déc.  | `@field_validator("montant")`     |
| Catégorie en Title Case      | `@field_validator("categorie")`   |
| `""` → `None`                | `@field_validator("sous_categorie", "description")` |
| Date non future              | `@model_validator(mode="after")`  |

La méthode `to_db_dict()` sur le modèle retourne le dict prêt pour SQLite
**sans utiliser `model_dump()`** — accès direct aux attributs.

---

### Constantes — `domains/transactions/constants.py` est la seule source de vérité

Toutes les constantes liées aux transactions (`TRANSACTION_TYPES`, `TRANSACTION_CATEGORIES`,
`TRANSACTION_SOURCES`, `SOURCE_DEFAULT`, etc.) sont définies **une seule fois**
dans `domains/transactions/constants.py` et importées depuis là partout ailleurs.

---

### Utilitaires de conversion — `shared/utils/converters.py`

Les fonctions `safe_convert()`, `safe_date_convert()` et `normalize_text()`
sont dans `shared/utils/converters.py`.
Elles sont utilisées lors des imports CSV/OFX pour normaliser les valeurs
brutes (montants européens `"1.234,56 €"`, dates `"15/01/2025"`) avant
de construire les objets métier.

---

### Pattern Repository

```
Pages UI → Services → Repositories → SQLite
```

- **Pages** : UI React/Next.js (Frontend), points d'entrée utilisateur. Interagissent avec le backend via les appels API.
- **Services** : Logique métier, point d'entrée unique pour les pages (`transaction_service`).
- **Repositories** : Accès SQL uniquement. Reçoivent des `Transaction` ou des dicts FR.
- **Models** : Validation et normalisation Pydantic. `to_db_dict()` prépare pour SQLite.

---

## 📁 Fichiers clés

| Fichier / Dossier                  | Rôle                                        |
|------------------------------------|---------------------------------------------|
| `domains/transactions/model.py`    | Définition Pydantic de la Transaction       |
| `domains/transactions/repository.py`| Accès SQL aux transactions                 |
| `domains/transactions/service.py`  | Logique métier centrale des transactions    |
| `domains/echeance/service.py`      | Génération des occurrences et récurrences   |
| `domains/attachments/service.py`   | Gestion du stockage et archivage de fichiers|
