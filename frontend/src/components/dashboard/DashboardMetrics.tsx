"use client"
import React from 'react'
import { cn } from '@/lib/utils'
import { formatCurrency } from "@/lib/formatters"

interface DashboardMetricsProps {
  savingsRate: number;
  budgetSummary: {
    total_budget_prevu: number;
    total_consomme: number;
    total_planifie: number;
    total_previsionnel: number;
    consommation_pct: number;
    prevision_pct: number;
  };
  transactionCount: number;
  categoryCount: number;
}

export function DashboardMetrics({ savingsRate, budgetSummary, transactionCount, categoryCount }: DashboardMetricsProps) {
  return (
    <div className="lg:col-span-2 glass-card rounded-3xl p-8 flex flex-col justify-between border-indigo-500/10">
      <div className="space-y-10">
        <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest opacity-60">Indicateurs de Performance</h3>
        
        <div className="space-y-8">
          {/* Taux d'épargne */}
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
              <span className="text-muted-foreground">Taux d'épargne</span>
              <span className="text-emerald-400">{savingsRate}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: `${savingsRate}%` }} />
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
              <span className="text-muted-foreground">Budget consommé / prévu</span>
              <span className={cn(
                "transition-colors duration-300",
                budgetSummary.total_previsionnel > budgetSummary.total_budget_prevu ? "text-rose-400" : 
                budgetSummary.prevision_pct >= 80 ? "text-amber-400" : "text-indigo-400"
              )}>
                {budgetSummary.consommation_pct}% {budgetSummary.total_planifie > 0 && `(+${Math.round((budgetSummary.total_planifie / budgetSummary.total_budget_prevu) * 100)}% prévu)`}
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 flex">
              <div 
                className={cn(
                    "h-full transition-all duration-1000 ease-out",
                    budgetSummary.total_consomme > budgetSummary.total_budget_prevu ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]" :
                    budgetSummary.consommation_pct >= 80 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" : "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                )}
                style={{ width: `${Math.min(budgetSummary.consommation_pct, 100)}%` }} 
              />
              <div 
                className="h-full bg-white/20 transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(budgetSummary.total_planifie / budgetSummary.total_budget_prevu * 100, 100 - budgetSummary.consommation_pct)}%` }} 
              />
            </div>
            {budgetSummary.total_budget_prevu > 0 && (
              <div className="flex justify-between text-[9px] font-black text-white/20 uppercase tracking-widest">
                <p>Prévu : {formatCurrency(budgetSummary.total_previsionnel)}</p>
                <p>{formatCurrency(budgetSummary.total_consomme)} / {formatCurrency(budgetSummary.total_budget_prevu)}</p>
              </div>
            )}
          </div>

          {/* Objectif annuel */}
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
              <span className="text-muted-foreground">Progression Objectif annuel</span>
              <span className="text-purple-400">45%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full w-[45%] shadow-[0_0_10px_rgba(168,85,247,0.3)]" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-10">
        <div className="glass-card bg-white/5 border-white/5 rounded-3xl p-6 text-center hover:bg-white/10 transition-all duration-300 group">
          <p className="text-3xl font-black text-foreground tracking-tighter group-hover:scale-110 transition-transform">{transactionCount}</p>
          <p className="text-[9px] font-black text-muted-foreground uppercase mt-2 tracking-widest opacity-40">Transactions</p>
        </div>
        <div className="glass-card bg-white/5 border-white/5 rounded-3xl p-6 text-center hover:bg-white/10 transition-all duration-300 group">
          <p className="text-3xl font-black text-foreground tracking-tighter group-hover:scale-110 transition-transform">{categoryCount}</p>
          <p className="text-[9px] font-black text-muted-foreground uppercase mt-2 tracking-widest opacity-40">Catégories</p>
        </div>
      </div>
    </div>
  )
}
