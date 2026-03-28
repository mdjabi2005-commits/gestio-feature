"use client"

import { useState } from "react"
import { Plus, TrendingDown, PiggyBank } from "lucide-react"
import { useFinancial } from "@/context/FinancialDataContext"
import { BudgetCard } from "@/components/budgets/BudgetCard"
import { BudgetForm } from "@/components/budgets/BudgetForm"
import { PlanningSummary } from "@/components/budgets/PlanningSummary"
import { StrategyCard } from "@/components/budgets/StrategyCard"
import { SalaryPlanSetup } from "@/components/budgets/SalaryPlanSetup"
import { BudgetCategoryFilter } from "@/components/budgets/BudgetCategoryFilter"
import { BudgetGrid } from "@/components/budgets/BudgetGrid"
import { BudgetFocusView } from "@/components/budgets/BudgetFocusView"
import { useBudgetCalculations, useStrategicBalance, useBudgetFilters } from "@/hooks/useBudgetCalculations"
import { cn } from "@/lib/utils"
import type { Budget } from "@/api"

export default function BudgetsPage() {
  const { 
    budgets, transactions, setBudget, deleteBudget, budgetsLoading, 
    summary, echeances, activeSalaryPlan, setSalaryPlan 
  } = useFinancial()
  const [showForm, setShowForm] = useState(false)
  const [showPlanSetup, setShowPlanSetup] = useState(false)
  const [editTarget, setEditTarget] = useState<Budget | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const {
    spentByCategory,
    incomeByCategory,
    plannedExpensesByCategory,
    plannedIncomeByCategory,
  } = useBudgetCalculations(budgets, transactions, echeances)

  const { fixedChargesBalance, totalVariableBudgets } = useStrategicBalance(echeances, budgets)
  const { parentCategories, filteredBudgets } = useBudgetFilters(budgets, selectedCategory)

  const allCategories = summary?.repartition_categories ?? []

  const handleEdit = (budget: Budget) => { setEditTarget(budget); setShowForm(true) }
  const handleClose = () => { setShowForm(false); setEditTarget(null) }

  const handleAddSub = async (subName: string) => {
    if (!selectedCategory) return
    await setBudget({ categorie: `${selectedCategory} > ${subName}`, montant_max: 0 })
  }

  const totalOutflow = budgets.reduce((s, b) => s + b.montant_max, 0)
  const deficit = (activeSalaryPlan?.reference_salary || 0) - totalOutflow

  if (budgetsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <BudgetsHeader
        budgetsCount={budgets.length}
        onNewBudget={() => { setEditTarget(null); setShowForm(true) }}
      />

      <div className="space-y-6 mb-10">
        {!activeSalaryPlan ? (
          <SalaryPlanPrompt onSetup={() => setShowPlanSetup(true)} />
        ) : (
          <SalaryPlanSection
            referenceSalary={activeSalaryPlan.reference_salary}
            fixedChargesBalance={fixedChargesBalance}
            totalVariableBudgets={totalVariableBudgets}
            planName={activeSalaryPlan.nom}
            onEdit={() => setShowPlanSetup(true)}
          />
        )}
        
        {deficit < 0 && <StrategyCard deficit={deficit} className="animate-in fade-in slide-in-from-top-4 duration-700" />}
      </div>

      {showPlanSetup && (
        <SalaryPlanSetup 
          plan={activeSalaryPlan} 
          onSave={setSalaryPlan} 
          onClose={() => setShowPlanSetup(false)} 
        />
      )}

      <BudgetCategoryFilter
        parentCategories={parentCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {selectedCategory && (
        <BudgetFocusView
          selectedCategory={selectedCategory}
          budgets={budgets}
          spentByCategory={spentByCategory}
          activeSalaryPlan={activeSalaryPlan}
          onAddSub={handleAddSub}
        />
      )}

      <BudgetGrid
        budgets={filteredBudgets}
        spentByCategory={spentByCategory}
        plannedExpensesByCategory={plannedExpensesByCategory}
        incomeByCategory={incomeByCategory}
        plannedIncomeByCategory={plannedIncomeByCategory}
        allCategories={allCategories}
        activeSalaryPlan={activeSalaryPlan}
        selectedCategory={selectedCategory}
        onEdit={handleEdit}
        onDelete={deleteBudget}
      />

      {showForm && (
        <BudgetForm initial={editTarget} onSave={setBudget} onClose={handleClose} />
      )}
    </div>
  )
}

function BudgetsHeader({ budgetsCount, onNewBudget }: { budgetsCount: number; onNewBudget: () => void }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Budgets</h1>
        <p className="text-sm text-white/40 mt-0.5">
          {budgetsCount > 0 
            ? `${budgetsCount} catégorie${budgetsCount > 1 ? "s" : ""} suivie${budgetsCount > 1 ? "s" : ""}` 
            : "Aucun budget défini"}
        </p>
      </div>
      <button
        onClick={onNewBudget}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium hover:bg-indigo-500/30 transition-all"
      >
        <Plus className="w-4 h-4" /> Nouveau budget
      </button>
    </div>
  )
}

function SalaryPlanPrompt({ onSetup }: { onSetup: () => void }) {
  return (
    <div className="glass-card rounded-3xl p-8 border-indigo-500/20 bg-indigo-500/5 flex flex-col md:flex-row items-center justify-between gap-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
          <PiggyBank className="w-8 h-8 text-indigo-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Initialiser votre Plan</h2>
          <p className="text-sm text-white/40 font-medium leading-relaxed max-w-md">
            Définissez votre revenu de référence et vos règles d'allocation pour générer vos budgets automatiquement.
          </p>
        </div>
      </div>
      <button 
        onClick={onSetup}
        className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
      >
        C'est parti !
      </button>
    </div>
  )
}

function SalaryPlanSection({
  referenceSalary,
  fixedChargesBalance,
  totalVariableBudgets,
  planName,
  onEdit,
}: {
  referenceSalary: number
  fixedChargesBalance: number
  totalVariableBudgets: number
  planName: string
  onEdit: () => void
}) {
  return (
    <div className="relative group">
      <PlanningSummary 
        referenceSalary={referenceSalary}
        fixedChargesBalance={fixedChargesBalance}
        variableBudgets={totalVariableBudgets}
        planName={planName}
      />
      <button 
        onClick={onEdit}
        className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 z-10"
        title="Modifier le plan"
      >
        <TrendingDown className="w-4 h-4 rotate-180" />
      </button>
    </div>
  )
}


