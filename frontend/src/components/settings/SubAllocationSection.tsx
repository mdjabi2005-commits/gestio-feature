"use client"
import React from 'react'
import { Trash2, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SalaryPlanItem } from '@/api'

interface SubAllocationSectionProps {
  item: SalaryPlanItem;
  referenceSalary: number;
  subcategories: string[];
  onUpdate: (updates: Partial<SalaryPlanItem>) => void;
}

export function SubAllocationSection({ item, referenceSalary, subcategories, onUpdate }: SubAllocationSectionProps) {
  const currentAllocs = item.sub_allocations || [];
  
  const handleSliderChange = (subName: string, newVal: number) => {
    if (currentAllocs.length < 2) {
      onUpdate({ sub_allocations: currentAllocs.map(s => s.name === subName ? { ...s, value: newVal } : s) });
      return;
    }

    const subAlloc = currentAllocs.find(s => s.name === subName);
    if (!subAlloc) return;

    let updated;
    if (currentAllocs.length === 2) {
      updated = currentAllocs.map(s => 
        s.name === subName ? { ...s, value: newVal } : { ...s, value: Math.max(0, 100 - newVal) }
      );
    } else {
      const others = currentAllocs.filter(s => s.name !== subName);
      const othersSum = others.reduce((acc, s) => acc + s.value, 0);
      
      if (othersSum > 0) {
        const scale = (100 - newVal) / othersSum;
        updated = currentAllocs.map(s => 
          s.name === subName ? { ...s, value: newVal } : { ...s, value: Math.max(0, s.value * scale) }
        );
      } else {
        const remaining = (100 - newVal) / others.length;
        updated = currentAllocs.map(s => 
          s.name === subName ? { ...s, value: newVal } : { ...s, value: remaining }
        );
      }
    }
    
    // Rounding correction
    const finalSum = updated.reduce((acc, s) => acc + s.value, 0);
    if (Math.abs(100 - finalSum) > 0.01) {
      const error = 100 - finalSum;
      const lastIdx = updated.findIndex(s => s.name !== subName);
      if (lastIdx !== -1) updated[lastIdx].value += error;
    }

    onUpdate({ sub_allocations: updated });
  };

  const totalSegmentsPercent = currentAllocs.reduce((acc, s) => acc + s.value, 0);

  return (
    <div className="ml-4 pl-4 border-l border-white/10 space-y-4 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider">Planification des segments</p>
          <p className="text-[9px] text-white/10 italic">Choisissez les sous-catégories à budgétiser</p>
        </div>
        
        {currentAllocs.length > 0 && (
          <div className={cn(
            "px-2 py-1 rounded text-[10px] font-bold transition-all border",
            Math.abs(totalSegmentsPercent - 100) < 0.1
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse"
          )}>
            Total segments: {totalSegmentsPercent.toFixed(0)}%
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {currentAllocs.length > 0 ? (
          currentAllocs.map(subAlloc => {
            const categoryTotal = (referenceSalary || 0) * (item.montant / 100);
            const subAmount = categoryTotal * (subAlloc.value / 100);

            return (
              <div key={subAlloc.name} className="space-y-2 group/sub">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                     <span className="text-[11px] font-medium text-white/70">{subAlloc.name}</span>
                     <span className="text-[10px] text-blue-400 font-bold font-mono">
                       {subAlloc.value.toFixed(0)}%
                     </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30 font-mono">
                      (= {subAmount.toFixed(0)}€)
                    </span>
                    <button 
                      onClick={() => onUpdate({ sub_allocations: currentAllocs.filter(s => s.name !== subAlloc.name) })}
                      className="p-1 rounded text-white/5 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover/sub:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div className="relative h-4 flex items-center">
                  <input 
                    type="range" min="0" max="100" step="1"
                    value={subAlloc.value}
                    onChange={(e) => handleSliderChange(subAlloc.name, parseInt(e.target.value))}
                    className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                    style={{
                      background: `linear-gradient(to right, #6366f1 ${subAlloc.value}%, rgba(255, 255, 255, 0.05) ${subAlloc.value}%)`
                    }}
                  />
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-2 px-3 rounded-lg border border-dashed border-white/5 bg-white/[0.01] text-center">
            <p className="text-[10px] text-white/20 italic pr-1">Aucun segment défini. Le montant total restera au niveau de la catégorie.</p>
          </div>
        )}
        
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
          {subcategories
            .filter(sub => !currentAllocs.some(s => s.name === sub))
            .map(sub => (
              <button 
                key={sub}
                onClick={() => onUpdate({ sub_allocations: [...currentAllocs, { name: sub, value: currentAllocs.length === 0 ? 100 : 0 }] })}
                className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-white/40 hover:bg-white/10 hover:text-white/70 hover:border-white/20 transition-all flex items-center gap-1 group/btn"
              >
                <span>{sub}</span>
                <LayoutGrid className="w-2.5 h-2.5 opacity-40 group-hover/btn:opacity-100" />
              </button>
            ))
          }
          {currentAllocs.length > 0 && (
            <button 
              onClick={() => onUpdate({ sub_allocations: [] })}
              className="px-2 py-1 rounded-full bg-rose-500/5 border border-rose-500/10 text-[9px] font-bold text-rose-400/60 hover:bg-rose-500/10 hover:text-rose-400 transition-all ml-auto"
            >
              Tout vider
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
