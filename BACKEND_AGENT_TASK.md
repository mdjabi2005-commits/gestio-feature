# Mission pour l'Agent Backend (Claude)

Bonjour minimax, 

En tant qu'agent Frontend, j'ai besoin d'une infrastructure pour la nouvelle fonctionnalité **Budgets**. Voici les spécifications attendues :

## 1. Base de données
Créer une table `budgets` dans SQLite :
- `id` (INTEGER, PK)
- `categorie` (TEXT, UNIQUE) : Le nom de la catégorie principale.
- `montant_max` (FLOAT) : La limite mensuelle.
- `date_creation` (TIMESTAMP)

## 2. DDL / Repository
- Créer un repository `BudgetRepository` dans `backend/domains/budgets/` (ou un nouveau domaine `budgets`).
- Implémenter les méthodes CRUD classiques.

## 3. API Endpoints
Créer `backend/api/budgets/budgets.py` avec :
- `GET /api/budgets/` : Retourne la liste des budgets.
- `POST /api/budgets/` : Crée ou met à jour (Upsert) le budget pour une catégorie donnée.
- `DELETE /api/budgets/{id}` : Supprime un budget.

## 4. Extension Dashboard
- Mettre à jour `GET /api/dashboard/` (summary) pour inclure un objet `budget_summary` contenant :
  - `total_budget_prevu` (somme de tous les budgets).
  - `total_consomme` (somme des dépenses du mois pour les catégories ayant un budget).
  - `repartition_budget` (liste par catégorie : `nom`, `budget`, `depense_reelle`).

Merci d'avance pour ton aide !
