"use client"

import React from "react"
import { Target, TrendingUp, CheckCircle2 } from "lucide-react"

interface GoalStatsSummaryProps {
  totalTarget: number
  totalReal: number
  totalCurrent: number
  completedCount: number
  totalCount: number
}

export function GoalStatsSummary({ 
  totalTarget, 
  totalReal, 
  totalCurrent, 
  completedCount, 
  totalCount 
}: GoalStatsSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="glass-card p-6 rounded-3xl border border-white/10 flex items-center gap-5 shadow-inner">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0 animate-pulse-slow">
           <Target className="w-7 h-7 text-indigo-400" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-indigo-400/60 tracking-widest mb-0.5">Total Cible</p>
          <p className="text-2xl font-black text-white tabular-nums">{totalTarget.toLocaleString("fr-FR")} €</p>
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl border border-white/10 flex items-center gap-5 shadow-inner bg-emerald-500/[0.02] relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-2 opacity-10">
            <TrendingUp className="w-12 h-12 text-emerald-400" />
         </div>
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
           <TrendingUp className="w-7 h-7 text-emerald-400" />
        </div>
        <div className="z-10">
          <p className="text-[10px] font-black uppercase text-emerald-400/60 tracking-widest mb-0.5">Total Épargné Réel</p>
          <div className="flex items-baseline gap-2">
             <p className="text-2xl font-black text-emerald-400 tabular-nums">{(totalReal || 0).toLocaleString("fr-FR")} €</p>
             <span className="text-[10px] font-bold text-white/20 tracking-tighter italic">VS {totalCurrent.toLocaleString("fr-FR")}€ (Plan)</span>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl border border-white/10 flex items-center gap-5 shadow-inner bg-purple-500/[0.02]">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
           <CheckCircle2 className="w-7 h-7 text-purple-400" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-purple-400/60 tracking-widest mb-0.5">Complétés</p>
          <p className="text-2xl font-black text-white">{completedCount} / {totalCount}</p>
        </div>
      </div>
    </div>
  )
}
