"use client"
import { useState, useMemo, useEffect } from "react"
import { Target } from "lucide-react"
import { useFinancial } from "@/context/FinancialDataContext"
import { GoalCard } from "@/components/objectifs/GoalCard"
import { GoalTable } from "@/components/objectifs/GoalTable"
import { GoalForm } from "@/components/objectifs/GoalForm"
import { GoalDetailDrawer } from "@/components/objectifs/GoalDetailDrawer"
import { GoalSavingsConfig } from "@/components/objectifs/GoalSavingsConfig"
import { GoalPageHeader } from "@/components/objectifs/GoalPageHeader"
import { GoalStatsSummary } from "@/components/objectifs/GoalStatsSummary"
import { GoalEvolutionChart } from "@/components/objectifs/GoalEvolutionChart"
import { useGoalCalculations } from "@/hooks/useGoalCalculations"
import { api, type Objectif, type GoalMonthlyProgress } from "@/api"

export default function ObjectifsPage() {
  const { 
    objectifs, objectifsLoading, setObjectif, deleteObjectif, 
    showFinishedGoals, setShowFinishedGoals, activeSalaryPlan, transactions
  } = useFinancial()
  
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Objectif | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<Objectif | null>(null)
  const [showSavingsConfig, setShowSavingsConfig] = useState(false)
  const [globalMonthlyProgress, setGlobalMonthlyProgress] = useState<GoalMonthlyProgress[]>([])
  const [loadingGlobalProgress, setLoadingGlobalProgress] = useState(false)

  const {
    enrichedGoals, totalTarget, totalCurrent, totalReal, totalMonthlySavings, completedCount
  } = useGoalCalculations(objectifs, activeSalaryPlan)

  useEffect(() => {
    if (enrichedGoals.length > 0) fetchGlobalMonthlyProgress()
  }, [enrichedGoals.length])

  const fetchGlobalMonthlyProgress = async () => {
    setLoadingGlobalProgress(true)
    try {
      const allProgress = await Promise.all(
        enrichedGoals.map(g => api.getGoalMonthlyProgress(g.id!))
      )
      const monthMap = new Map<string, { theoretical: number; real: number }>()
      allProgress.flat().forEach(item => {
        const existing = monthMap.get(item.month) || { theoretical: 0, real: 0 }
        monthMap.set(item.month, {
          theoretical: existing.theoretical + item.theoretical,
          real: existing.real + item.real
        })
      })
      const aggregated = Array.from(monthMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))
      setGlobalMonthlyProgress(aggregated)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingGlobalProgress(false)
    }
  }

  const filteredGoals = useMemo(() => {
    if (showFinishedGoals) return enrichedGoals;
    return enrichedGoals.filter(o => {
      const isCompleted = (o.montant_actuel_temporel || 0) >= (o.montant_cible || 0);
      return !isCompleted || o.statut !== 'completed';
    });
  }, [enrichedGoals, showFinishedGoals]);

  if (objectifsLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" /></div>

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto pb-10">
      <GoalPageHeader 
        showSavingsConfig={showSavingsConfig} setShowSavingsConfig={setShowSavingsConfig}
        showFinishedGoals={showFinishedGoals} setShowFinishedGoals={setShowFinishedGoals}
        onAddGoal={() => { setEditTarget(null); setShowForm(true); }}
      />

      <GoalStatsSummary 
        totalTarget={totalTarget} totalReal={totalReal} totalCurrent={totalCurrent} 
        completedCount={completedCount} totalCount={objectifs.length}
      />

      {globalMonthlyProgress.length > 0 && (
        <div className="glass-card rounded-[40px] p-8 border border-white/10">
          <GoalEvolutionChart 
            data={globalMonthlyProgress} 
            title="Évolution globale (Tous objectifs)"
          />
        </div>
      )}

      {filteredGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 gap-6 glass-card rounded-[40px] border border-dashed border-white/10">
          <div className="w-20 h-20 rounded-3xl bg-white/[0.03] flex items-center justify-center"><Target className="w-10 h-10 text-white/10" /></div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-white/60">Aucun objectif visible</h3>
            <p className="text-sm text-white/30 max-w-xs mx-auto">{objectifs.length > 0 ? "Tous vos objectifs sont complétés et masqués." : "Commencez par créer votre premier objectif d'épargne."}</p>
          </div>
          <button onClick={() => setShowForm(true)} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-sm font-bold hover:bg-white/10 transition-all hover:text-white">Créer un objectif</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal as any} onDelete={deleteObjectif} onEdit={g => { setEditTarget(g); setShowForm(true); }} onClick={() => setSelectedGoal(goal)} />
            ))}
          </div>
          <div className="space-y-4 pt-10">
            <h3 className="text-sm font-black uppercase tracking-widest text-white/40 px-2">Gestion détaillée</h3>
            <GoalTable goals={filteredGoals as any} onDelete={deleteObjectif} onEdit={g => { setEditTarget(g); setShowForm(true); }} onSelect={setSelectedGoal} />
          </div>
        </>
      )}

      <GoalDetailDrawer goal={selectedGoal as any} transactions={transactions.filter(t => t.objectif_id === selectedGoal?.id)} open={!!selectedGoal} onOpenChange={o => !o && setSelectedGoal(null)} />
      {showForm && <GoalForm initial={editTarget} onSave={setObjectif} onClose={() => { setShowForm(false); setEditTarget(null); }} />}
      <GoalSavingsConfig open={showSavingsConfig} onOpenChange={setShowSavingsConfig} goals={enrichedGoals} totalMonthlySavings={totalMonthlySavings} onSaved={() => {}} />
    </div>
  )
}
