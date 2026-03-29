"use client"

import React from "react"
import { Plus, Calendar, Target, Sparkles } from "lucide-react"
import { GOAL_CATEGORIES } from "@/lib/goal-categories"
import type { Objectif } from "@/api"
import { cn } from "@/lib/utils"

interface QuickAddGoalFormProps {
  newGoal: Partial<Objectif>
  setNewGoal: React.Dispatch<React.SetStateAction<Partial<Objectif>>>
  onAdd: () => void
}

export function QuickAddGoalForm({ newGoal, setNewGoal, onAdd }: QuickAddGoalFormProps) {
  const hasContent = newGoal.nom && newGoal.nom.trim().length > 0

  return (
     <div className={cn(
       "p-8 rounded-[40px] border transition-all duration-500 relative overflow-hidden group mt-10",
       hasContent 
         ? "bg-emerald-500/[0.03] border-emerald-500/20 shadow-2xl shadow-emerald-500/5 rotate-[0.5deg]" 
         : "bg-white/[0.01] border-white/5 border-dashed hover:border-white/10 hover:bg-white/[0.02]"
     )}>
        {/* Background Sparkle Effect */}
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-all duration-700">
           <Sparkles className={cn("w-12 h-12 text-emerald-400 transition-transform", hasContent && "animate-pulse")} />
        </div>

        <div className="flex items-center gap-6 relative z-10">
           <div className="relative">
              <select 
                 value={newGoal.categorie}
                 onChange={e => setNewGoal(prev => ({ ...prev, categorie: e.target.value }))}
                 className="bg-white/5 border border-white/5 text-2xl p-4 rounded-2xl focus:ring-1 ring-emerald-500/30 cursor-pointer appearance-none transition-all hover:bg-white/10"
              >
                 {GOAL_CATEGORIES.map(c => <option key={c.name} value={c.name} className="bg-slate-900">{c.icon}</option>)}
              </select>
           </div>

           <div className="flex-1 space-y-3">
              <input 
                 type="text"
                 value={newGoal.nom}
                 onChange={e => setNewGoal(prev => ({ ...prev, nom: e.target.value }))}
                 placeholder="Ajouter un nouveau rêve..."
                 className="bg-transparent border-none text-lg font-black text-white p-0 focus:ring-0 w-full placeholder:text-white/10 uppercase tracking-tighter"
              />
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-white/5 px-2 py-1.5 rounded-xl border border-white/5 transition-all hover:border-emerald-500/30">
                     <span className="text-[8px] text-white/20 font-bold uppercase">Du</span>
                     <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <input 
                        type="month"
                        value={newGoal.date_debut}
                        onChange={e => setNewGoal(prev => ({ ...prev, date_debut: e.target.value }))}
                        className="bg-transparent border-none text-[10px] font-black text-emerald-400 p-0 focus:ring-0 cursor-pointer uppercase tracking-widest w-16"
                      />
                  </div>
                  <div className="flex items-center gap-1 bg-white/5 px-2 py-1.5 rounded-xl border border-white/5 transition-all hover:border-indigo-500/30">
                     <span className="text-[8px] text-white/20 font-bold uppercase">Au</span>
                     <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <input 
                        type="month"
                        value={newGoal.date_fin}
                        onChange={e => setNewGoal(prev => ({ ...prev, date_fin: e.target.value }))}
                        className="bg-transparent border-none text-[10px] font-black text-indigo-400 p-0 focus:ring-0 cursor-pointer uppercase tracking-widest w-16"
                      />
                  </div>
               </div>
           </div>

           <button 
             onClick={onAdd}
             disabled={!newGoal.nom}
             className={cn(
               "flex flex-col items-center justify-center gap-1.5 px-6 py-4 rounded-3xl transition-all duration-500 shadow-xl",
               hasContent 
                 ? "bg-emerald-500 text-white hover:scale-105 active:scale-95 shadow-emerald-500/20" 
                 : "bg-white/5 text-white/20 grayscale opacity-50"
             )}
           >
              <Plus className={cn("w-6 h-6 transition-transform", hasContent && "rotate-90")} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Ajouter</span>
           </button>
        </div>
     </div>
  )
}
