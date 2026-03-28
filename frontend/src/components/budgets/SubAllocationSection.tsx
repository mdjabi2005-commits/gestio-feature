"use client"

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubAllocationSectionProps {
  categoryName: string
  subAllocations: { name: string; value: number }[]
  onUpdateSub: (idx: number, newVal: number) => void
  onToggleMode: () => void
  mode: 'manual' | 'equal'
  totalEnveloppe: number
  color: string
}

export function SubAllocationSection({ 
  categoryName, subAllocations, onUpdateSub, onToggleMode, mode, totalEnveloppe, color 
}: SubAllocationSectionProps) {
  return (
    <div className="px-4 pb-6 mt-4 space-y-4 border-t border-white/5 pt-4 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <h4 className="text-[9px] font-black uppercase text-white/40 tracking-widest">Ventilation interne</h4>
        <button 
          onClick={onToggleMode}
          className="text-[8px] font-bold text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20"
        >
          {mode === 'manual' ? "Passer en auto (Équitable)" : "Passer en Manuel"}
        </button>
      </div>

      {mode === 'manual' && subAllocations ? (
        <div className="space-y-4">
          {subAllocations.map((sub, sIdx) => (
            <div key={sIdx} className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs font-medium text-white/60">{sub.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tabular-nums text-indigo-400">
                    {Math.round(totalEnveloppe * (sub.value / 100))} €
                  </span>
                  <div className="flex items-center gap-1 bg-white/5 rounded px-1.5 py-0.5">
                    <input 
                      type="number"
                      value={sub.value}
                      onChange={e => onUpdateSub(sIdx, parseFloat(e.target.value) || 0)}
                      className="bg-transparent border-none text-[10px] font-bold text-white w-6 p-0 focus:ring-0 text-right tabular-nums"
                    />
                    <span className="text-[8px] text-white/20">%</span>
                  </div>
                </div>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={sub.value}
                onChange={e => onUpdateSub(sIdx, parseFloat(e.target.value))}
                className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>
          ))}
          <div className="pt-2 flex items-center justify-between text-[8px] font-bold uppercase tracking-widest">
            <span className="text-white/20">Total de l'enveloppe</span>
            <span className={cn(
              subAllocations.reduce((s, a) => s + a.value, 0) > 100 ? "text-rose-500" : "text-indigo-400"
            )}>
              {subAllocations.reduce((s, a) => s + a.value, 0)}% / 100%
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 italic">
          <AlertCircle className="w-4 h-4 text-white/20" />
          <p className="text-[10px] text-white/40">Le montant de cette catégorie sera réparti équitablement entre toutes ses sous-catégories.</p>
        </div>
      )}
    </div>
  )
}
