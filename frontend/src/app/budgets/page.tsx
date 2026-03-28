"use client"

import { useState } from "react"
import { Plus, Wallet, TrendingDown, PiggyBank } from "lucide-react"
import { useFinancial } from "@/context/FinancialDataContext"
import { CATEGORY_STYLES } from "@/lib/categories"
import { BudgetCard } from "@/components/budgets/BudgetCard"
import { BudgetForm } from "@/components/budgets/BudgetForm"
import { PlanningSummary } from "@/components/budgets/PlanningSummary"
import { StrategyCard } from "@/components/budgets/StrategyCard"
import { SalaryPlanSetup } from "@/components/budgets/SalaryPlanSetup"
import { useBudgetCalculations, useStrategicBalance, useBudgetFilters } from "@/hooks/useBudgetCalculations"
import { getCategoryIcon } from "@/lib/icons"
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
    totalForecastedSavings,
  } = useBudgetCalculations(budgets, transactions, echeances)

  const { fixedChargesBalance, totalVariableBudgets } = useStrategicBalance(echeances, budgets)
  const { parentCategories, filteredBudgets } = useBudgetFilters(budgets, selectedCategory)

  const allCategories = summary?.repartition_categories ?? []

  const handleEdit = (budget: Budget) => { setEditTarget(budget); setShowForm(true) }
  const handleClose = () => { setShowForm(false); setEditTarget(null) }

  const handleAddSub = async (subName: string) => {
    if (!selectedCategory) return
    const newBudget: Budget = {
      categorie: `${selectedCategory} > ${subName}`,
      montant_max: 0
    }
    await setBudget(newBudget)
  }

  const totalOutflow = budgets.reduce((s, b) => s + b.montant_max, 0)
  const deficit = (activeSalaryPlan?.reference_salary || 0) - totalOutflow

  if (budgetsLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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

      <div className="space-y-6 mb-10">
        {!activeSalaryPlan ? (
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
              onClick={() => setShowPlanSetup(true)}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
            >
              C'est parti !
            </button>
          </div>
        ) : (
          <div className="relative group">
            <PlanningSummary 
              referenceSalary={activeSalaryPlan.reference_salary}
              fixedChargesBalance={fixedChargesBalance}
              variableBudgets={totalVariableBudgets}
              planName={activeSalaryPlan.nom}
            />
            <button 
              onClick={() => setShowPlanSetup(true)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white/80 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 z-10"
              title="Modifier le plan"
            >
              <TrendingDown className="w-4 h-4 rotate-180" />
            </button>
          </div>
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

      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide no-scrollbar">
        <button 
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shrink-0 border",
            !selectedCategory ? "bg-white/10 text-white border-white/20" : "bg-white/[0.02] text-white/40 border-transparent hover:bg-white/5"
          )}
        >
          Tous
        </button>
        {parentCategories.map(cat => {
          const style = CATEGORY_STYLES[cat] || { icone: 'help-circle', couleur: '#666' }
          const IconComp = getCategoryIcon(style.icone)
          return (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shrink-0 border",
                selectedCategory === cat 
                  ? "bg-white/10 text-white border-white/20" 
                  : "bg-white/[0.02] text-white/40 border-transparent hover:bg-white/5"
              )}
            >
              <IconComp className="w-3.5 h-3.5" style={{ color: selectedCategory === cat ? style.couleur : 'inherit' }} />
              {cat}
            </button>
          )
        })}
      </div>

      {selectedCategory && (
        <BudgetFocusView
          selectedCategory={selectedCategory}
          budgets={budgets}
          spentByCategory={spentByCategory}
          activeSalaryPlan={activeSalaryPlan}
          onAddSub={handleAddSub}
        />
      )}

      {filteredBudgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-indigo-400/50" />
          </div>
          <p className="text-white/40 text-sm">Aucun budget défini pour cette catégorie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBudgets.map((b) => {
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
                onDelete={deleteBudget}
                onEdit={handleEdit}
                isFiltered={!!selectedCategory}
                parentBudget={parentBudget}
              />
            )
          })}
        </div>
      )}

      {showForm && (
        <BudgetForm initial={editTarget} onSave={setBudget} onClose={handleClose} />
      )}
    </div>
  )
}

function BudgetFocusView({
  selectedCategory,
  budgets,
  spentByCategory,
  activeSalaryPlan,
  onAddSub,
}: {
  selectedCategory: string
  budgets: Budget[]
  spentByCategory: Record<string, number>
  activeSalaryPlan: any
  onAddSub: (name: string) => void
}) {
  const budgetObj = budgets.find(b => b.categorie === selectedCategory)
  const planItem = activeSalaryPlan?.items.find((c: any) => c.categorie === selectedCategory)
  const capacity = budgetObj?.montant_max || planItem?.montant || 0

  const subBudgets = budgets.filter(b => b.categorie.startsWith(`${selectedCategory} > `))
  const parentStyle = CATEGORY_STYLES[selectedCategory] || { couleur: '#6366f1' }

  const totalSpent = budgets
    .filter(b => b.categorie.startsWith(selectedCategory))
    .reduce((acc, b) => acc + (spentByCategory[b.categorie] || 0), 0)

  const spentPct = capacity > 0 ? Math.min((totalSpent / capacity) * 100, 100) : 0

  return (
    <div className="space-y-6 mb-8 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
          {selectedCategory}
        </h3>
        <div className="text-right">
          <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Capacité Totale</p>
          <p className="text-xl font-black text-white">{capacity.toLocaleString("fr-FR")} €</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-white/5 bg-white/[0.02] space-y-3">
          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-indigo-400/60">
            <span>Planification des Sous-Budgets</span>
            <span>Allocations (%)</span>
          </div>
          <div className="relative h-3 bg-white/[0.05] rounded-full overflow-hidden flex gap-0.5 p-0.5">
            {subBudgets.map((sub, idx, arr) => {
              const width = capacity > 0 ? (sub.montant_max / capacity) * 100 : 0
              const opacity = 1 - (idx / (arr.length || 1)) * 0.6
              
              return (
                <div 
                  key={sub.categorie}
                  className="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
                  style={{ 
                    width: `${width}%`, 
                    backgroundColor: parentStyle.couleur,
                    opacity
                  }}
                />
              )
            })}
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/11 bg-white/[0.04] space-y-3">
          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-rose-400/60">
            <span>Dépenses Réelles de l'Enveloppe</span>
            <span>{totalSpent.toLocaleString("fr-FR")}€</span>
          </div>
          <div className="h-3 bg-white/[0.05] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-1000"
              style={{ width: `${spentPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Sous-catégories trackées</h3>
        </div>
        
        <select 
          onChange={(e) => {
            if (e.target.value) onAddSub(e.target.value)
            e.target.value = ""
          }}
          className="bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer hover:bg-white/10 transition-all"
        >
          <option value="">+ Ajouter une sous-catégorie</option>
          {(CATEGORY_STYLES[selectedCategory]?.subcategories || [])
            .filter(sub => !budgets.some(b => b.categorie === `${selectedCategory} > ${sub}`))
            .map(sub => (
              <option key={sub} value={sub} className="bg-[#121216]">{sub}</option>
            ))
          }
        </select>
      </div>
    </div>
  )
}
