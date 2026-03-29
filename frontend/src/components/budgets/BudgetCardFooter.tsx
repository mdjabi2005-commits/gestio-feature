import { cn } from "@/lib/utils"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"

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
      <Tooltip>
        <TooltipTrigger className="flex flex-col text-left cursor-help">
          <span className="text-[9px] font-bold uppercase text-white/30 tracking-wider flex items-center gap-1">
            Dépensé
            <HelpCircle className="w-3 h-3 text-white/20" />
          </span>
          <span className="text-sm font-bold tabular-nums text-white/60">
            {spent.toLocaleString("fr-FR")} €
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-48">
          <p>Total des dépenses réel déjà enregistré pour cette catégorie ce mois-ci.</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger className="flex flex-col items-end cursor-help">
          <span className="text-[9px] font-bold uppercase text-white/30 tracking-wider flex items-center gap-1">
            Restant
            <HelpCircle className="w-3 h-3 text-white/20" />
          </span>
          <span className={cn("text-sm font-bold tabular-nums", 
            isOver ? "text-rose-400" : isPotentiallyOver ? "text-orange-400" : "text-white/60"
          )}>
            {isOver 
              ? `+${Math.abs(remainingActual).toLocaleString("fr-FR")}€` 
              : `${remainingForecast.toLocaleString("fr-FR")}€`
            }
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-48">
          {isOver ? (
            <p>Vous avez dépassé votre budget de {Math.abs(remainingActual).toLocaleString("fr-FR")}€.</p>
          ) : (
            <p>Montant restant à disposition pour cette catégorie ce mois-ci.</p>
          )}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
