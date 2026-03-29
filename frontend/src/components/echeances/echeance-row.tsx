"use client"

import { useState } from "react"
import { CalendarDays, Check, RefreshCw, Hand, Pencil, Trash2, CheckSquare, Square } from "lucide-react"
import { cn } from "@/lib/utils"
import { statusConfig, type Installment } from "./echeance-types"

export function InstallmentRow({ installment, onMarkPaid, onEdit, onDelete, onViewDetail, isSelected, onSelect, selectionMode }: {
  installment: Installment
  onMarkPaid: (id: string) => void
  onEdit: (installment: Installment) => void
  onDelete: (id: string) => void
  onViewDetail: (installment: Installment) => void
  isSelected: boolean
  onSelect: (id: string) => void
  selectionMode: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const Icon = installment.icon
  const isIncome = installment.type === "revenu"
  const isPaid = installment.statut === "paid"
  const stat = statusConfig[installment.statut]

  // Use hex color with 15% opacity (decimal 0.15 * 255 = ~38 = 26 in hex)
  const bgStyle = { backgroundColor: `${installment.color}26` }
  const iconStyle = { color: installment.color }

  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode) {
      onSelect(installment.id)
    } else {
      onViewDetail(installment)
    }
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer",
        hovered ? "bg-white/[0.04]" : "bg-transparent",
        isSelected && "bg-indigo-500/10 border border-indigo-500/20"
      )}
    >
      {selectionMode && (
        <button onClick={(e) => { e.stopPropagation(); onSelect(installment.id) }} className="flex-shrink-0">
          {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-400" /> : <Square className="w-5 h-5 text-white/30 hover:text-white/50" />}
        </button>
      )}

      {/* Icon */}
      <div className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0" style={bgStyle}>
        <Icon className="w-5 h-5" style={iconStyle} strokeWidth={1.75} />
      </div>

      {/* Name & Category */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{installment.nom}</span>
          <span className={cn(
            "text-[9px] font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5 flex-shrink-0",
            installment.paymentMethod === "automatic" ? "bg-sky-500/10 text-sky-400/80" : "bg-orange-500/10 text-orange-400/80"
          )}>
            {installment.paymentMethod === "automatic" ? <RefreshCw className="w-2.5 h-2.5" /> : <Hand className="w-2.5 h-2.5" />}
            {installment.paymentMethod === "automatic" ? "Auto" : "Manuel"}
          </span>
        </div>
        <span className="text-xs text-white/40">{installment.categorie}</span>
      </div>

      {/* Date */}
      <div className="text-right min-w-[80px] flex-shrink-0">
        <div className="flex items-center justify-end gap-1.5 text-white/50">
          <CalendarDays className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{installment.date}</span>
        </div>
        <span className={cn("text-[10px]",
          installment.daysRemaining < 0 ? "text-amber-400" : installment.daysRemaining === 0 ? "text-emerald-400" : "text-white/30"
        )}>
          {isPaid ? "Complété" : installment.daysRemaining === 0 ? "Aujourd'hui" : installment.daysRemaining < 0 ? `Il y a ${Math.abs(installment.daysRemaining)}j` : `Dans ${installment.daysRemaining}j`}
        </span>
      </div>

      {/* Amount */}
      <div className="w-24 text-right flex-shrink-0">
        <span className={cn("font-bold text-base tabular-nums", isIncome ? "text-emerald-400" : "text-rose-400")}>
          {isIncome ? "+" : "-"}{installment.montant.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
          <span className="text-xs ml-0.5 opacity-50">€</span>
        </span>
      </div>

      {/* Status */}
      <div className="w-20 flex justify-center flex-shrink-0">
        <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap", stat.bg, stat.text)}>
          {stat.label}
        </span>
      </div>

      {/* Actions */}
      {!selectionMode && (
        <div className="flex items-center gap-1 w-28 justify-end flex-shrink-0">
          {isPaid ? (
            <div className="flex items-center gap-1 text-emerald-400/60 text-xs"><Check className="w-4 h-4" /></div>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); onMarkPaid(installment.id) }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
              <Check className="w-3 h-3" />Payé
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onEdit(installment) }}
            className={cn("p-1.5 rounded-lg transition-all", hovered ? "opacity-100 hover:bg-indigo-500/15 text-indigo-400" : "opacity-0 pointer-events-none")}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(installment.id) }}
            className={cn("p-1.5 rounded-lg transition-all", hovered ? "opacity-100 hover:bg-rose-500/15 text-rose-400" : "opacity-0 pointer-events-none")}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
