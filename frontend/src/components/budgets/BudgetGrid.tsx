"use client"
import { Wallet } from "lucide-react"
import { BudgetCard } from "./BudgetCard"
import type { Budget, SalaryPlan } from "@/api"

interface BudgetGridProps {
  budgets: Budget[]
  spentByCategory: Record<string, number>
  plannedExpensesByCategory: Record<string, number>
  incomeByCategory: Record<string, number>
  plannedIncomeByCategory: Record<string, number>
  allCategories: any[]
  activeSalaryPlan: SalaryPlan | null
  selectedCategory: string | null
  onEdit: (budget: Budget) => void
  onDelete: (id: number) => void
  onShowTransactions: (budget: Budget) => void
}

export function BudgetGrid({
  budgets,
  spentByCategory,
  plannedExpensesByCategory,
  incomeByCategory,
  plannedIncomeByCategory,
  allCategories,
  activeSalaryPlan,
  selectedCategory,
  onEdit,
  onDelete,
  onShowTransactions,
}: BudgetGridProps) {
  if (budgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
          <Wallet className="w-8 h-8 text-indigo-400/50" />
        </div>
        <p className="text-white/40 text-sm">Aucun budget défini pour cette catégorie.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {budgets.map((b) => {
        const isSub = b.categorie.includes(' > ')
        const parentName = isSub ? b.categorie.split(' > ')[0] : null
        
        let parentBudget = parentName ? budgets.find(pb => pb.categorie === parentName) : null
        
        if (!parentBudget && parentName && activeSalaryPlan) {
          const planItem = activeSalaryPlan.items.find(c => c.categorie === parentName)
          if (planItem) {
            parentBudget = {
              categorie: parentName,
              montant_max: planItem.montant
            }
          }
        }

        return (
          <BudgetCard
            key={b.id || b.categorie}
            budget={b}
            spent={spentByCategory[b.categorie] ?? 0}
            planned={plannedExpensesByCategory[b.categorie] ?? 0}
            income={incomeByCategory[b.categorie] ?? 0}
            plannedIncome={plannedIncomeByCategory[b.categorie] ?? 0}
            allCategories={allCategories}
            onDelete={onDelete}
            onEdit={onEdit}
            onShowTransactions={onShowTransactions}
            isFiltered={!!selectedCategory}
            parentBudget={parentBudget}
          />
        )
      })}
    </div>
  )
}
