"use client"

import React from 'react'
import { PiggyBank, X, Euro } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlanningHeaderProps {
  referenceSalary: number
  onUpdateSalary: (val: number) => void
  onClose: () => void
  remainder: number
}

export function PlanningHeader({ referenceSalary, onUpdateSalary, onClose, remainder }: PlanningHeaderProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <PiggyBank className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Répartition du salaire</h2>
            <p className="text-xs text-white/40 font-medium">Répartissez votre salaire entre vos catégories de vie.</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-white/40 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Revenu Global</span>
          <div className="flex items-center gap-2">
            <input 
              type="number"
              value={referenceSalary}
              onChange={e => onUpdateSalary(parseFloat(e.target.value) || 0)}
              className="bg-transparent border-none text-2xl font-black text-white p-0 focus:ring-0 w-32 tabular-nums"
            />
            <span className="text-xl font-bold text-white/20">€</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10 flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/40">Épargne Potentielle</span>
          <div className="flex items-center gap-2">
            <span className={cn("text-2xl font-black tabular-nums", remainder < 0 ? "text-rose-500" : "text-emerald-400")}>
              {remainder.toLocaleString("fr-FR")}
            </span>
            <span className="text-xl font-bold text-emerald-400/20">€</span>
          </div>
        </div>
      </div>
    </div>
  )
}
