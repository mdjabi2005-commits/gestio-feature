import { cn } from "@/lib/utils"
import type { Budget } from "@/api"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"

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
        <Tooltip>
          <TooltipTrigger className="w-full space-y-1 cursor-help">
            <div className="flex justify-between text-[9px] font-bold uppercase text-rose-400/60 tracking-wider">
              <span className="flex items-center gap-1">
                {budget.montant_max > 0 ? "Dépenses" : "À configurer"}
                <HelpCircle className="w-3 h-3 text-rose-400/30" />
              </span>
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
          </TooltipTrigger>
          <TooltipContent className="max-w-48">
            <p>La barre montre l'utilisation de votre budget :</p>
            <ul className="mt-1 text-xs opacity-80">
              <li>• Partie colorée : dépenses enregistrées</li>
              <li>• Partie transparente : dépenses prévues</li>
            </ul>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger className="py-2 flex items-center gap-2 cursor-help w-full">
            <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-tighter text-white/20">Pas de budget</span>
            <HelpCircle className="w-3 h-3 text-white/20" />
          </TooltipTrigger>
          <TooltipContent className="max-w-48">
            <p>Cliquez pour définir un budget mensuel pour cette catégorie.</p>
          </TooltipContent>
        </Tooltip>
      )}

      {totalForecastedIncome > 0 && !isSub && (
        <Tooltip>
          <TooltipTrigger className="w-full space-y-1 cursor-help">
            <div className="flex justify-between text-[9px] font-bold uppercase text-emerald-400/60 tracking-wider">
              <span className="flex items-center gap-1">
                Revenus
                <HelpCircle className="w-3 h-3 text-emerald-400/30" />
              </span>
              <span>{totalForecastedIncome.toLocaleString("fr-FR")}€</span>
            </div>
            <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                style={{ width: `${pctIncome}%` }}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-48">
            <p>Part de vos revenus_allouée à cette catégorie. Le total de vos budgets ne devrait pas dépasser vos revenus.</p>
          </TooltipContent>
        </Tooltip>
      )}
    </>
  )
}
