"use client"

import { useState, useMemo } from "react"
import { Plus, Wallet, TrendingDown, Target, AlertTriangle, CheckCircle2, PiggyBank } from "lucide-react"
import { useFinancial } from "@/context/FinancialDataContext"
import { CATEGORY_STYLES } from "@/lib/categories"
import { BudgetCard } from "@/components/budgets/BudgetCard"
import { BudgetForm } from "@/components/budgets/BudgetForm"
import { PlanningSummary } from "@/components/budgets/PlanningSummary"
import { StrategyCard } from "@/components/budgets/StrategyCard"
import { SalaryPlanSetup } from "@/components/budgets/SalaryPlanSetup"
import { calculatePlannedExpenses, calculatePlannedIncomes } from "@/lib/budget-utils"
import type { Budget, Echeance, SalaryPlan } from "@/api"

export default function BudgetsPage() {
  const { 
    budgets, transactions, setBudget, deleteBudget, budgetsLoading, 
    summary, echeances, activeSalaryPlan, setSalaryPlan 
  } = useFinancial()
  const [showForm, setShowForm] = useState(false)
  const [showPlanSetup, setShowPlanSetup] = useState(false)
  const [editTarget, setEditTarget] = useState<Budget | null>(null)

  // Dépenses et Revenus réels du mois par catégorie
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    transactions.forEach(t => {
      const d = new Date(t.date)
      if (t.type === "depense" && d.getMonth() === month && d.getFullYear() === year) {
        const parentKey = t.categorie;
        const subKey = t.sous_categorie ? `${t.categorie} > ${t.sous_categorie}` : null;
        
        map[parentKey] = (map[parentKey] ?? 0) + t.montant;
        if (subKey) {
          map[subKey] = (map[subKey] ?? 0) + t.montant;
        }
      }
    })
    return map
  }, [transactions, month, year])

  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    transactions.forEach(t => {
      const d = new Date(t.date)
      if (t.type === "revenu" && d.getMonth() === month && d.getFullYear() === year) {
        const parentKey = t.categorie;
        const subKey = t.sous_categorie ? `${t.categorie} > ${t.sous_categorie}` : null;
        
        map[parentKey] = (map[parentKey] ?? 0) + t.montant;
        if (subKey) {
          map[subKey] = (map[subKey] ?? 0) + t.montant;
        }
      }
    })
    return map
  }, [transactions, month, year])

  // Prévisions (échéances à venir) par catégorie
  const plannedExpensesByCategory = useMemo(() => {
    return calculatePlannedExpenses(echeances, transactions, year, month)
  }, [echeances, transactions, year, month])

  const plannedIncomeByCategory = useMemo(() => {
    return calculatePlannedIncomes(echeances, transactions, year, month)
  }, [echeances, transactions, year, month])

  // Global stats
  const totalBudget = budgets.reduce((s, b) => s + b.montant_max, 0)
  const totalSpent = budgets.reduce((s, b) => s + (spentByCategory[b.categorie] ?? 0), 0)
  const totalIncome = budgets.reduce((s, b) => s + (incomeByCategory[b.categorie] ?? 0), 0)
  
  const totalPlannedExpenses = budgets.reduce((s, b) => s + (plannedExpensesByCategory[b.categorie] ?? 0), 0)
  const totalPlannedIncome = budgets.reduce((s, b) => s + (plannedIncomeByCategory[b.categorie] ?? 0), 0)
  
  const totalForecastedExpenses = totalSpent + totalPlannedExpenses
  const totalForecastedIncome = totalIncome + totalPlannedIncome
  const totalForecastedSavings = totalForecastedIncome - totalForecastedExpenses
  
  const globalPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0
  const forecastPct = totalBudget > 0 ? Math.min((totalForecastedExpenses / totalBudget) * 100, 100) : 0
  
  const overBudget = budgets.filter(b => (spentByCategory[b.categorie] ?? 0) > b.montant_max)
  const potentiallyOver = budgets.filter(b => {
    const spent = spentByCategory[b.categorie] ?? 0
    const planned = plannedExpensesByCategory[b.categorie] ?? 0
    return spent <= b.montant_max && (spent + planned) > b.montant_max
  })

  const allCategories = summary?.repartition_categories ?? []

  const handleEdit = (budget: Budget) => { setEditTarget(budget); setShowForm(true) }
  const handleClose = () => { setShowForm(false); setEditTarget(null) }

  if (budgetsLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Budgets</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {budgets.length > 0 ? `${budgets.length} catégorie${budgets.length > 1 ? "s" : ""} suivie${budgets.length > 1 ? "s" : ""}` : "Aucun budget défini"}
          </p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium hover:bg-indigo-500/30 transition-all"
        >
          <Plus className="w-4 h-4" /> Nouveau budget
        </button>
      </div>

      {/* Synergy Planning Section */}
      <div className="space-y-6 mb-10">
        {!activeSalaryPlan ? (
          <div className="glass-card rounded-3xl p-8 border border-white/5 bg-indigo-500/[0.02] flex flex-col md:flex-row items-center justify-between gap-6 group">
            <div className="flex items-center gap-6">
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
              onClick={() => setShowPlanSetup(true)}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
            >
              C'est parti !
            </button>
          </div>
        ) : (
          <div className="relative group">
            <PlanningSummary 
              referenceSalary={activeSalaryPlan?.reference_salary || 0}
              planName={activeSalaryPlan?.nom}
              fixedCosts={echeances.filter((e: Echeance) => e.type === 'depense').reduce((s: number, e: Echeance) => s + e.montant, 0)}
              variableBudgets={budgets.reduce((s, b) => {
                const hasEcheance = echeances.some((e: Echeance) => e.categorie === b.categorie && e.type === 'depense');
                return hasEcheance ? s : s + b.montant_max;
              }, 0)}
            />
            <button 
              onClick={() => setShowPlanSetup(true)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
              title="Modifier le plan"
            >
              <TrendingDown className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}
        
        {/* Uber Strategy Card (if deficit) */}
        {(() => {
          const refSalary = activeSalaryPlan?.reference_salary || 0;
          const totalOutflow = budgets.reduce((s, b) => s + b.montant_max, 0);
          const deficit = refSalary - totalOutflow;
          return deficit < 0 ? <StrategyCard deficit={deficit} className="animate-in fade-in slide-in-from-top-4 duration-700" /> : null;
        })()}
      </div>

      {/* Plan Setup Drawer/Modal */}
      {showPlanSetup && (
        <SalaryPlanSetup 
          plan={activeSalaryPlan} 
          onSave={setSalaryPlan} 
          onClose={() => setShowPlanSetup(false)} 
        />
      )}

      {/* Budget Cards Grid */}
      {budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-indigo-400/50" />
          </div>
          <p className="text-white/40 text-sm">Aucun budget défini. Créez-en un pour commencer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map(b => (
            <BudgetCard
              key={b.id}
              budget={b}
              spent={spentByCategory[b.categorie] ?? 0}
              planned={plannedExpensesByCategory[b.categorie] ?? 0}
              income={incomeByCategory[b.categorie] ?? 0}
              plannedIncome={plannedIncomeByCategory[b.categorie] ?? 0}
              allCategories={allCategories}
              onDelete={deleteBudget}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <BudgetForm initial={editTarget} onSave={setBudget} onClose={handleClose} />
      )}
    </div>
  )
}
