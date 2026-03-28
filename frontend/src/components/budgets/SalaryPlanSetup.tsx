"use client"

import React, { useState, useMemo } from 'react'
import { Plus, PiggyBank, Save, X, AlertCircle, Percent, Euro, TrendingDown, Search } from 'lucide-react'
import { SalaryPlan, SalaryPlanItem } from '@/api'
import { CATEGORIES } from '@/lib/categories'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PlanningHeader } from './PlanningHeader'
import { AllocationItem } from './AllocationItem'

interface SalaryPlanSetupProps {
  plan: SalaryPlan | null
  onSave: (plan: SalaryPlan) => Promise<void>
  onClose: () => void
}

export function SalaryPlanSetup({ plan, onSave, onClose }: SalaryPlanSetupProps) {
  const [editingPlan, setEditingPlan] = useState<SalaryPlan>(plan || {
    nom: "Mon Plan de Revenu",
    is_active: true,
    reference_salary: 2000,
    items: [],
    default_remainder_category: "Épargne"
  })
  const [searchQuery, setSearchQuery] = useState('')

  const handleUpdatePlan = (updates: Partial<SalaryPlan>) => {
    setEditingPlan(prev => ({ ...prev, ...updates }))
  }

  const handleSave = async () => {
    const filteredItems = editingPlan.items.filter(item => item.montant > 0);
    const planToSave = { ...editingPlan, items: filteredItems };
    try {
      await onSave(planToSave)
      toast.success("Plan d'allocation appliqué ! ✨")
      onClose()
    } catch (e) {
      toast.error("Erreur lors de la sauvegarde")
    }
  }

  const totalAllocated = useMemo(() => {
    return editingPlan.items.reduce((acc, item) => {
      if (item.type === 'fixed') return acc + item.montant
      return acc + (editingPlan.reference_salary * (item.montant / 100))
    }, 0)
  }, [editingPlan.items, editingPlan.reference_salary])

  const remainder = editingPlan.reference_salary - totalAllocated

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl h-full bg-[#0a0a0c] border-l border-white/10 p-8 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        <PlanningHeader 
          referenceSalary={editingPlan.reference_salary} 
          onUpdateSalary={val => handleUpdatePlan({ reference_salary: val })}
          onClose={onClose}
          remainder={remainder}
        />

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-hide mt-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Configuration des Enveloppes</h3>
              <div className="relative w-40">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
                <input 
                  type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filtrer..."
                  className="w-full bg-white/5 border border-white/5 rounded-lg text-[10px] pl-7 py-1 focus:outline-none focus:border-indigo-500/30"
                />
              </div>
            </div>

            <div className="space-y-3">
              {editingPlan.items
                .filter(item => item.categorie.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((item, idx) => (
                  <AllocationItem 
                    key={idx} item={item} index={idx} referenceSalary={editingPlan.reference_salary}
                    onUpdate={newItem => {
                      const newItems = [...editingPlan.items]; newItems[idx] = newItem; 
                      handleUpdatePlan({ items: newItems });
                    }}
                    onRemove={() => handleUpdatePlan({ items: editingPlan.items.filter((_, i) => i !== idx) })}
                  />
                ))}

              <button 
                onClick={() => handleUpdatePlan({ items: [...editingPlan.items, { categorie: "Alimentation", montant: 0, type: 'percent', sub_distribution_mode: 'equal' }] })}
                className="w-full py-5 rounded-3xl border border-dashed border-white/5 text-white/20 text-xs font-black uppercase tracking-widest hover:bg-white/[0.02] hover:border-white/10 transition-all flex items-center justify-center gap-3"
              >
                <Plus className="w-5 h-5" /> Ajouter une Enveloppe
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col gap-4">
          <div className="flex items-center gap-4 p-5 rounded-3xl bg-indigo-500/[0.03] border border-indigo-500/10 group">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingDown className="w-5 h-5 text-indigo-400 rotate-180" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase text-indigo-400/80 tracking-widest">Confirmation du Plan</p>
              <p className="text-[8px] text-white/30 leading-normal max-w-[300px]">
                En sauvegardant, le système créera des budgets détaillés basés sur vos curseurs. Seuls les montants &gt; 0€ seront activés.
              </p>
            </div>
            <Button onClick={handleSave} className="h-12 px-8 bg-indigo-500 hover:bg-indigo-600 font-black uppercase tracking-widest rounded-2xl text-xs transition-all shadow-xl shadow-indigo-500/20">
              <Save className="w-4 h-4 mr-2" /> Appliquer
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
