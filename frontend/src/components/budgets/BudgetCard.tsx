"use client"
import { useState, useEffect } from "react"
import { Trash2, AlertTriangle, CheckCircle2, Check, X, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCategoryIcon, getCategoryMetadata } from "@/lib/categories"
import type { Budget } from "@/api"
import { useFinancial } from "@/context/FinancialDataContext"
import { useBudgetCardCalculations } from "@/hooks/useBudgetCalculations"
import { BudgetCardHeader } from "./BudgetCardHeader"
import { BudgetCardProgress } from "./BudgetCardProgress"
import { BudgetCardFooter } from "./BudgetCardFooter"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

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
  const totalForecastedIncome = income + plannedIncome

  const handleSliderChange = (newPct: number) => {
    if (!parentBudget) return
    setLocalAmount((parentBudget.montant_max * newPct) / 100)
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
      <BudgetCardHeader
        budget={budget}
        isSub={isSub}
        hasChanged={hasChanged}
        isOver={isOver}
        isPotentiallyOver={isPotentiallyOver}
        isWarning={isWarning}
        isPending={isPending}
        localAmount={localAmount}
        Icon={Icon}
        cardColor={cardColor}
        onCancel={handleCancel}
        onValidate={handleValidate}
        onDelete={() => budget.id && onDelete(budget.id)}
      />

      {isFiltered && isSub && parentBudget && (
        <BudgetCardSlider
          localPct={localPct}
          hasChanged={hasChanged}
          onChange={handleSliderChange}
        />
      )}

      <div className={cn("space-y-4 transition-opacity", hasChanged && "opacity-40")}>
        <BudgetCardProgress
          budget={budget}
          isSub={isSub}
          isOver={isOver}
          isWarning={isWarning}
          pctRealSpent={pctRealSpent}
          pctPlannedSpent={pctPlannedSpent}
          totalForecastedIncome={totalForecastedIncome}
          pctIncome={pctIncome}
        />

        <BudgetCardFooter
          spent={spent}
          isOver={isOver}
          isPotentiallyOver={isPotentiallyOver}
          remainingActual={remainingActual}
          remainingForecast={remainingForecast}
        />
      </div>
    </div>
  )
}

function BudgetCardSlider({
  localPct,
  hasChanged,
  onChange,
}: {
  localPct: number
  hasChanged: boolean
  onChange: (pct: number) => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="mb-6 space-y-2 px-1 cursor-help" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/30 flex items-center gap-1">
              Part
              <HelpCircle className="w-3 h-3 text-white/20" />
            </span>
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
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
          />
          {localPct > 100 && (
            <p className="text-[8px] font-bold text-rose-400 uppercase tracking-tighter flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" /> Dépasse le budget
            </p>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-48">
        <p>Part du budget parent.allouée à cette sous-catégorie. Ajustez avec le curseur.</p>
      </TooltipContent>
    </Tooltip>
  )
}
