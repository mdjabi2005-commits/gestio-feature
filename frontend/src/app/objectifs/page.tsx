"use client"
import { useState, useMemo } from "react"
import { Plus, Target, TrendingUp, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { useFinancial } from "@/context/FinancialDataContext"
import { GoalCard } from "@/components/objectifs/GoalCard"
import { GoalTable } from "@/components/objectifs/GoalTable"
import { GoalForm } from "@/components/objectifs/GoalForm"
import type { Objectif } from "@/api"

export default function ObjectifsPage() {
  const { objectifs, objectifsLoading, setObjectif, deleteObjectif, summary, showFinishedGoals, setShowFinishedGoals } = useFinancial()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Objectif | null>(null)

  const allCategories = summary?.repartition_categories ?? []

  // Filtering based on global toggle
  const filteredObjectifsList = useMemo(() => {
    if (showFinishedGoals) return objectifs;
    return objectifs.filter(o => {
      const isCompleted = (o.montant_actuel || 0) >= (o.montant_cible || 0);
      return !isCompleted || o.statut !== 'completed'; // Double check with status if available
    });
  }, [objectifs, showFinishedGoals]);

  // Global Stats
  const totalTarget = objectifs.reduce((s, o) => s + (o.montant_cible || 0), 0)
  const totalCurrent = objectifs.reduce((s, o) => s + (o.montant_actuel || 0), 0)
  const completedCount = objectifs.filter(o => (o.montant_actuel || 0) >= (o.montant_cible || 0)).length
  
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0

  const handleEdit = (goal: Objectif) => {
    setEditTarget(goal)
    setShowForm(true)
  }

  if (objectifsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">Objectifs Financiers</h1>
          <p className="text-sm text-white/40 font-medium">Suivez votre progression vers vos rêves.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFinishedGoals(!showFinishedGoals)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all text-xs font-bold ${
              showFinishedGoals 
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
                : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
            }`}
          >
            {showFinishedGoals ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showFinishedGoals ? "Masquer terminés" : "Afficher terminés"}
          </button>
          <button
            onClick={() => { setEditTarget(null); setShowForm(true) }}
            className="group flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" /> Nouvel Objectif
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-white/10 flex items-center gap-5 shadow-inner">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0 animate-pulse-slow">
             <Target className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-indigo-400/60 tracking-widest mb-0.5">Total Cible</p>
            <p className="text-2xl font-black text-white tabular-nums">{totalTarget.toLocaleString("fr-FR")} €</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-white/10 flex items-center gap-5 shadow-inner bg-emerald-500/[0.02]">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
             <TrendingUp className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-emerald-400/60 tracking-widest mb-0.5">Total Épargné</p>
            <p className="text-2xl font-black text-emerald-400 tabular-nums">{totalCurrent.toLocaleString("fr-FR")} €</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-white/10 flex items-center gap-5 shadow-inner bg-purple-500/[0.02]">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
             <CheckCircle2 className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-purple-400/60 tracking-widest mb-0.5">Complétés</p>
            <p className="text-2xl font-black text-white">{completedCount} / {objectifs.length}</p>
          </div>
        </div>
      </div>

      {/* Main Goal Section */}
      {filteredObjectifsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 gap-6 glass-card rounded-[40px] border border-dashed border-white/10">
          <div className="w-20 h-20 rounded-3xl bg-white/[0.03] flex items-center justify-center">
            <Target className="w-10 h-10 text-white/10" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-white/60">Aucun objectif visible</h3>
            <p className="text-sm text-white/30 max-w-xs mx-auto">
              {objectifs.length > 0 
                ? "Tous vos objectifs sont complétés et masqués." 
                : "Commencez par créer votre premier objectif d'épargne pour visualiser votre progression."}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-sm font-bold hover:bg-white/10 transition-all hover:text-white"
          >
            Créer un objectif
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredObjectifsList.map(goal => (
              <GoalCard 
                key={goal.id} 
                goal={goal} 
                onDelete={deleteObjectif} 
                onEdit={handleEdit} 
              />
            ))}
          </div>

          <div className="space-y-4 pt-10">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Gestion détaillée</h3>
            </div>
            <GoalTable 
              goals={filteredObjectifsList} 
              onDelete={deleteObjectif} 
              onEdit={handleEdit} 
            />
          </div>
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <GoalForm 
          initial={editTarget} 
          onSave={setObjectif} 
          onClose={() => { setShowForm(false); setEditTarget(null); }} 
        />
      )}
    </div>
  )
}
