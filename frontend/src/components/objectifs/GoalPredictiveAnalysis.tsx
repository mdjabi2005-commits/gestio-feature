"use client"

import React from "react"
import { TrendingUp, Hourglass, Target, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface GoalPredictiveAnalysisProps {
  impactStatus: 'ahead' | 'on_time' | 'delayed' | 'neutral'
  delayMonths: number
  projectionDateReel: string | null
  montantRetard: number
  monantMensuelCalc: number
}

export function GoalPredictiveAnalysis({ 
  impactStatus, 
  delayMonths, 
  projectionDateReel,
  montantRetard,
  monantMensuelCalc
}: GoalPredictiveAnalysisProps) {
  if (impactStatus === 'neutral' || !projectionDateReel) return null

  const isDelayed = impactStatus === 'delayed'
  const absDelayMonths = Math.abs(delayMonths)
  const absRetardEuro = Math.abs(montantRetard)

  return (
    <div className={cn(
      "p-6 rounded-[32px] border relative overflow-hidden flex flex-col gap-6",
      isDelayed ? "bg-rose-500/5 border-rose-500/10" : "bg-emerald-500/5 border-emerald-500/10"
    )}>
      {/* Header with main stats */}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
            isDelayed ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
          )}>
            <TrendingUp className={cn("w-6 h-6", isDelayed && "rotate-180")} />
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Impact sur l'Échéance</h3>
            <div className="flex items-baseline gap-2">
               <p className={cn("text-2xl font-black uppercase tracking-tighter italic", isDelayed ? "text-rose-400" : "text-emerald-400")}>
                 {isDelayed ? `+${absDelayMonths} mois` : `-${absDelayMonths} mois`}
               </p>
               <span className="text-xs font-bold text-white/20">({Math.round(absRetardEuro).toLocaleString("fr-FR")}€ de {isDelayed ? 'retard' : 'avance'})</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
           <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400/60 mb-1 text-balance">Cible Plan (Théorie)</p>
           <p className="text-lg font-black text-white italic">{Math.round(monantMensuelCalc).toLocaleString("fr-FR")}€<span className="text-[10px] opacity-20 ml-1">/mois</span></p>
        </div>
      </div>

      {/* Insight Text */}
      <div className={cn(
        "p-5 rounded-2xl border relative z-10",
        isDelayed ? "bg-rose-500/10 border-rose-500/10" : "bg-emerald-500/10 border-emerald-500/10"
      )}>
        <p className="text-sm font-bold text-white/80 leading-relaxed flex items-start gap-3">
          <AlertCircle className={cn("w-5 h-5 shrink-0 mt-0.5", isDelayed ? "text-rose-400" : "text-emerald-400")} />
          <span>
            {isDelayed 
              ? `Votre rythme réel est insuffisant. Selon votre historique de dépenses, l'objectif sera atteint en ${new Date(projectionDateReel).toLocaleDateString("fr-FR", { month: 'long', year: 'numeric' })}. Vous avez accumulé un retard financier de ${Math.round(absRetardEuro).toLocaleString("fr-FR")}€ par rapport à votre Plan de Salaire.`
              : `Excellente gestion ! Grâce à un surplus réel plus élevé que prévu, vous devriez boucler ce projet dès ${new Date(projectionDateReel).toLocaleDateString("fr-FR", { month: 'long', year: 'numeric' })}, battant votre propre calendrier de ${absDelayMonths} mois.`
            }
          </span>
        </p>
      </div>
      
      <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03]">
        <Hourglass className="w-32 h-32 text-white" />
      </div>
    </div>
  )
}
