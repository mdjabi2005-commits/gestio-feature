import { Trash2, AlertTriangle, CheckCircle2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface BudgetCardHeaderProps {
  budget: { id?: number; categorie: string; montant_max: number }
  isSub: boolean
  hasChanged: boolean
  isOver: boolean
  isPotentiallyOver: boolean
  isWarning: boolean
  isPending: boolean
  localAmount: number
  Icon: LucideIcon
  cardColor: string
  onCancel: (e: React.MouseEvent) => void
  onValidate: (e: React.MouseEvent) => void
  onDelete: () => void
}

export function BudgetCardHeader({
  budget,
  isSub,
  hasChanged,
  isOver,
  isPotentiallyOver,
  isWarning,
  isPending,
  localAmount,
  Icon,
  cardColor,
  onCancel,
  onValidate,
  onDelete,
}: BudgetCardHeaderProps) {
  return (
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
              onClick={onCancel}
              className="p-1 rounded-lg bg-white/5 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={onValidate}
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
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
