"use client"

import { useMemo } from "react"
import type { Objectif, SalaryPlan, Transaction } from "@/api"

export interface GoalMetrics extends Objectif {
  montant_actuel_temporel: number
  montant_actuel_reel: number
  montant_mensuel_calc: number
  projection_date_calc: string | null
  projection_date_reel: string | null
  months_remaining: number
  months_remaining_reel: number
  progress_pct: number
  progress_pct_reel: number
  is_ahead: boolean
  delay_months: number | null
  impact_status: 'ahead' | 'on_time' | 'delayed' | 'neutral'
  montant_retard: number
}

export function useGoalCalculations(
  objectifs: Objectif[],
  salaryPlan: SalaryPlan | null,
  transactions: Transaction[]
) {
  return useMemo(() => {
    // 1. Capacité d'épargne théorique (Salary Plan)
    let totalMonthlySavings = 0
    if (salaryPlan) {
      const totalAllocated = salaryPlan.items.reduce((acc, item) => {
        if (item.type === 'fixed') return acc + item.montant
        return acc + (salaryPlan.reference_salary * (item.montant / 100))
      }, 0)
      totalMonthlySavings = Math.max(0, salaryPlan.reference_salary - totalAllocated)
    }

    const activeGoals = objectifs.filter(o => o.statut !== 'archived')
    
    // 2. Calcul des poids pour la répartition pondérée
    const totalWeights = activeGoals.reduce((sum, g) => sum + (g.poids_allocation ?? 1), 0)
    
    const getGoalWeight = (goal: Objectif) => {
       return (goal.poids_allocation ?? 1) / (totalWeights || 1)
    }

    // 3. Surplus mensuel REEL par mois
    const monthlySurplusMap: Record<string, number> = {}
    transactions.forEach(t => {
      const monthKey = t.date.substring(0, 7)
      if (!monthlySurplusMap[monthKey]) monthlySurplusMap[monthKey] = 0
      if (t.type === 'revenu') monthlySurplusMap[monthKey] += t.montant
      else monthlySurplusMap[monthKey] -= t.montant
    })

    // 4. Répartition REELLE Pondérée
    const realContributionPerGoal: Record<number, number> = {}
    const months = Object.keys(monthlySurplusMap).sort()
    if (months.length === 0) {
       const now = new Date();
       months.push(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    }

    months.forEach(monthKey => {
       const surplus = monthlySurplusMap[monthKey] || 0
       const goalsActiveThisMonth = activeGoals.filter(goal => {
          if (!goal.date_creation) return true;
          return goal.date_creation.substring(0, 7) <= monthKey
       })
       
       if (goalsActiveThisMonth.length > 0) {
          const totalWeightsThisMonth = goalsActiveThisMonth.reduce((s, g) => s + (g.poids_allocation ?? 1), 0)
          const surplusNorm = Math.max(0, surplus)
          
          goalsActiveThisMonth.forEach(g => {
             if (g.id) {
                const weight = (g.poids_allocation ?? 1) / (totalWeightsThisMonth || 1)
                const slice = surplusNorm * weight
                realContributionPerGoal[g.id] = (realContributionPerGoal[g.id] || 0) + slice
             }
          })
       }
    })

    // 5. Enrichir les objectifs
    const enrichedGoals: GoalMetrics[] = objectifs.map(goal => {
      const target = goal.montant_cible || 1
      const now = new Date()
      const creationDate = goal.date_creation ? new Date(goal.date_creation) : now
      const diffMonths = (now.getFullYear() - creationDate.getFullYear()) * 12 + (now.getMonth() - creationDate.getMonth())
      const monthsSinceCreation = Math.max(0, diffMonths) + 1
      
      // Théorique Pondérée
      const goalMonthlyAllocation = totalMonthlySavings * getGoalWeight(goal)
      const currentTheoretical = monthsSinceCreation * goalMonthlyAllocation
      const actualAmountTheoretical = Math.min(target, currentTheoretical)
      const remainingTheoretical = Math.max(0, target - actualAmountTheoretical)
      const monthsRemainingTh = goalMonthlyAllocation > 0 ? Math.ceil(remainingTheoretical / goalMonthlyAllocation) : Infinity
      
      // Réel
      const actualAmountReal = goal.id ? Math.min(target, realContributionPerGoal[goal.id] || 0) : 0
      const avgMonthlySurplus = actualAmountReal / monthsSinceCreation
      const remainingReal = Math.max(0, target - actualAmountReal)
      const monthsRemainingReel = avgMonthlySurplus > 0 ? Math.ceil(remainingReal / avgMonthlySurplus) : Infinity
      
      // Projections
      const projectionDateTh = monthsRemainingTh !== Infinity ? new Date(now.setMonth(now.getMonth() + monthsRemainingTh)).toISOString() : null
      const now2 = new Date() 
      const projectionDateReal = monthsRemainingReel !== Infinity ? new Date(now2.setMonth(now2.getMonth() + monthsRemainingReel)).toISOString() : null
      
      // Analyse d'Impact vs Cible (Échéance ou Plan)
      let delayMonths: number | null = null
      let impactStatus: 'ahead' | 'on_time' | 'delayed' | 'neutral' = 'neutral'
      
      const referenceDateStr = goal.date_echeance || projectionDateTh
      if (referenceDateStr && projectionDateReal) {
         const refDate = new Date(referenceDateStr)
         const projDate = new Date(projectionDateReal)
         delayMonths = (projDate.getFullYear() - refDate.getFullYear()) * 12 + (projDate.getMonth() - refDate.getMonth())
         
         if (delayMonths > 0) impactStatus = 'delayed'
         else if (delayMonths < 0) impactStatus = 'ahead'
         else if (delayMonths === 0) impactStatus = 'on_time'
      }

      return {
        ...goal,
        montant_actuel_temporel: actualAmountTheoretical,
        montant_actuel_reel: actualAmountReal,
        montant_mensuel_calc: goalMonthlyAllocation,
        projection_date_calc: projectionDateTh,
        projection_date_reel: projectionDateReal,
        months_remaining: monthsRemainingTh === Infinity ? 0 : monthsRemainingTh,
        months_remaining_reel: monthsRemainingReel === Infinity ? 0 : monthsRemainingReel,
        progress_pct: (actualAmountTheoretical / target) * 100,
        progress_pct_reel: (actualAmountReal / target) * 100,
        is_ahead: actualAmountReal > actualAmountTheoretical,
        delay_months: delayMonths,
        impact_status: impactStatus,
        montant_retard: actualAmountTheoretical - actualAmountReal
      }
    })

    const totalTarget = enrichedGoals.reduce((s, g) => s + (g.montant_cible || 0), 0)
    const totalCurrent = enrichedGoals.reduce((s, g) => s + g.montant_actuel_temporel, 0)
    const totalReal = enrichedGoals.reduce((s, g) => s + (g.montant_actuel_reel || 0), 0)
    const completedCount = enrichedGoals.filter(g => g.montant_actuel_reel >= (g.montant_cible || 0)).length

    return {
      enrichedGoals,
      totalMonthlySavings,
      totalTarget,
      totalCurrent,
      totalReal,
      globalProgress: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0,
      activeGoalsCount: activeGoals.length,
      completedCount
    }
  }, [objectifs, salaryPlan, transactions])
}
