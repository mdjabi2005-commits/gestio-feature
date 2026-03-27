"use client"
import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransactionMetricsProps {
  kpis: {
    revenus: number;
    depenses: number;
    solde: number;
    nb: number;
  };
  contextLabel: string;
}

export function TransactionMetrics({ kpis, contextLabel }: TransactionMetricsProps) {
  const [showMetrics, setShowMetrics] = useState(true)
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

  const metricCards = [
    {
      label: `Revenus ${contextLabel}`,
      value: fmt(kpis.revenus),
      color: 'text-emerald-400',
      border: 'border-emerald-500/20',
      dot: 'bg-emerald-500'
    },
    {
      label: `Dépenses ${contextLabel}`,
      value: fmt(kpis.depenses),
      color: 'text-rose-400',
      border: 'border-rose-500/20',
      dot: 'bg-rose-500'
    },
    {
      label: 'Solde net',
      value: fmt(kpis.solde),
      color: kpis.solde >= 0 ? 'text-emerald-400' : 'text-rose-400',
      border: kpis.solde >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20',
      dot: kpis.solde >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
    },
    {
      label: `Transactions ${contextLabel}`,
      value: kpis.nb.toString(),
      color: 'text-indigo-400',
      border: 'border-indigo-500/20',
      dot: 'bg-indigo-500'
    }
  ]

  return (
    <div className={cn(
      "sticky top-2 z-40 transition-all duration-300",
      showMetrics ? "bg-background/80 backdrop-blur-xl rounded-2xl border border-border/20 p-2 min-h-[44px]" : "pointer-events-none"
    )}>
      <div className="absolute right-2 top-2 z-40 pointer-events-auto">
        <button 
          onClick={() => setShowMetrics(!showMetrics)} 
          className={cn(
            "p-1.5 text-muted-foreground/60 hover:text-foreground transition-all rounded-lg",
            showMetrics ? "hover:bg-white/5" : "bg-background/80 backdrop-blur-md border border-border/20 shadow-sm hover:bg-background"
          )}
          title={showMetrics ? "Masquer les métriques" : "Afficher les métriques"}
        >
          {showMetrics ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {showMetrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pr-10 animate-in fade-in zoom-in-95 duration-200">
          {metricCards.map((kpi, i) => (
            <div key={i} className={cn(
              "glass-card rounded-2xl px-5 py-4 flex items-center gap-4 border transition-all duration-300 hover:bg-white/5",
              kpi.border
            )}>
              <div className={cn("w-2.5 h-2.5 rounded-full shrink-0 ring-4 ring-white/10", kpi.dot)} />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate font-medium">{kpi.label}</p>
                <p className={cn("text-xl font-bold tracking-tight", kpi.color)}>{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
