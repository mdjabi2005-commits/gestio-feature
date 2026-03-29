"use client"

import React, { useState, useEffect, useMemo } from "react"
import { X, PiggyBank, Save, Info, Loader2, TrendingUp, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Objectif } from "@/api"
import { useFinancial } from "@/context/FinancialDataContext"
import { GoalPlanningRow } from "./GoalPlanningRow"
import { QuickAddGoalForm } from "./QuickAddGoalForm"
import { GOAL_CATEGORIES } from "@/lib/goal-categories"
import { toast } from "sonner"

interface GoalSavingsConfigProps {
  goals: Objectif[]
  totalMonthlySavings: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function GoalSavingsConfig({ 
  goals, 
  totalMonthlySavings, 
  open, 
  onOpenChange,
  onSaved 
}: GoalSavingsConfigProps) {
  const { setObjectif } = useFinancial()
  const [tempObjectifs, setTempObjectifs] = useState<Objectif[]>([])
  const [newGoal, setNewGoal] = useState<Partial<Objectif>>({
    nom: "",
    categorie: GOAL_CATEGORIES[0].name,
    date_echeance: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setTempObjectifs(goals.filter(o => o.statut !== 'archived'))
    }
  }, [open, goals])

  const totalAllocatedPct = useMemo(() => {
    return tempObjectifs.reduce((sum, g) => sum + (g.poids_allocation ?? 0), 0)
  }, [tempObjectifs])

  const remainingPct = Math.max(0, 100 - totalAllocatedPct)
  const totalAllocatedAmount = (totalAllocatedPct / 100) * totalMonthlySavings

  const getDurationMonths = (dateStr?: string) => {
     if (!dateStr) return 0
     const end = new Date(dateStr); const now = new Date()
     return (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth())
  }

  const handlePctChange = (idx: number, newPct: number) => {
    const next = [...tempObjectifs]
    const currentGoalPct = next[idx].poids_allocation ?? 0
    const otherGoalsTotal = totalAllocatedPct - currentGoalPct
    
    // Cap at 100% total
    const allowedPct = Math.min(newPct, 100 - otherGoalsTotal)
    
    next[idx] = { ...next[idx], poids_allocation: allowedPct }
    setTempObjectifs(next)
  }

