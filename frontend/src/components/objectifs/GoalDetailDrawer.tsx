"use client"

import React, { useEffect, useState } from "react"
import { X, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { api, type Objectif, type Transaction, type Attachment } from "@/api"
import { GoalPredictiveAnalysis } from "./GoalPredictiveAnalysis"
import { GoalProgressComparison } from "./GoalProgressComparison"
import { GoalHistory } from "./GoalHistory"
import { GoalGallery } from "./GoalGallery"

interface GoalMetrics {
    montant_actuel_temporel: number
    montant_actuel_reel: number
    montant_mensuel_calc: number
    projection_date_calc: string | null
    projection_date_reel: string | null
    months_remaining: number
    months_remaining_reel: number
    progress_pct: number
    progress_pct_reel: number
    is_ahead: boolean
    delay_months: number | null
    impact_status: 'ahead' | 'on_time' | 'delayed' | 'neutral'
    montant_retard: number
}

interface GoalDetailDrawerProps {
  goal: (Objectif & Partial<GoalMetrics>) | null
  transactions: Transaction[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GoalDetailDrawer({ goal, transactions, open, onOpenChange }: GoalDetailDrawerProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (goal?.id && open) fetchAttachments()
  }, [goal?.id, open])

  const fetchAttachments = async () => {
    if (!goal?.id) return
    setLoading(true)
    try {
      const data = await api.getGoalAttachments(goal.id)
      setAttachments(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!goal) return null

  const progressTh = goal.progress_pct ?? 0
  const progressReel = goal.progress_pct_reel ?? 0
  const isReached = progressReel >= 100
  const impactStatus = goal.impact_status ?? 'neutral'
  const delayMonths = goal.delay_months ?? 0

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300",
      open ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      <div className="absolute inset-0" onClick={() => onOpenChange(false)} />
      
      <div className={cn(
        "relative w-full max-w-2xl h-full bg-[#0a0a0c] border-l border-white/10 p-0 shadow-2xl flex flex-col transition-transform duration-500 ease-out",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Target className="w-6 h-6 text-indigo-400" />
             </div>
             <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">{goal.nom}</h2>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{goal.categorie}</span>
                   {isReached && <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-[0.15em]">Complété</span>}
                </div>
             </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-3 rounded-2xl text-white/20 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
          <GoalPredictiveAnalysis 
            impactStatus={impactStatus} 
            delayMonths={delayMonths} 
            projectionDateReel={goal.projection_date_reel || null}
            montantRetard={goal.montant_retard ?? 0}
            monantMensuelCalc={goal.montant_mensuel_calc ?? 0}
          />

          <GoalProgressComparison 
            progressReel={progressReel}
            progressTh={progressTh}
            dateEcheance={goal.date_echeance}
            projectionDateCalc={goal.projection_date_calc || null}
            projectionDateReel={goal.projection_date_reel || null}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <GoalHistory transactions={transactions} />
            <GoalGallery goalId={goal.id!} attachments={attachments} loading={loading} onSuccess={fetchAttachments} />
          </div>
        </div>
      </div>
    </div>
  )
}
