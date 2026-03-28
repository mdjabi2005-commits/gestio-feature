import { cn } from "@/lib/utils"

interface BudgetCardFooterProps {
  spent: number
  isOver: boolean
  isPotentiallyOver: boolean
  remainingActual: number
  remainingForecast: number
}

export function BudgetCardFooter({
  spent,
  isOver,
  isPotentiallyOver,
  remainingActual,
  remainingForecast,
}: BudgetCardFooterProps) {
  return (
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
  )
}
