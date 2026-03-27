"use client"
import React, { useState, useEffect } from 'react'
import { Plus, PiggyBank, Save, CheckCircle2, AlertCircle } from 'lucide-react'
import { api, SalaryPlan, SalaryPlanItem } from '@/api'
import { CATEGORIES } from '@/lib/categories'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { SalaryPlanItemRow } from './SalaryPlanItemRow'

export function SalaryPlanManager() {
  const [plans, setPlans] = useState<SalaryPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<SalaryPlan | null>(null)

  useEffect(() => { loadPlans() }, [])

  const loadPlans = async () => {
    try {
      const data = await api.getSalaryPlans()
      setPlans(data)
      if (data.length > 0 && !editingPlan) setEditingPlan(data.find(p => p.is_active) || data[0])
    } catch (e) { console.error("Failed to load plans", e) }
    finally { setLoading(false) }
  }

  const handleAddPlan = () => setEditingPlan({ nom: "Nouveau Plan", is_active: false, reference_salary: 2000, items: [], default_remainder_category: "Épargne" })

  const handleUpdatePlan = (updates: Partial<SalaryPlan>) => {
    if (!editingPlan) return
    setEditingPlan({ ...editingPlan, ...updates })
  }

  const handleSave = async () => {
    if (!editingPlan) return
    try {
      await api.saveSalaryPlan(editingPlan)
      toast.success("Plan d'allocation sauvegardé ! ✨")
      loadPlans()
    } catch (e) { toast.error("Erreur lors de la sauvegarde") }
  }

  if (loading) return <div className="animate-pulse space-y-4 pt-4"><div className="h-4 bg-white/10 rounded w-3/4"></div><div className="h-20 bg-white/5 rounded-xl"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"><PiggyBank className="w-6 h-6 text-emerald-400" /></div>
          <div><h2 className="text-lg font-bold text-white">Répartition du Salaire</h2><p className="text-xs text-white/40">Paramétrez la ventilation automatique de votre revenu.</p></div>
        </div>
        <button onClick={handleAddPlan} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 transition-all"><Plus className="w-5 h-5" /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          {Array.isArray(plans) && plans.map(p => (
            <button key={p.id} onClick={() => setEditingPlan(p)} className={cn("w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between", editingPlan?.id === p.id ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10")}>
              <span className="text-sm font-medium truncate">{p.nom}</span>
              {p.is_active && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            </button>
          ))}
        </div>

        {editingPlan ? (
          <div className="md:col-span-3 glass-card rounded-2xl p-6 border border-white/10 space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <input type="text" value={editingPlan.nom} onChange={e => handleUpdatePlan({ nom: e.target.value })} className="bg-transparent border-none text-xl font-bold text-white focus:ring-0 p-0 w-full" placeholder="Nom du plan" />
              </div>
              <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl shrink-0">
                <span className="text-[10px] font-bold uppercase text-indigo-400/60 tracking-wider">Revenu Réf.</span>
                <div className="flex items-center gap-1 group">
                  <input 
                    type="number" 
                    value={editingPlan.reference_salary || 0} 
                    onChange={e => handleUpdatePlan({ reference_salary: parseFloat(e.target.value) || 0 })} 
                    className="bg-transparent border-none text-sm font-bold text-indigo-300 focus:ring-0 p-0 w-20 text-right"
                  />
                  <span className="text-xs text-indigo-400">€</span>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer shrink-0 ml-2">
                <input type="checkbox" checked={editingPlan.is_active} onChange={e => handleUpdatePlan({ is_active: e.target.checked })} className="w-4 h-4 rounded border-white/10 bg-white/5 text-emerald-500 focus:ring-emerald-500/20" />
                <span className="text-[10px] font-bold uppercase text-white/40 tracking-wider">Actif</span>
              </label>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-tight">Où va le reste du salaire ?</p>
                    <p className="text-[10px] text-white/40 leading-relaxed max-w-xs">
                      Le montant non alloué par les règles ci-dessous sera automatiquement versé dans cette catégorie (ex: Épargne).
                    </p>
                  </div>
                  <select 
                    value={editingPlan.default_remainder_category} 
                    onChange={e => handleUpdatePlan({ default_remainder_category: e.target.value })} 
                    className="bg-white/5 border-white/10 rounded-lg text-xs text-white focus:ring-indigo-500/30 px-3 py-2 min-w-[120px]"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value} className="bg-[#0f0f13]">{c.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {editingPlan.items.map((item, idx) => (
                  <SalaryPlanItemRow key={idx} index={idx} item={item} referenceSalary={editingPlan.reference_salary}
                    onUpdate={u => { const items = [...editingPlan.items]; items[idx] = { ...items[idx], ...u }; handleUpdatePlan({ items }) }}
                    onRemove={() => handleUpdatePlan({ items: editingPlan.items.filter((_, i) => i !== idx) })} />
                ))}
                <button onClick={() => handleUpdatePlan({ items: [...editingPlan.items, { categorie: "Autre", montant: 0, type: 'percent', sub_distribution_mode: 'equal' }] })} className="w-full py-3 rounded-xl border border-dashed border-white/10 text-white/30 text-xs font-medium hover:bg-white/5 transition-all flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Ajouter une règle d'allocation</button>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-white/5">
              <div className="flex items-center gap-2 text-white/40 text-[10px]"><AlertCircle className="w-3.5 h-3.5" /><span>Sauvegardez pour appliquer ces règles lors du prochain scan de salaire.</span></div>
              <Button onClick={handleSave} className="bg-indigo-500 hover:bg-indigo-600 text-white gap-2 h-9 px-4"><Save className="w-4 h-4" /> Enregistrer</Button>
            </div>
          </div>
        ) : <div className="md:col-span-3 h-64 border border-dashed border-white/10 rounded-2xl flex items-center justify-center text-white/20">Sélectionnez ou créez un plan.</div>}
      </div>
    </div>
  )
}
