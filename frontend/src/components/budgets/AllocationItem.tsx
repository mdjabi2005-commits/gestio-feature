"use client"

import React, { useState } from 'react'
import { X, Percent, Euro, ChevronDown, ChevronUp } from 'lucide-react'
import { SalaryPlanItem } from '@/api'
import { CATEGORIES, CATEGORY_STYLES, getCategoryIcon } from '@/lib/categories'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'
import { SubAllocationSection } from './SubAllocationSection'

interface AllocationItemProps {
  item: SalaryPlanItem
  index: number
  referenceSalary: number
  onUpdate: (item: SalaryPlanItem) => void
  onRemove: () => void
}

export function AllocationItem({ item, index, referenceSalary, onUpdate, onRemove }: AllocationItemProps) {
  const [expanded, setExpanded] = useState(false)
  const categoryStyle = (CATEGORY_STYLES as any)[item.categorie] || { icone: 'help-circle', couleur: '#666' }
  const IconComp = getCategoryIcon(item.categorie)
  
  const categoryAmount = item.type === 'fixed' ? item.montant : referenceSalary * (item.montant / 100)

  return (
    <div className={cn(
      "glass-card rounded-2xl border transition-all flex flex-col overflow-hidden",
      expanded ? "border-indigo-500/30 bg-indigo-500/[0.02]" : "border-white/5 hover:border-white/10"
    )}>
      <div className="p-4 flex items-center gap-4">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
          style={{ backgroundColor: `${categoryStyle.couleur}15`, color: categoryStyle.couleur }}
        >
          <IconComp className="w-5 h-5" />
        </div>
        
        <div className="flex-1 space-y-0.5 text-left">
          <select 
            value={item.categorie}
            onChange={e => onUpdate({ ...item, categorie: e.target.value, sub_allocations: undefined })}
            className="bg-transparent border-none text-sm font-bold text-white focus:ring-0 p-0 cursor-pointer w-full"
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value} className="bg-[#121216]">{c.label}</option>)}
          </select>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[8px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {item.sub_distribution_mode === 'manual' ? "Ventilation Manuelle" : "Ventilation Équitable"}
          </button>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-2 py-1 focus-within:border-indigo-500/50 transition-all">
            <input 
              type="number" 
              value={item.montant}
              onChange={e => onUpdate({ ...item, montant: parseFloat(e.target.value) || 0 })}
              className="bg-transparent border-none text-sm font-black text-indigo-400 focus:ring-0 p-0 w-12 text-right tabular-nums"
            />
            <button 
              onClick={() => onUpdate({ ...item, type: item.type === 'percent' ? 'fixed' : 'percent' })}
              className="p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              {item.type === 'percent' ? <Percent className="w-3 h-3 text-indigo-400" /> : <Euro className="w-3 h-3 text-indigo-400" />}
            </button>
          </div>
          <span className="text-[10px] font-bold text-white/20 tabular-nums">
            {item.type === 'percent' ? `${Math.round(categoryAmount)} €` : `${Math.round((item.montant / referenceSalary) * 100)} %`}
          </span>
        </div>

        <button onClick={onRemove} className="p-2 rounded-xl hover:bg-rose-500/10 text-white/10 hover:text-rose-500 transition-all ml-2">
          <X className="w-4 h-4" />
        </button>
      </div>

      {item.type === 'percent' && (
        <div className="px-4 pb-4">
          <input 
            type="range" min="0" max="100" step="1" value={item.montant}
            onChange={e => onUpdate({ ...item, montant: parseFloat(e.target.value) })}
            className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      )}

      {expanded && (
        <SubAllocationSection 
          categoryName={item.categorie}
          subAllocations={item.sub_allocations || []}
          mode={item.sub_distribution_mode || 'equal'}
          color={categoryStyle.couleur}
          totalEnveloppe={categoryAmount}
          onUpdateSub={(sIdx, val) => {
            const newSubs = [...(item.sub_allocations || [])]
            newSubs[sIdx].value = val
            onUpdate({ ...item, sub_allocations: newSubs })
          }}
          onToggleMode={() => {
            const newMode = item.sub_distribution_mode === 'manual' ? 'equal' : 'manual'
            let newSubs = item.sub_allocations
            if (newMode === 'manual' && !newSubs) {
              const subcats = (CATEGORY_STYLES as any)[item.categorie]?.subcategories || []
              newSubs = subcats.map((s: string) => ({ name: s, value: 0 }))
            }
            onUpdate({ ...item, sub_distribution_mode: newMode, sub_allocations: newSubs })
          }}
        />
      )}
    </div>
  )
}
