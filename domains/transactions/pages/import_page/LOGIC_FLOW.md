# Flux Logique - Page d'Import (Refactorisé)

## Vue d'ensemble

Ce document détaille le flux de données pour l'import de transactions, en précisant pour chaque étape : la fonction
responsable, les données en entrée, et les données en sortie.

## Diagramme de Flux Détaillé

```mermaid
graph TD
    %% --- ACTEURS & SERVICES ---
    User((Utilisateur))
    PageLogic[Module: import_page.py]
    Repo[Service: TransactionRepository]
    DB[(Database: SQLite)]

    %% --- ÉTAPE 1 : CHARGEMENT ---
    subgraph "1. Chargement & Parsing"
        User -->|"Upload Fichier"| FileObj["BytesIO (CSV/Excel)"]
        FileObj -->|"Entrée"| FuncLoad["Fonction: load_data()"]
        FuncLoad -->|"Sortie"| RawDF["pd.DataFrame (Brut)<br/>[Cols: user_columns]"]
    end

    %% --- ÉTAPE 2 : CONFIGURATION ---
    subgraph "2. Configuration Mapping"
        RawDF -->|"Entrée"| FuncConfig["Fonction: render_config_step()"]
        FuncConfig -->|"Affiche"| UIConfig["UI: Selectbox/Multiselect"]
        User -- "Sélectionne Cols" --> UIConfig
        UIConfig -->|"Sortie (Submit)"| ConfigDict["Dict (Configuration)<br/>{date_col: str, amount_col: str,<br/>desc_cols: List[str], ...}"]
    end

    %% --- ÉTAPE 3 : TRANSFORMATION ---
    subgraph "3. Préparation Données"
        RawDF & ConfigDict -->|"Entrée"| FuncDraft["Fonction: generate_draft_df()"]
        FuncDraft -->|"Sortie"| DraftDF["pd.DataFrame (Normalisé)<br/>[Date, Montant, Type, Catégorie,<br/>Sous-Cat, Description]"]
    end

    %% --- ÉTAPE 4 : ÉDITION ---
    subgraph "4. Édition & Validation"
        DraftDF -->|"Entrée"| FuncEditor["Fonction: render_editor_step()"]
        FuncEditor -->|"Affiche"| UIEditor["UI: st.data_editor"]
        User -- "Corrige/Modifie" --> UIEditor
        UIEditor -->|"Sortie (Submit)"| FinalDF["pd.DataFrame (Final)"]
    end

    %% --- ÉTAPE 5 : PERSISTANCE ---
    subgraph "5. Sauvegarde"
        FinalDF -->|"Entrée"| FuncSave["Fonction: _save_transactions()"]
        FuncSave -->|"Boucle: Conversion"| TxDict["Dict (Transaction)<br/>{date, amount, type, category...}"]
        TxDict -->|"Appel"| FuncRepo["Repo: add_transaction(tx)"]
        FuncRepo -->|"SQL INSERT"| DB
    end

    %% --- RETOUR ---
    FuncSave -->|"Feedback"| Msg["st.success / st.error"]
```

## Dictionnaire des Données

| Donnée         | Type Python    | Description                                                                                                                      |
|:---------------|:---------------|:---------------------------------------------------------------------------------------------------------------------------------|
| **FileObj**    | `UploadedFile` | Objet fichier brut fourni par Streamlit.                                                                                         |
| **RawDF**      | `pd.DataFrame` | DataFrame tel que lu par Pandas (colonnes hétérogènes).                                                                          |
| **ConfigDict** | `dict`         | Contient les choix de mapping de l'utilisateur. Exemple : `{'date_col': 'Date Opération', 'desc_cols': ['Libellé', 'Réf'], ...}` |
| **DraftDF**    | `pd.DataFrame` | DataFrame standardisé avec les colonnes attendues par l'application (`Date`, `Montant`, `Type`...), mais pas encore validé.      |
| **FinalDF**    | `pd.DataFrame` | DataFrame après modifications manuelles de l'utilisateur dans le `data_editor`. C'est la source de vérité pour l'import.         |
| **TxDict**     | `dict`         | Dictionnaire unique représentant une transaction, conforme au schéma de la base de données.                                      |

## Responsabilités des Fonctions

| Fonction             | Responsabilité                                                                                                | Entrées                | Sorties                     |
|:---------------------|:--------------------------------------------------------------------------------------------------------------|:-----------------------|:----------------------------|
| `load_data`          | Lire le fichier (CSV/Excel), gérer les erreurs d'encodage, nettoyer les noms de colonnes.                     | `UploadedFile`         | `pd.DataFrame`              |
| `render_config_step` | Afficher les sélecteurs de colonnes, valider que Date/Montant sont présents.                                  | `pd.DataFrame`         | `dict` (Config) ou `None`   |
| `generate_draft_df`  | Appliquer le mapping, parser les dates/montants, fusionner les colonnes description/sous-cat.                 | `pd.DataFrame`, `dict` | `pd.DataFrame`              |
| `render_editor_step` | Afficher le tableau interactif, configurer les types de colonnes (Date, Selectbox), déclencher la sauvegarde. | `pd.DataFrame`         | - (Appelle sauvegarde)      |
| `_save_transactions` | Itérer sur le DataFrame final, convertir chaque ligne en Transaction, appeler le Repository.                  | `pd.DataFrame`         | `(int success, int errors)` |
