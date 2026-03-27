import React from "react"
import { X, Calendar, ArrowRight, TrendingDown, TrendingUp, Clock, Info, Banknote, History } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Installment } from "./echeance-types"
import { statusConfig } from "./echeance-types"

interface EcheanceDetailModalProps {
  installment: Installment
  onClose: () => void
  totalSpent: number
}

export function EcheanceDetailModal({ installment, onClose, totalSpent }: EcheanceDetailModalProps) {
  const Icon = installment.icon
  const isIncome = installment.type === "income"
  const stat = statusConfig[installment.status]

  // Calculate monthly equivalent
  const calculateMonthly = () => {
    const freq = (installment.frequence || "").toLowerCase()
    if (freq.includes("mensuel") || freq.includes("mensuelle")) return installment.amount
    if (freq.includes("annuel") || freq.includes("annuelle")) return installment.amount / 12
    if (freq.includes("hebdo")) return installment.amount * 4.33
    if (freq.includes("trimestriel")) return installment.amount / 3
    if (freq.includes("semestriel")) return installment.amount / 6
    return installment.amount
  }

  const monthlyAmount = calculateMonthly()

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Non définie"
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      
      <div 
        className="relative z-10 w-full max-w-xl bg-[#0f1117] border border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center" 
              style={{ backgroundColor: `${installment.color}26` }}
            >
              {Icon && <Icon className="w-6 h-6" style={{ color: installment.color }} strokeWidth={2} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{installment.name}</h2>
              <p className="text-sm text-white/40">{installment.category}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/[0.06] text-white/30 hover:text-white/70 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Montant Actuel</span>
              <div className="flex items-baseline gap-2">
                <span className={cn("text-2xl font-bold tabular-nums", isIncome ? "text-emerald-400" : "text-rose-400")}>
                  {isIncome ? "+" : "-"}{installment.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                </span>
                <span className="text-xs text-white/20">/ {installment.frequence}</span>
              </div>
            </div>
            
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Impact Mensuel</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white tabular-nums">
                  {monthlyAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                </span>
                <span className="text-xs text-white/20">/ mois</span>
              </div>
            </div>
          </div>

          {/* Timeline & Total */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" /> Profil Temporel
              </h3>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", stat.bg, stat.text)}>
                {stat.label}
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03]">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">Date de début</p>
                    <p className="text-sm font-medium text-white/80">{formatDate(installment.date_debut)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">Date de fin</p>
                    <p className="text-sm font-medium text-white/80">{formatDate(installment.date_fin)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-transparent border border-indigo-500/10">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <History className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">Total {isIncome ? "reçu" : "dépensé"} depuis le début</p>
                  <div className="flex items-baseline gap-2">
                    <p className={cn("font-bold", isIncome ? "text-emerald-400" : "text-rose-400")}>
                      {totalSpent.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                    </p>
                    <span className="text-[10px] text-white/20 italic">(basé sur l'historique des transactions)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {installment.description && (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <h4 className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-2">Notes</h4>
              <p className="text-xs text-white/60 leading-relaxed italic">
                "{installment.description}"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/[0.02] border-t border-white/[0.05] flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
