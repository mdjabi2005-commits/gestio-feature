"use client"
import React from 'react'
import { TrendingDown, TrendingUp, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Installment } from './echeance-types'

interface EcheanceMetricsProps {
  transactions: any[];
  allEcheances: Installment[];
  summary: any;
}

export function EcheanceMetrics({ transactions, allEcheances, summary }: EcheanceMetricsProps) {
  const now = new Date()
  
  // Metric 1: dépenses réelles ce mois-ci (uniquement les transactions liées aux échéances)
  const monthTransactions = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.echeance_id
  })
  const depenseCeMois = monthTransactions.filter(t => t.type === 'depense').reduce((s, t) => s + t.montant, 0)
  const revenCeMois = monthTransactions.filter(t => t.type === 'revenu').reduce((s, t) => s + t.montant, 0)

  // Metric 2: argent restant fin de mois
  const echeancesCeMois = allEcheances.filter(i => {
    const d = new Date(i.date_prevue)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const echeanceRevenu = echeancesCeMois.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0)
  const echeanceDepense = echeancesCeMois.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0)
  const resteFinMois = echeanceRevenu - echeanceDepense

  // Metric 3: solde cumulé
  const soldeCumule = transactions.reduce((s, t) => t.type === 'revenu' ? s + t.montant : s - t.montant, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Card 1: Dépensé ce mois */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-500/15 flex-shrink-0">
          <TrendingDown className="w-6 h-6 text-rose-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-400/60">Dépensé ce mois</p>
          <p className="text-xl font-bold tabular-nums text-rose-400 truncate">
            -{depenseCeMois.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          </p>
          <p className="text-[10px] text-white/30 mt-0.5">{monthTransactions.filter(t => t.type === 'depense').length} transactions</p>
        </div>
      </div>

      {/* Card 2: Reste fin de mois */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", resteFinMois >= 0 ? "bg-emerald-500/15" : "bg-amber-500/15")}>
          <CreditCard className={cn("w-6 h-6", resteFinMois >= 0 ? "text-emerald-400" : "text-amber-400")} />
        </div>
        <div className="min-w-0">
          <p className={cn("text-[10px] font-semibold uppercase tracking-wider", resteFinMois >= 0 ? "text-emerald-400/60" : "text-amber-400/60")}>Reste fin de mois</p>
          <p className={cn("text-xl font-bold tabular-nums truncate", resteFinMois >= 0 ? "text-emerald-400" : "text-amber-400")}>
            {resteFinMois >= 0 ? '+' : ''}{resteFinMois.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          </p>
          <p className="text-[10px] text-white/30 mt-0.5">solde hypothétique (échéances)</p>
        </div>
      </div>

      {/* Card 3: Solde cumulé */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", soldeCumule >= 0 ? "bg-indigo-500/15" : "bg-rose-500/15")}>
          <TrendingUp className={cn("w-6 h-6", soldeCumule >= 0 ? "text-indigo-400" : "text-rose-400")} />
        </div>
        <div className="min-w-0">
          <p className={cn("text-[10px] font-semibold uppercase tracking-wider", soldeCumule >= 0 ? "text-indigo-400/60" : "text-rose-400/60")}>Solde cumulé</p>
          <p className={cn("text-xl font-bold tabular-nums truncate", soldeCumule >= 0 ? "text-indigo-400" : "text-rose-400")}>
            {soldeCumule >= 0 ? '+' : ''}{soldeCumule.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          </p>
          <p className="text-[10px] text-white/30 mt-0.5">depuis la 1ère transaction</p>
        </div>
      </div>
    </div>
  )
}
