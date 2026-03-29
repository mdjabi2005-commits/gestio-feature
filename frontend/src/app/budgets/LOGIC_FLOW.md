# Logic Flow — Budgets

Ce document décrit comment les données budgétaires et les prévisions sont gérées dans l'application.

## Fichiers concernés

```
frontend/src/app/budgets/
├── page.tsx                    # Page principale (Gestion de l'état du mois et sélection)
├── PlanningSummary.tsx         # Composant résumé stratégique
├── BudgetCard.tsx              # Carte individuelle d'un budget (Drill-down au clic)
├── BudgetCardHeader.tsx        # En-tête de carte avec bouton d'édition dédié
├── BudgetGrid.tsx              # Grille d'affichage des budgets
├── BudgetTransactionsDrawer.tsx # Tiroir latéral de consultation des transactions [NOUVEAU]
├── MonthSelector.tsx           # Sélecteur de mois indépendant [NOUVEAU]
├── BudgetForm.tsx              # Formulaire de création/édition
├── SalaryPlanSetup.tsx         # Configuration du plan de salaire
└── ...

frontend/src/lib/
├── budget-utils.ts             # Fonctions de calcul (getMonthOccurrences, calculatePlannedExpenses, etc.)
└── categories.ts               # Styles des catégories
```

## Flux de Données

```mermaid
graph TD
    subgraph API
        BUD[FastAPI /api/budgets]
        ECH[FastAPI /api/echeances]
        TXS[FastAPI /api/transactions]
        SAL[FastAPI /api/salary-plans]
    end
    
    subgraph Frontend
        Context[FinancialDataContext]
        Page[BudgetsPage]
        Selector[MonthSelector]
        Utils["budget-utils.ts"]
        Summary[PlanningSummary]
        Drawer[BudgetTransactionsDrawer]
    end

    BUD --> Context
    ECH --> Context
    TXS --> Context
    SAL --> Context
    
    Context --> Page
    Page --> Selector
    Selector --> |selectedMonth/Year| Page
    Page --> Utils
    Utils --> Planned[Dépenses Planifiées]
    Page --> Summary
    
    Page --> Card[BudgetCard]
    Card -->|onClick| Drawer
    Page --> Drawer
    Drawer -->|Affiche| Transactions[Transactions filtrées par mois/catégorie]
```

## Strategic Balance (Solde Échéances)

Le "Solde Échéances" est calculé dans `useStrategicBalance()` (hooks/useBudgetCalculations.ts) :

1. **Récupération des échéances actives** (y compris 'paid')
2. **Calcul des occurrences** pour le mois en cours via `getMonthOccurrences()`
3. **Séparation** par type :
   - `type === 'revenu'` → revenu récurrent
   - `type === 'depense'` → charge fixe
4. **Solde** = Revenus récurrents - Charges fixes

```typescript
// Logique de calcul (useBudgetCalculations.ts)
echeances.forEach(ech => {
  const statut = ech.statut || ech.status || 'active';
  if (statut === 'inactive' || statut === 'paid') return;
  
  const occurrences = getMonthOccurrences(ech, year, month);
  const amount = Number(ech.montant || ech.amount) || 0;
  const totalAmount = occurrences.length * amount;
  
  const type = ech.type || 'depense';
  if (type === 'revenu' || type === 'income') {
    totalStrategicIncome += totalAmount;
  } else {
    totalStrategicExpense += totalAmount;
  }
});

const fixedChargesBalance = totalStrategicIncome - totalStrategicExpense;
```

## Filtrage Mensuel Indépendant

Contrairement à la page Transactions qui utilise le filtre global du contexte, la page Budgets gère son propre état `selectedMonth` et `selectedYear` :
1. **Isolation** : Permet d'analyser son budget sans changer les filtres de navigation globale.
2. **Propagations** : Le mois sélectionné est passé aux hooks `useBudgetCalculations` et au tiroir `BudgetTransactionsDrawer`.
3. **Réactivité** : Toutes les jauges (Consommé vs Limite) sont recalculées à chaque changement de mois via `MonthSelector`.

## Drill-Down et Consultation des Transactions

L'interaction avec les budgets a été transformée pour privilégier l'analyse :
- **Clic sur Carte** : Ouvre le `BudgetTransactionsDrawer`.
- **Logique de Filtrage** :
  - Si catégorie parente (ex: "Alimentation") : Affiche transactions de "Alimentation" + toutes les sous-catégories ("Alimentation > ...").
  - Si sous-catégorie : Affichage strict des transactions liées.
- **Tiroir (Drawer)** : Affiche un résumé financier spécifique au mois sélectionné et la liste des transactions avec montant et date précise.
- **Édition** : Déportée sur un bouton "Crayon" dédié dans `BudgetCardHeader` pour éviter les conflits d'interaction.

## Salary Plans

Les Salary Plans permettent de définir un revenu de référence et des allocations automatiques.

### Data Flow

```mermaid
graph LR
    User[Utilisateur] -->|Configure| Setup[SalaryPlanSetup]
    Setup -->|POST| API[/api/salary-plans/]
    API -->|upsert| DB[(SQLite: salary_plans)]
    DB -->|SELECT| API
    API -->|JSON| Context
    Context -->|activeSalaryPlan| Summary[PlanningSummary]
```

### Entrées / Sorties

| Source | Données |
|--------|---------|
| `/api/salary-plans/` | `reference_salary`, `nom`, `items[]` (catégorie, montant, type) |
| `/api/echeances/` | Échéances pour le calcul du solde stratégique |
| `/api/budgets/` | Budgets utilisateur |

### PlanningSummary Props

```typescript
interface PlanningSummaryProps {
  referenceSalary: number;      // Salaire de référence du plan
  fixedChargesBalance: number;  // Solde échéances (revenus - charges)
  variableBudgets: number;      // Budgets variables restants
  planName?: string;            // Nom du plan
}
```

## Calcul des Prévisions

La fonction `calculatePlannedExpenses` dans `budget-utils.ts` :

1. Identifie les occurrences d'échéances pour le mois en cours
2. Pour chaque occurrence, vérifie si une transaction réelle y est déjà associée (via `echeance_id`)
3. Si aucune transaction n'est associée, le montant est ajouté au "Prévu" (réservé)
4. Gère les fréquences : mensuel, hebdomadaire, quotidien, annuel, trimestriel, semestriel

## Sortie UI

- **Consommé (Réel)** : Dépenses réelles du mois
- **Réservé (Prévu)** : Échéances à venir non encore payées
- **Dépassement Prévisionnel** : Alertes si `Réel + Prévu > Limite`
- **PlanningSummary** : Barre multi-segments (Charges Fixes / Revenus Récurrents / Variables / Épargne)

## Effet Papillon

| Fichier modifié | Impact |
|-----------------|--------|
| `page.tsx` | Strategic balance, Salary Plan integration |
| `PlanningSummary.tsx` | Affichage du résumé stratégique |
| `budget-utils.ts` | Calcul des prévisions par catégorie |
| `api/salary-plans` (backend) | Salary Plans |

## Relations

- **Budgets** → Limites par catégorie
- **Échéances** → Charges/revenus récurrents，自动生成 occurrences
- **Salary Plans** → Revenu de référence + allocations
- **Transactions** → Dépenses/revenus réels
