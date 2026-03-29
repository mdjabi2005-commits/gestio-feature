"use client"

import React, { useMemo } from 'react'
import { Calendar, Sliders, X, Trash2, Edit2, Target } from 'lucide-react'
import { Objectif } from '@/api'
import { getGoalCategoryMetadata } from '@/lib/goal-categories'
import { cn } from '@/lib/utils'
import * as Slider from "@radix-ui/react-slider"

interface GoalPlanningRowProps {
  goal: Objectif
  allocationPct: number
  onPctChange: (val: number) => void
  onRemove?: () => void
  totalMonthlySavings: number
  isNew?: boolean
  onUpdateMetadata?: (updates: Partial<Objectif>) => void
}

export function GoalPlanningRow({
  goal,
  allocationPct,
  onPctChange,
  onRemove,
  totalMonthlySavings,
  isNew = false,
  onUpdateMetadata
}: GoalPlanningRowProps) {
  const catMeta = getGoalCategoryMetadata(goal.categorie)
  
  // 1. Calcul direct de l'allocation mensuelle
  const monthlyAllocation = totalMonthlySavings * (allocationPct / 100)

  // 2. Calcul de la durée en mois pour les nouveaux objectifs
  const monthsRemaining = useMemo(() => {
    if (!goal.date_echeance) return 0
    const end = new Date(goal.date_echeance)
    const now = new Date()
    const diff = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth())
    return Math.max(0, diff)
  }, [goal.date_echeance])

  // 3. Calcul de la cible pour les nouveaux objectifs
  const calculatedTarget = monthlyAllocation * monthsRemaining

  return (
    <div className={cn(
      "glass-card rounded-[32px] border transition-all flex flex-col overflow-hidden p-6 shadow-xl",
      isNew ? "border-emerald-500/30 bg-emerald-500/[0.02]" : "border-white/5 hover:border-white/10"
    )}>
      <div className="flex items-center gap-4 mb-6">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-xl"
          style={{ backgroundColor: `${catMeta.color}15` }}
        >
          {catMeta.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          {isNew ? (
            <input 
              type="text"
              value={goal.nom}
              onChange={e => onUpdateMetadata?.({ nom: e.target.value })}
              placeholder="Nom de l'objectif..."
              className="bg-transparent border-none text-base font-black text-white p-0 focus:ring-0 w-full placeholder:text-white/10 uppercase tracking-tighter"
            />
          ) : (
            <h4 className="text-base font-black text-white uppercase tracking-tighter truncate">{goal.nom}</h4>
          )}
          
          <div className="flex items-center gap-2 mt-0.5">
             <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: catMeta.color }}>{goal.categorie}</span>
             {isNew && (
                <div className="flex items-center gap-2 ml-4">
                   <Calendar className="w-3 h-3 text-white/20" />
                   <input 
                     type="month"
                     value={goal.date_echeance?.substring(0, 7)}
                     onChange={e => onUpdateMetadata?.({ date_echeance: `${e.target.value}-01` })}
                     className="bg-transparent border-none text-[10px] font-bold text-indigo-400 p-0 focus:ring-0 cursor-pointer uppercase"
                   />
                </div>
             )}
          </div>
        </div>

        <div className="text-right flex flex-col gap-0.5">
          <p className="text-lg font-black text-white tabular-nums">+{Math.round(monthlyAllocation).toLocaleString("fr-FR")}€<span className="text-white/20 text-xs ml-1">/mois</span></p>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{allocationPct}% de l'épargne</p>
        </div>

        {onRemove && (
          <button onClick={onRemove} className="p-2.5 rounded-2xl hover:bg-rose-500/10 text-white/5 hover:text-rose-500 transition-all ml-2 group">
            <Trash2 className="w-5 h-5 opacity-40 group-hover:opacity-100" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-8">
        <Slider.Root
           className="relative flex items-center select-none touch-none grow h-5"
           value={[allocationPct]}
           max={100}
           step={1}
           onValueChange={([val]) => onPctChange(val)}
        >
           <Slider.Track className="bg-white/5 relative grow rounded-full h-2">
              <Slider.Range className="absolute bg-emerald-400/80 rounded-full h-full" />
           </Slider.Track>
           <Slider.Thumb 
              className="block w-6 h-6 bg-white shadow-xl rounded-full hover:scale-110 focus:outline-none transition-transform cursor-grab active:cursor-grabbing border-4 border-emerald-500" 
              aria-label="Allocation" 
           />
        </Slider.Root>
        <div className="min-w-[70px] h-11 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center">
           <span className="text-[8px] font-black text-white/20 uppercase leading-none mb-0.5">Allocation</span>
           <span className="text-sm font-black text-white">{allocationPct}%</span>
        </div>
      </div>

      {isNew && monthsRemaining > 0 && (
         <div className="mt-8 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-500/[0.03] border border-indigo-500/10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Target className="w-16 h-16 text-indigo-400" />
               </div>
               <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                     <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Planification Prédictive</p>
                     <p className="text-xs text-white/40 font-medium leading-relaxed">
                        D'ici <span className="text-white font-black">{monthsRemaining} mois</span>, vous aurez atteint : 
                     </p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-xl font-black text-indigo-400 tabular-nums">~ {Math.round(calculatedTarget).toLocaleString("fr-FR")} €</p>
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em] italic">Montant cible estimé</p>
               </div>
            </div>
         </div>
      )}
    </div>
  )
}
