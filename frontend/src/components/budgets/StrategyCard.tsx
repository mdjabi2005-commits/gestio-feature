"use client"

import React from "react"
import { TrendingUp, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface StrategyCardProps {
  deficit: number
  hourlyRate?: number
  className?: string
}

export function StrategyCard({ deficit, hourlyRate = 20, className }: StrategyCardProps) {
  if (deficit <= 0) return null

  const hoursNeeded = Math.ceil(deficit / hourlyRate)

  return (
    <div className={cn("relative overflow-hidden group p-6 rounded-3xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-md", className)}>
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
        <TrendingUp className="w-24 h-24 text-rose-500" />
      </div>
      
      <div className="flex items-start gap-5 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20 animate-pulse">
          <AlertCircle className="w-6 h-6 text-rose-500" />
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-black text-rose-400 uppercase tracking-tighter">Plan de Rattrapage (Déficit)</h3>
            <p className="text-sm text-rose-400/60 leading-relaxed font-medium">
              Vos budgets actuels dépassent vos revenus de <span className="text-rose-400 font-bold">{Math.abs(deficit).toLocaleString("fr-FR")} €</span>.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <Clock className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-black text-rose-400 uppercase tracking-widest">{hoursNeeded} Heures Uber estimées</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] uppercase font-bold text-rose-400/60">Taux de base: {hourlyRate}€/h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
