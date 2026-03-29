"use client"
import React from "react"
import { Target, TrendingUp, Calendar, MoreVertical, Pencil, Trash2, Clock, CheckCircle2, AlertCircle, Hourglass } from "lucide-react"
import { cn } from "@/lib/utils"
import { getGoalCategoryMetadata } from "@/lib/goal-categories"
import { api, type Objectif } from "@/api"
import { GoalDropZone } from "./GoalDropZone"
import { useGoalCalculations, type GoalMetrics } from "@/hooks/useGoalCalculations"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface GoalCardProps {
  goal: GoalMetrics
  onDelete: (id: number) => void
  onEdit: (goal: Objectif) => void
  onClick?: () => void
}

export function GoalCard({ goal, onDelete, onEdit, onClick }: GoalCardProps) {
  const montantActuelTh = goal.montant_actuel_temporel ?? 0
  const montantActuelReel = goal.montant_actuel_reel ?? 0
  const montantMensuelTh = goal.montant_mensuel_calc ?? 0
  const montantMensuelReel = goal.montant_mensuel_reel ?? 0
  const progressTh = goal.progress_pct ?? 0
  const progressReel = goal.progress_pct_reel ?? 0
  
  const isReached = progressReel >= 100
  const isAhead = goal.is_ahead ?? false
  const impactStatus = goal.impact_status ?? 'neutral'
  const delayMonths = goal.delay_months ?? 0

  const catMeta = getGoalCategoryMetadata(goal.categorie)

  const daysRemaining = goal.projection_date_reel
    ? Math.ceil((new Date(goal.projection_date_reel).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative p-6 rounded-[40px] bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-indigo-500/20 transition-all cursor-pointer overflow-hidden flex flex-col justify-between h-[440px]",
        impactStatus === 'delayed' && "border-rose-500/10 hover:border-rose-500/30",
        impactStatus === 'ahead' && "border-emerald-500/10 hover:border-emerald-500/30"
      )}
    >
      {/* Background Decorative Element */}
      <div 
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-[0.03] blur-2xl pointer-events-none transition-all duration-500 group-hover:opacity-[0.06]" 
        style={{ backgroundColor: impactStatus === 'delayed' ? '#fb7185' : impactStatus === 'ahead' ? '#34d399' : catMeta.color }}
      />

      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border border-white/5 text-2xl" 
              style={{ backgroundColor: `${catMeta.color}15` }}
            >
              {catMeta.icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white truncate pr-2 tracking-tight">{goal.nom}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: catMeta.color }}>
                {goal.categorie}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
             {/* Impact Badge */}
             {!isReached && impactStatus !== 'neutral' && (
                <div className={cn(
                   "px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-tighter flex items-center gap-1.5",
                   impactStatus === 'delayed' ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                )}>
                   {impactStatus === 'delayed' ? <TrendingUp className="w-3 h-3 rotate-180" /> : <TrendingUp className="w-3 h-3" />}
                   {impactStatus === 'delayed' ? `+${delayMonths}` : delayMonths} MOIS
                </div>
             )}
             
             <DropdownMenu>
               <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                 <button className="p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/10 transition-all">
                   <MoreVertical className="w-4 h-4" />
                 </button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-40 border-white/10 bg-slate-950/90 backdrop-blur-md">
                 <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(goal); }}>
                   <Pencil className="w-4 h-4 mr-2" /> Modifier
                 </DropdownMenuItem>
                 <DropdownMenuItem 
                   className="text-rose-400 focus:text-rose-400 focus:bg-rose-500/10" 
                   onClick={(e) => { e.stopPropagation(); goal.id && onDelete(goal.id); }}
                 >
                   <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </div>

        <div className="space-y-5">
          {/* Theoretical Progress (Plan) */}
          <div className="space-y-1.5 text-indigo-400/80">
            <div className="flex justify-between items-end">
               <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Objectif (Plan de Salaire)</span>
               <span className="text-xs font-black tabular-nums">{Math.round(progressTh)}%</span>
            </div>
            <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
               <div 
                 className="h-full bg-indigo-500 transition-all duration-1000 ease-out opacity-30"
                 style={{ width: `${Math.min(progressTh, 100)}%` }}
               />
            </div>
            {(montantMensuelTh > 0 || montantMensuelReel > 0) && (
              <div className="flex justify-between text-[9px] pt-0.5">
                <span className="text-indigo-400/50">
                  {montantMensuelTh > 0 ? `Objectif: ${Math.round(montantMensuelTh).toLocaleString("fr-FR")}€/mois` : 'Objectif: -'}
                </span>
                <span className="text-emerald-400/70">
                  {montantMensuelReel > 0 ? `Réel: ${Math.round(montantMensuelReel).toLocaleString("fr-FR")}€/mois` : 'Réel: -'}
                </span>
              </div>
            )}
          </div>

          {/* Real Progress (Reality) */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Progression Réelle</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-white">{montantActuelReel.toLocaleString("fr-FR")}€</span>
                  <span className="text-xs font-medium text-white/30">/ {goal.montant_cible?.toLocaleString("fr-FR")}€</span>
                </div>
              </div>
              <div className="text-right">
                <span className={cn("text-lg font-black italic", isReached ? "text-emerald-400" : "text-emerald-400/80")}>
                  {Math.round(progressReel)}%
                </span>
              </div>
            </div>

            <div className="h-3 bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.03] p-0.5 relative group/bar">
              <div 
                className={cn(
                  "h-full transition-all duration-1000 ease-out rounded-full relative z-10",
                  isReached ? "bg-emerald-500" : "bg-emerald-400"
                )}
                style={{ 
                  width: `${Math.min(progressReel, 100)}%`,
                  boxShadow: isReached ? "0 0 15px rgba(16,185,129,0.3)" : "0 0 10px rgba(16,185,129,0.2)" 
                }}
              />
              {/* Theoretical Shadow on Real Bar */}
              <div 
                className="absolute top-0 bottom-0 left-0 bg-indigo-500/10 border-r border-indigo-500/40 z-0 transition-all duration-1000"
                style={{ width: `${Math.min(progressTh, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
             <div className="flex flex-col gap-1.5 overflow-hidden">
                {isAhead ? (
                   <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                         En Avance {delayMonths < 0 && `(${Math.abs(delayMonths)}m)`}
                      </span>
                   </div>
                ) : (
                   <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-2xl border border-rose-500/20 w-fit shadow-lg shadow-rose-500/5">
                         <AlertCircle className="w-4 h-4" />
                         <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                            Objectif Décalé {delayMonths > 0 && `(+${delayMonths} mois)`}
                         </span>
                      </div>
                      <div className="flex items-center gap-2 pl-1">
                         <p className="text-xs font-black text-rose-400 italic">
                            Retard : {(montantActuelTh - montantActuelReel).toLocaleString("fr-FR")}€
                         </p>
                      </div>
                   </div>
                )}
             </div>
             {(goal.projection_date_reel || goal.projection_date) && !isReached && (
                <div className="flex flex-col items-end gap-0.5">
                   <div className="flex items-center gap-1.5 overflow-hidden text-right">
                      <Clock className="w-3 h-3 text-white/20 shrink-0" />
                      <span className="text-[10px] font-bold text-white/40 whitespace-nowrap italic">
                         Estimation : {new Date(goal.projection_date_reel || goal.projection_date!).toLocaleDateString("fr-FR", { month: 'short', year: 'numeric' })}
                      </span>
                   </div>
                   <p className="text-[9px] font-black text-white/10 uppercase tracking-widest">Projection Réelle</p>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Goal Attachments Zone */}
      <div className="py-2" onClick={(e) => e.stopPropagation()}>
        {goal.id && <GoalDropZone goalId={goal.id} />}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
        <div className="flex items-center gap-2 text-white/40">
          <Hourglass className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {goal.date_echeance 
              ? `Cible : ${new Date(goal.date_echeance).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}` 
              : "Sans échéance"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {daysRemaining !== null && daysRemaining > 0 && !isReached && (
            <div className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.05]">
               <span className="text-[9px] font-bold text-white/60">J-{daysRemaining}</span>
            </div>
          )}
          {isReached && (
            <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
               <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
