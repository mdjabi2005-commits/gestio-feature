"use client"
import { Trash2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCategoryMetadata } from "@/lib/categories"
import { getCategoryIcon } from "@/lib/icons"
import type { Budget } from "@/api"

interface BudgetCardProps {
  budget: Budget
  spent: number
  planned: number
  income: number
  plannedIncome: number
  allCategories: any[]
  onDelete: (id: number) => void
  onEdit: (budget: Budget) => void
}

export function BudgetCard({ budget, spent, planned, income, plannedIncome, allCategories, onDelete, onEdit }: BudgetCardProps) {
  const totalForecastedSpent = spent + planned
  const totalForecastedIncome = income + plannedIncome
  const netForecasted = totalForecastedIncome - totalForecastedSpent
  
  const pctRealSpent = budget.montant_max > 0 ? Math.min((spent / budget.montant_max) * 100, 100) : 0
  const pctPlannedSpent = budget.montant_max > 0 ? Math.min((planned / budget.montant_max) * 100, 100 - pctRealSpent) : 0
  
  // Pour le revenu on peut comparer au même budget ou juste afficher la progression
  const pctIncome = budget.montant_max > 0 ? Math.min((totalForecastedIncome / budget.montant_max) * 100, 100) : 0
  
  const remainingActual = budget.montant_max - spent
  const remainingForecast = budget.montant_max - totalForecastedSpent
  
  const isOver = spent > budget.montant_max
  const isPotentiallyOver = !isOver && totalForecastedSpent > budget.montant_max
  const isWarning = (spent / budget.montant_max) >= 0.8 && !isOver

  const catMeta = getCategoryMetadata(allCategories, budget.categorie)
  const Icon = getCategoryIcon(catMeta.icone)

  const barColor = isOver ? "from-rose-600 to-rose-400" : isWarning ? "from-amber-600 to-amber-400" : "from-emerald-600 to-emerald-400"
  const textColor = isOver ? "text-rose-400" : isWarning ? "text-amber-400" : "text-emerald-400"

  return (
    <div
      className="group relative p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all cursor-pointer"
      onClick={() => onEdit(budget)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${catMeta.couleur}20` }}>
            <Icon className="w-5 h-5" style={{ color: catMeta.couleur }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{budget.categorie}</p>
            <p className="text-xs text-white/40">Limite : {budget.montant_max.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOver ? (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          ) : isPotentiallyOver ? (
            <AlertTriangle className="w-4 h-4 text-orange-400 animate-pulse" />
          ) : isWarning ? (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 opacity-60" />
          )}
          <button
            onClick={(e) => { e.stopPropagation(); if (budget.id) onDelete(budget.id) }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        {/* Barre Dépenses */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] font-bold uppercase text-rose-400/60 tracking-wider">
            <span>Dépenses</span>
            <span>{totalForecastedSpent.toLocaleString("fr-FR")}€</span>
          </div>
          <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden flex">
            <div
              className={cn("h-full bg-gradient-to-r transition-all duration-700", 
                isOver ? "from-rose-600 to-rose-400" : isWarning ? "from-amber-600 to-amber-400" : "from-rose-500/60 to-rose-500/40"
              )}
              style={{ width: `${pctRealSpent}%` }}
            />
            <div
              className="h-full bg-rose-500/10 transition-all duration-700"
              style={{ width: `${pctPlannedSpent}%` }}
            />
          </div>
        </div>

        {/* Barre Revenus */}
        {(totalForecastedIncome > 0) && (
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-bold uppercase text-emerald-400/60 tracking-wider">
              <span>Revenus</span>
              <span>{totalForecastedIncome.toLocaleString("fr-FR")}€</span>
            </div>
            <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                style={{ width: `${pctIncome}%` }}
              />
            </div>
          </div>
        )}

        {/* Barre Solde Net / Reste */}
        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase text-white/30 tracking-wider text-left">Solde Net prévu</span>
            <span className={cn("text-sm font-bold tabular-nums text-left", 
               netForecasted >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {netForecasted.toLocaleString("fr-FR")} €
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold uppercase text-white/30 tracking-wider">Reste à payer</span>
            <span className={cn("text-sm font-bold tabular-nums", 
               isOver ? "text-rose-400" : isPotentiallyOver ? "text-orange-400" : "text-white/60"
            )}>
               {isOver 
                ? `+${Math.abs(remainingActual).toLocaleString("fr-FR")}€` 
                : `${remainingForecast.toLocaleString("fr-FR")}€`
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
