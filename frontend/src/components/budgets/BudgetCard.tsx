"use client"
import { Trash2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCategoryMetadata } from "@/lib/categories"
import { getCategoryIcon } from "@/lib/icons"
import type { Budget } from "@/api"

interface BudgetCardProps {
  budget: Budget
  spent: number
  allCategories: any[]
  onDelete: (id: number) => void
  onEdit: (budget: Budget) => void
}

export function BudgetCard({ budget, spent, allCategories, onDelete, onEdit }: BudgetCardProps) {
  const pct = budget.montant_max > 0 ? Math.min((spent / budget.montant_max) * 100, 100) : 0
  const remaining = budget.montant_max - spent
  const isOver = spent > budget.montant_max
  const isWarning = pct >= 80 && !isOver

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
          {isOver ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : isWarning ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 opacity-60" />}
          <button
            onClick={(e) => { e.stopPropagation(); if (budget.id) onDelete(budget.id) }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-white/40">{pct.toFixed(0)}% consommé</span>
          <span className={cn("font-semibold tabular-nums", textColor)}>
            {isOver ? `+${Math.abs(remaining).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} € dépassé` : `${remaining.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} € restant`}
          </span>
        </div>
      </div>
    </div>
  )
}
