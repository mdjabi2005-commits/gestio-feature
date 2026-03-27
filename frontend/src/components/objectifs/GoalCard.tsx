"use client"
import { Target, TrendingUp, Calendar, MoreVertical, Pencil, Trash2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { getGoalCategoryMetadata } from "@/lib/goal-categories"
import type { Objectif } from "@/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface GoalCardProps {
  goal: Objectif
  onDelete: (id: number) => void
  onEdit: (goal: Objectif) => void
}

export function GoalCard({ goal, onDelete, onEdit }: GoalCardProps) {
  const montantActuel = goal.montant_actuel || 0
  const progress = goal.progression_pourcentage || 0
  const isReached = progress >= 100

  const catMeta = getGoalCategoryMetadata(goal.categorie)

  const daysRemaining = goal.date_echeance 
    ? Math.ceil((new Date(goal.date_echeance).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="group relative p-6 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all overflow-hidden flex flex-col justify-between h-[280px]">
      {/* Background Decorative Element */}
      <div 
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-[0.03] blur-2xl pointer-events-none transition-all duration-500 group-hover:opacity-[0.06]" 
        style={{ backgroundColor: catMeta.color }}
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
              <h3 className="text-base font-bold text-white truncate pr-2">{goal.nom}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: catMeta.color }}>
                {goal.categorie}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/10 transition-all">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEdit(goal)}>
                <Pencil className="w-4 h-4 mr-2" /> Modifier
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-rose-400 focus:text-rose-400 focus:bg-rose-500/10" 
                onClick={() => goal.id && onDelete(goal.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-tighter">Progression</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white">{montantActuel.toLocaleString("fr-FR")}€</span>
                <span className="text-xs font-medium text-white/30">/ {goal.montant_cible.toLocaleString("fr-FR")}€</span>
              </div>
            </div>
            <div className="text-right">
              <span className={cn("text-lg font-black", isReached ? "text-emerald-400" : "text-white/80")}>
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          <div className="h-2.5 bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.03]">
            <div 
              className={cn(
                "h-full transition-all duration-1000 ease-out",
                isReached ? "bg-gradient-to-r from-emerald-600 to-emerald-400" : "bg-gradient-to-r from-indigo-600 to-indigo-400"
              )}
              style={{ 
                width: `${Math.min(progress, 100)}%`,
                boxShadow: isReached ? "0 0 15px rgba(16,185,129,0.3)" : "0 0 15px rgba(99,102,241,0.2)" 
              }}
            />
          </div>

          {/* Metrics labels */}
          <div className="flex items-center justify-between pt-1">
             <div className="flex items-center gap-1.5 overflow-hidden">
                <TrendingUp className="w-3 h-3 text-emerald-400 opacity-50 shrink-0" />
                <span className="text-[10px] font-bold text-white/40 whitespace-nowrap">
                   {goal.montant_mensuel ? `+${goal.montant_mensuel.toLocaleString("fr-FR")}€/mois` : "Pas d'épargne récente"}
                </span>
             </div>
             {goal.projection_date && !isReached && (
                <div className="flex items-center gap-1.5 overflow-hidden text-right">
                   <Clock className="w-3 h-3 text-indigo-400 opacity-50 shrink-0" />
                   <span className="text-[10px] font-bold text-white/40 whitespace-nowrap">
                      Prévu : {new Date(goal.projection_date).toLocaleDateString("fr-FR", { month: 'short', year: 'numeric' })}
                   </span>
                </div>
             )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-white/[0.05]">
        <div className="flex items-center gap-2 text-white/40">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {goal.date_echeance 
              ? `Échéance : ${new Date(goal.date_echeance).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}` 
              : "Pas d'échéance"}
          </span>
        </div>
        {daysRemaining !== null && daysRemaining > 0 && !isReached && (
          <div className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.05]">
             <span className="text-[9px] font-bold text-white/60">J-{daysRemaining}</span>
          </div>
        )}
        {isReached && (
          <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
             <span className="text-[9px] font-black text-emerald-400 uppercase">Atteint</span>
          </div>
        )}
      </div>
    </div>
  )
}

