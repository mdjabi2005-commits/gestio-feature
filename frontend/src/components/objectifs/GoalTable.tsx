"use client"
import React from "react"
import { MoreHorizontal, Pencil, Trash2, Calendar, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { getGoalCategoryMetadata } from "@/lib/goal-categories"
import type { Objectif } from "@/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

interface GoalTableProps {
  goals: (Objectif & Partial<GoalMetrics>)[]
  onDelete: (id: number) => void
  onEdit: (goal: Objectif) => void
  onSelect: (goal: Objectif) => void
}

export function GoalTable({ goals, onDelete, onEdit, onSelect }: GoalTableProps) {
  return (
    <div className="w-full glass-card rounded-3xl border border-white/10 overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Objectif</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Statut</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Cible</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Réel / Théorique</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Progression Réelle</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {goals.map((goal) => {
              const catMeta = getGoalCategoryMetadata(goal.categorie)
              const montantActuel = goal.montant_actuel_reel ?? 0
              const montantTh = goal.montant_actuel_temporel ?? 0
              const progress = goal.progress_pct_reel ?? 0
              const progressTh = goal.progress_pct ?? 0
              const isReached = progress >= 100
              const isAhead = (goal.is_ahead ?? false)

              return (
                <tr 
                  key={goal.id} 
                  className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => onSelect(goal)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 shadow-inner text-xl" 
                        style={{ backgroundColor: `${catMeta.color}15` }}
                      >
                        {catMeta.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors uppercase tracking-tight">{goal.nom}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-40" style={{ color: catMeta.color }}>{goal.categorie}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isAhead ? (
                       <div className="flex items-center gap-1.5 text-emerald-400">
                          <TrendingUp className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase">Avance</span>
                       </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-rose-400">
                             <TrendingDown className="w-3 h-3" />
                             <span className="text-[9px] font-black uppercase">Retard</span>
                          </div>
                          {typeof goal.delay_months === 'number' && goal.delay_months > 0 && (
                            <span className="text-[8px] font-bold text-rose-500/40 uppercase tracking-widest pl-4">
                              +{goal.delay_months} mois
                            </span>
                          )}
                        </div>
                      )}
                  </td>
                  <td className="px-6 py-4 tabular-nums text-sm font-bold text-white/60">
                    {goal.montant_cible?.toLocaleString("fr-FR")} €
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-col">
                        <span className="text-xs font-black text-emerald-400 tabular-nums">{montantActuel.toLocaleString("fr-FR")}€</span>
                        <span className={cn(
                           "text-[10px] font-black tabular-nums",
                           isAhead ? "text-emerald-500/40" : "text-rose-500/60"
                        )}>
                           {isAhead ? "En avance de " : "Manque "} 
                           {Math.abs(goal.montant_retard ?? 0).toLocaleString("fr-FR")}€ 
                        </span>
                     </div>
                  </td>
                  <td className="px-6 py-4 min-w-[150px]">
                    <div className="flex flex-col gap-1.5">
                       <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden p-0.5 border border-white/5">
                            <div 
                              className={cn("h-full transition-all duration-700 rounded-full", isReached ? "bg-emerald-500" : "bg-emerald-400")} 
                              style={{ width: `${Math.min(progress, 100)}%` }} 
                            />
                          </div>
                          <span className={cn("text-[10px] font-black tabular-nums min-w-[30px] text-right", isReached ? "text-emerald-400" : "text-emerald-400/60")}>
                            {Math.round(progress)}%
                          </span>
                       </div>
                       <div className="h-0.5 w-[80%] bg-indigo-500/20 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-indigo-500/40"
                             style={{ width: `${Math.min(progressTh, 100)}%` }}
                           />
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 shadow-2xl bg-slate-950/90 border-white/10 backdrop-blur-md">
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
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
