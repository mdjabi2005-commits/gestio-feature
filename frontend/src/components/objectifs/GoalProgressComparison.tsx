"use client"

import React from "react"
import { ArrowRightCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { GoalMetricLabel } from "./GoalMetricLabel"

interface GoalProgressComparisonProps {
  progressReel: number
  progressTh: number
  dateEcheance: string | undefined
  projectionDateCalc: string | null
  projectionDateReel: string | null
}

export function GoalProgressComparison({ 
  progressReel, 
  progressTh, 
  dateEcheance, 
  projectionDateCalc, 
  projectionDateReel 
}: GoalProgressComparisonProps) {
  return (
    <div className="space-y-8">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
         <ArrowRightCircle className="w-3.5 h-3.5 text-indigo-400" /> Comparaison des Échéances
      </h3>

      <div className="space-y-6">
         {/* Real Progress Bar */}
         <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
               <span className="text-emerald-400 font-black">Épargne Réelle (Rythme actuel)</span>
               <span className="text-white italic">{Math.round(progressReel)}%</span>
            </div>
            <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
               <div 
                 className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                 style={{ width: `${Math.min(progressReel, 100)}%` }}
               />
            </div>
         </div>

         {/* Theoretical Progress Bar */}
         <div className="space-y-2 opacity-50">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-indigo-400">
               <span>Objectif Théorique (Plan de Salaire)</span>
               <span className="italic">{Math.round(progressTh)}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden p-0.5">
               <div 
                 className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                 style={{ width: `${Math.min(progressTh, 100)}%` }}
               />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
         <GoalMetricLabel 
            label="Cible Initiale" 
            value={dateEcheance ? new Date(dateEcheance).toLocaleDateString("fr-FR", { month: 'short', year: 'numeric' }) : "-"} 
         />
         <GoalMetricLabel 
            label="Projeté Plan" 
            value={projectionDateCalc ? new Date(projectionDateCalc).toLocaleDateString("fr-FR", { month: 'short', year: 'numeric' }) : "-"} 
            highlight
         />
         <GoalMetricLabel 
            label="Projeté Réel" 
            value={projectionDateReel ? new Date(projectionDateReel).toLocaleDateString("fr-FR", { month: 'short', year: 'numeric' }) : "-"} 
            highlight
            sub="Basé sur vos dépenses"
         />
      </div>
    </div>
  )
}
