"use client"
import { useState, useEffect } from "react"
import { Trash2, AlertTriangle, CheckCircle2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCategoryIcon } from "@/lib/icons"
import type { Budget } from "@/api"
import { useFinancial } from "@/context/FinancialDataContext"
import { useBudgetCardCalculations } from "@/hooks/useBudgetCalculations"

interface BudgetCardProps {
  budget: Budget
  spent: number
  planned: number
  income: number
  plannedIncome: number
  allCategories: any[]
  onDelete: (id: number) => void
  onEdit: (budget: Budget) => void
  isFiltered?: boolean
  parentBudget?: Budget | null
}

export function BudgetCard({ 
  budget, spent, planned, income, plannedIncome, allCategories, onDelete, onEdit,
  isFiltered, parentBudget 
}: BudgetCardProps) {
  const { setBudget } = useFinancial()
  const [localAmount, setLocalAmount] = useState(budget.montant_max)
  const [isPending, setIsPending] = useState(false)
  
  useEffect(() => {
    setLocalAmount(budget.montant_max)
  }, [budget.montant_max])

  const {
    pctRealSpent,
    pctPlannedSpent,
    pctIncome,
    remainingActual,
    remainingForecast,
    isOver,
    isPotentiallyOver,
    isWarning,
    localPct,
    cardColor,
  } = useBudgetCardCalculations(
    budget, spent, planned, income, plannedIncome,
    allCategories, localAmount, parentBudget, isFiltered
  )

  const Icon = getCategoryIcon(getCategoryMetadata(allCategories, budget.categorie).icone)
  const isSub = budget.categorie.includes(' > ')
  const hasChanged = Math.abs(localAmount - budget.montant_max) > 0.01

  const handleSliderChange = (newPct: number) => {
    if (!parentBudget) return
    const newAmount = (parentBudget.montant_max * newPct) / 100
    setLocalAmount(newAmount)
  }

  const handleValidate = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPending(true)
    try {
      await setBudget({ ...budget, montant_max: localAmount })
    } finally {
      setIsPending(false)
    }
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLocalAmount(budget.montant_max)
  }

  const totalForecastedIncome = income + plannedIncome

  return (
    <div
      className={cn(
        "group relative p-5 rounded-2xl transition-all border",
        isFiltered 
          ? "bg-white/[0.04] border-white/[0.08] cursor-default" 
          : isSub 
            ? "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04] ml-6 scale-[0.98] cursor-pointer" 
            : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05] cursor-pointer",
        hasChanged && "border-indigo-500/40 ring-1 ring-indigo-500/10"
      )}
      onClick={() => { if (!isFiltered) onEdit(budget) }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: `${cardColor}20` }}>
            {isSub && <div className="absolute inset-0 bg-black/20" />}
            <Icon className="w-5 h-5 relative z-10" style={{ color: cardColor }} />
          </div>
          <div className="flex flex-col text-left">
            <p className="text-sm font-semibold text-white truncate max-w-[150px]">
              {isSub ? budget.categorie.split(' > ')[1] : budget.categorie}
            </p>
            <p className={cn("text-[10px] font-medium transition-colors", hasChanged ? "text-indigo-400" : "text-white/40")}>
              {localAmount.toLocaleString("fr-FR")} €
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanged ? (
            <div className="flex items-center gap-1 animate-in zoom-in duration-300">
               <button 
                onClick={handleCancel}
                className="p-1 rounded-lg bg-white/5 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
               >
                 <X className="w-3.5 h-3.5" />
               </button>
               <button 
                onClick={handleValidate}
                disabled={isPending}
                className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all flex items-center justify-center min-w-[32px]"
               >
                 {isPending ? (
                   <div className="w-3 h-3 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                 ) : (
                   <Check className="w-4 h-4" />
                 )}
               </button>
            </div>
          ) : (
            <>
              {isOver ? (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              ) : isPotentiallyOver ? (
                <AlertTriangle className="w-4 h-4 text-orange-400 animate-pulse" />
              ) : isWarning ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : budget.montant_max > 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 opacity-60" />
              ) : null}
              <button
                onClick={(e) => { e.stopPropagation(); if (budget.id) onDelete(budget.id) }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {isFiltered && isSub && parentBudget && (
        <div className="mb-6 space-y-2 px-1" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center">
             <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Allocation</span>
             <span className={cn("text-xs font-black tabular-nums transition-colors", 
                localPct > 100 ? "text-rose-400" : hasChanged ? "text-indigo-400" : "text-white/60"
             )}>
               {localPct}%
             </span>
          </div>
          <input 
            type="range"
            min="0"
            max="120"
            value={localPct}
            onChange={(e) => handleSliderChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
          />
          {localPct > 100 && (
            <p className="text-[8px] font-bold text-rose-400 uppercase tracking-tighter flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" /> Dépasse l'enveloppe
            </p>
          )}
        </div>
      )}

      <div className={cn("space-y-4 transition-opacity", hasChanged && "opacity-40")}>
        {(budget.montant_max > 0 || (isFiltered && isSub)) ? (
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-bold uppercase text-rose-400/60 tracking-wider">
              <span>{budget.montant_max > 0 ? "Progression / Limite" : "Initialisation requise"}</span>
              <span>{budget.montant_max > 0 ? `${Math.round(pctRealSpent + pctPlannedSpent)}%` : "0%"}</span>
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
        ) : (
          <div className="py-2 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-tighter text-white/20">Aucune limite définie</span>
          </div>
        )}

        {(totalForecastedIncome > 0) && !isSub && (
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

        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between">
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-bold uppercase text-white/30 tracking-wider">Déjà payé</span>
            <span className="text-sm font-bold tabular-nums text-white/60">
              {spent.toLocaleString("fr-FR")} €
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

function getCategoryMetadata(allCategories: any[], categorie: string) {
  for (const cat of allCategories || []) {
    if (cat.nom === categorie) return cat
    const sub = (cat.sous_categories || []).find((s: any) => s.nom === categorie)
    if (sub) return sub
  }
  return { icone: 'help-circle', couleur: '#666' }
}
