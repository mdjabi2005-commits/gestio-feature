"use client"

import { useState, useMemo } from "react"
import { Plus, Wallet, TrendingDown, Target, AlertTriangle } from "lucide-react"
import { useFinancial } from "@/context/FinancialDataContext"
import { CATEGORY_STYLES } from "@/lib/categories"
import { BudgetCard } from "@/components/budgets/BudgetCard"
import { BudgetForm } from "@/components/budgets/BudgetForm"
import type { Budget } from "@/api"

export default function BudgetsPage() {
  const { budgets, transactions, setBudget, deleteBudget, budgetsLoading, summary } = useFinancial()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Budget | null>(null)

  // Dépenses réelles du mois par catégorie
  const now = new Date()
  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    transactions.forEach(t => {
      const d = new Date(t.date)
      if (t.type === "Dépense" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        map[t.categorie] = (map[t.categorie] ?? 0) + t.montant
      }
    })
    return map
  }, [transactions, now.getMonth(), now.getFullYear()])

  // Global stats
  const totalBudget = budgets.reduce((s, b) => s + b.montant_max, 0)
  const totalSpent = budgets.reduce((s, b) => s + (spentByCategory[b.categorie] ?? 0), 0)
  const globalPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0
  const overBudget = budgets.filter(b => (spentByCategory[b.categorie] ?? 0) > b.montant_max)

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

      {/* Global Summary Cards */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400/60">Budget total</p>
              <p className="text-xl font-bold tabular-nums text-indigo-400">{totalBudget.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-400/60">Consommé ce mois</p>
              <p className="text-xl font-bold tabular-nums text-rose-400">{totalSpent.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
              <p className="text-[10px] text-white/30">{globalPct.toFixed(0)}% du budget total</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${overBudget.length > 0 ? "bg-rose-500/15" : "bg-emerald-500/15"}`}>
              {overBudget.length > 0 ? <AlertTriangle className="w-6 h-6 text-rose-400" /> : <Target className="w-6 h-6 text-emerald-400" />}
            </div>
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${overBudget.length > 0 ? "text-rose-400/60" : "text-emerald-400/60"}`}>Dépassements</p>
              <p className={`text-xl font-bold tabular-nums ${overBudget.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>{overBudget.length}</p>
              <p className="text-[10px] text-white/30">{overBudget.length > 0 ? "catégorie(s) en dépassement" : "Tout est sous contrôle"}</p>
            </div>
          </div>
        </div>
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