  const handleAddGoal = () => {
    if (!newGoal.nom) return toast.error("Veuillez donner un nom à votre objectif")
    
    // Default 10% or remaining if less
    const initialPct = Math.min(10, remainingPct)
    
    const formattedDate = newGoal.date_echeance?.length === 7 
      ? `${newGoal.date_echeance}-01` 
      : newGoal.date_echeance

    const goalToAdd: Objectif = {
       nom: newGoal.nom, 
       categorie: newGoal.categorie || "ÉpargneAutre", 
       date_echeance: formattedDate,
       montant_cible: 0, 
       poids_allocation: initialPct, 
       statut: 'active'
    }
    setTempObjectifs(prev => [...prev, goalToAdd])
    setNewGoal({ 
       nom: "", 
       categorie: GOAL_CATEGORIES[0].name, 
       date_echeance: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0] 
    })
    toast.success("Objectif ajouté au plan !")
  }

  const handleSave = async () => {
    setSaving(true)
    const dataToSend = tempObjectifs.map(goal => {
        if (!goal.id) {
           const months = getDurationMonths(goal.date_echeance)
           const monthly = (goal.poids_allocation! / 100) * totalMonthlySavings
           return { ...goal, montant_cible: Math.max(1, Math.round(monthly * months)) }
        }
        return goal
    })

    console.group("🚀 Application du Plan d'Épargne")
    console.log("Capacité mensuelle:", totalMonthlySavings)
    console.table(dataToSend)
    console.groupEnd()

    try {
      const promises = dataToSend.map(goal => setObjectif(goal))
      await Promise.all(promises)
      toast.success("Plan d'épargne appliqué ! 💰")
      onSaved(); onOpenChange(false)
    } catch (err: any) { 
      console.error("Erreur de sauvegarde:", err)
      toast.error(`Erreur: ${err.message}`) 
    } finally { 
      setSaving(false) 
    }
  }

  if (!open) return null

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300", open ? "opacity-100" : "opacity-0 pointer-events-none")}>
      <div className="absolute inset-0" onClick={() => onOpenChange(false)} />
      <div className={cn("relative w-full max-w-2xl h-full bg-[#0a0a0c] border-l border-white/10 p-0 shadow-2xl flex flex-col transition-transform duration-500 ease-out", open ? "translate-x-0" : "translate-x-full")}>
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"><PiggyBank className="w-6 h-6 text-emerald-400" /></div>
             <div><h2 className="text-xl font-black text-white uppercase tracking-tighter text-balance">Plan d'Épargne</h2><p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Allocation par Pourcentage (%)</p></div>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-3 rounded-2xl text-white/20 hover:text-white hover:bg-white/10 transition-all"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
          {/* Dashboard Allocation Summary */}
          <div className="grid grid-cols-2 gap-4">
             <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Total Alloué</span>
                <p className="text-2xl font-black text-white tabular-nums">{totalAllocatedPct}% <span className="text-xs text-white/20 font-bold tracking-tight">/ 100%</span></p>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-2">
                   <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${totalAllocatedPct}%` }} />
                </div>
             </div>
             <div className="p-6 rounded-[32px] bg-indigo-500/5 border border-indigo-500/10 flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400/60">Réserve Libre</span>
                <p className="text-2xl font-black text-indigo-400 tabular-nums">{remainingPct}%</p>
                <p className="text-[10px] font-medium text-white/30">{(remainingPct / 100 * totalMonthlySavings).toLocaleString("fr-FR")}€ non affectés</p>
             </div>
          </div>

          <div className="space-y-6">
             <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Vos Objectifs Actifs</h3>
                <div className="flex items-center gap-2 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                   <ShieldCheck className="w-3 h-3 text-emerald-400" />
                   <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Capacité Maximale 100%</span>
                </div>
             </div>
             
             {tempObjectifs.map((goal, idx) => (
                <GoalPlanningRow 
                  key={goal.id || `new-${idx}`} 
                  goal={goal} 
                  allocationPct={goal.poids_allocation ?? 0} 
                  totalMonthlySavings={totalMonthlySavings}
                  isNew={!goal.id} 
                  onPctChange={val => handlePctChange(idx, val)}
                  onRemove={() => setTempObjectifs(prev => prev.filter((_, i) => i !== idx))}
                  onUpdateMetadata={updates => { const next = [...tempObjectifs]; next[idx] = { ...next[idx], ...updates }; setTempObjectifs(next) }}
                />
             ))}
             
             <QuickAddGoalForm newGoal={newGoal} setNewGoal={setNewGoal} onAdd={handleAddGoal} />
          </div>
        </div>

        <div className="p-8 border-t border-white/5 bg-white/[0.02] space-y-6">
           <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Résumé des changements</h4>
              <div className="flex flex-col gap-2">
                 <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-white/40">Nouveaux Objectifs :</span>
                    <span className="text-emerald-400">{tempObjectifs.filter(o => !o.id).length}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-white/40">Mises à jour :</span>
                    <span className="text-indigo-400">{tempObjectifs.filter(o => o.id).length}</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center justify-between px-4">
              <div className="flex flex-col">
                 <span className="text-sm font-black text-white tabular-nums">{totalAllocatedAmount.toLocaleString("fr-FR")} €</span>
                 <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Affectés ce mois</span>
              </div>
              <div className="flex flex-col text-right">
                 <span className="text-sm font-black text-emerald-400 tabular-nums">{totalAllocatedPct}%</span>
                 <span className="text-[10px] font-bold text-emerald-400/40 uppercase tracking-widest">Utilisation du Surplus</span>
              </div>
           </div>
           
           <button onClick={handleSave} disabled={saving} className="w-full h-16 rounded-[28px] bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 group">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 group-hover:scale-110 transition-transform" />Appliquer le Plan d'Épargne</>}
           </button>
        </div>
      </div>
    </div>
  )
}
