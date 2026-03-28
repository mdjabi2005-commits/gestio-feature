import { cn } from "@/lib/utils"
import type { Budget } from "@/api"

interface BudgetCardProgressProps {
  budget: Budget
  isSub: boolean
  isOver: boolean
  isWarning: boolean
  pctRealSpent: number
  pctPlannedSpent: number
  totalForecastedIncome: number
  pctIncome: number
}

export function BudgetCardProgress({
  budget,
  isSub,
  isOver,
  isWarning,
  pctRealSpent,
  pctPlannedSpent,
  totalForecastedIncome,
  pctIncome,
}: BudgetCardProgressProps) {
  const showExpenseBar = budget.montant_max > 0 || isSub

  return (
    <>
      {showExpenseBar ? (
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

      {totalForecastedIncome > 0 && !isSub && (
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
    </>
  )
}
