"use client"
import React from 'react'
import { Trash2 } from 'lucide-react'
import { CATEGORIES } from '@/lib/categories'
import { SalaryPlanItem } from '@/api'
import { cn } from '@/lib/utils'
import { SubAllocationSection } from './SubAllocationSection'

interface SalaryPlanItemRowProps {
  item: SalaryPlanItem;
  index: number;
  referenceSalary: number;
  onUpdate: (updates: Partial<SalaryPlanItem>) => void;
  onRemove: () => void;
}

export function SalaryPlanItemRow({ item, index, referenceSalary, onUpdate, onRemove }: SalaryPlanItemRowProps) {
  const selectedCategory = CATEGORIES.find(c => c.value === item.categorie);
  
  return (
    <div className="space-y-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all group">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Category Selection */}
          <div className="flex-1">
            <select 
              value={item.categorie}
              onChange={(e) => onUpdate({ categorie: e.target.value, sub_allocations: [] })}
              className="w-full bg-white/5 border-white/10 rounded-lg text-sm text-white focus:ring-indigo-500/30 py-2 px-3"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value} className="bg-[#0f0f13]">{c.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Amount & Type Toggle */}
            <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-1 group/type group-focus-within:border-blue-500/30 transition-all">
              {item.type === 'fixed' ? (
                <input 
                  type="number" 
                  value={item.montant}
                  onChange={(e) => onUpdate({ montant: parseFloat(e.target.value) || 0 })}
                  className="bg-transparent border-none text-right text-sm text-white focus:ring-0 p-1 w-20 px-2 font-mono"
                  placeholder="0"
                />
              ) : (
                <div className="w-20 px-2 py-1 text-right text-sm font-bold text-blue-400 font-mono">
                  {item.montant}%
                </div>
              )}
              <button 
                onClick={() => onUpdate({ type: item.type === 'fixed' ? 'percent' : 'fixed' })}
                className={cn(
                  "px-2 py-1 rounded text-[10px] font-bold uppercase transition-all",
                  item.type === 'fixed' ? "bg-white/5 text-white/40 hover:text-white/60" : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                )}
              >
                {item.type === 'fixed' ? 'Fixe (€)' : '%'}
              </button>
            </div>

            {/* Remove Category Button */}
            <button 
              onClick={onRemove}
              className="p-2 rounded-lg text-white/10 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              title="Supprimer cette catégorie"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Percentage Slider */}
        {item.type === 'percent' && (
          <div className="px-1 space-y-2 animate-in slide-in-from-top-1 duration-300">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
              <span className="text-white/20">Intensité de l'allocation</span>
              <span className="text-blue-400/80 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/10">
                (= {((referenceSalary || 0) * (item.montant / 100)).toFixed(0)}€)
              </span>
            </div>
            <div className="relative h-6 flex items-center group/slider">
              <input 
                type="range" min="0" max="100" step="1"
                value={item.montant}
                onChange={(e) => onUpdate({ montant: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all shadow-inner"
                style={{
                  background: `linear-gradient(to right, #3b82f6 ${item.montant}%, rgba(255, 255, 255, 0.05) ${item.montant}%)`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Extracted Sub-allocation Section */}
      {selectedCategory && selectedCategory.subcategories.length > 0 && (
        <SubAllocationSection 
          item={item}
          referenceSalary={referenceSalary}
          subcategories={selectedCategory.subcategories}
          onUpdate={onUpdate}
        />
      )}
    </div>
  )
}
