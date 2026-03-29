"use client"

import { useMemo } from "react"
import type { Objectif, SalaryPlan } from "@/api"

export interface GoalMetrics extends Objectif {
  montant_actuel_temporel: number
  montant_actuel_reel: number
  montant_mensuel_calc: number
  montant_mensuel_reel: number
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

function calculateEpargneMensuelle(salaryPlan: SalaryPlan | null): number {
  if (!salaryPlan || !salaryPlan.reference_salary || salaryPlan.reference_salary <= 0) {
    return 0
  }

  const totalAllocatedPercent = salaryPlan.items
    .filter(item => item.type === 'percent')
    .reduce((sum, item) => sum + item.montant, 0)

  const epargnePercent = Math.max(0, 100 - totalAllocatedPercent)
  return Math.round(salaryPlan.reference_salary * epargnePercent / 100 * 100) / 100
}

export function useGoalCalculations(
  objectifs: Objectif[],
  salaryPlan: SalaryPlan | null,
) {
  return useMemo(() => {
    const now = new Date()
    const activeGoals = objectifs.filter(o => o.statut !== 'archived')

    const epargneMensuelle = calculateEpargneMensuelle(salaryPlan)

    const enrichedGoals: GoalMetrics[] = objectifs.map(goal => {
      const target = goal.montant_cible || 1

      const startDate = goal.date_debut ? new Date(goal.date_debut) : (goal.date_creation ? new Date(goal.date_creation) : now)
      const monthsSinceCreation = Math.max(1, (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()))

      const goalMonthlyTheoretical = goal.montant_mensuel_calcule ?? 0
      const actualAmountTheoretical = goalMonthlyTheoretical * monthsSinceCreation

      const actualAmountReal = goal.montant_actuel ?? 0
      const avgMonthlyReal = actualAmountReal / monthsSinceCreation

      const remainingTheoretical = Math.max(0, target - actualAmountTheoretical)
      const monthsRemainingTh = goalMonthlyTheoretical > 0 ? Math.ceil(remainingTheoretical / goalMonthlyTheoretical) : 0

      const remainingReal = Math.max(0, target - actualAmountReal)
      const monthsRemainingReel = avgMonthlyReal > 0 ? Math.ceil(remainingReal / avgMonthlyReal) : 0

      const projectionDateTh = monthsRemainingTh > 0 
        ? new Date(now.getFullYear(), now.getMonth() + monthsRemainingTh).toISOString() 
        : null
      const projectionDateReal = monthsRemainingReel > 0
        ? new Date(now.getFullYear(), now.getMonth() + monthsRemainingReel).toISOString()
        : null

      let delayMonths: number | null = null
      let impactStatus: 'ahead' | 'on_time' | 'delayed' | 'neutral' = 'neutral'
      
      const referenceDateStr = goal.date_fin || projectionDateTh
      if (referenceDateStr && projectionDateReal) {
        const refDate = new Date(referenceDateStr)
        const projDate = new Date(projectionDateReal)
        delayMonths = (projDate.getFullYear() - refDate.getFullYear()) * 12 + (projDate.getMonth() - refDate.getMonth())
        
        if (delayMonths > 0) impactStatus = 'delayed'
        else if (delayMonths < 0) impactStatus = 'ahead'
        else if (delayMonths === 0) impactStatus = 'on_time'
      }

      const montantRetard = actualAmountTheoretical - actualAmountReal
      const monthlyDelayFromPlan = goalMonthlyTheoretical > 0 ? Math.ceil(montantRetard / goalMonthlyTheoretical) : 0

      return {
        ...goal,
        montant_actuel_temporel: actualAmountTheoretical,
        montant_actuel_reel: actualAmountReal,
        montant_mensuel_calc: goalMonthlyTheoretical,
        montant_mensuel_reel: avgMonthlyReal,
        projection_date_calc: projectionDateTh,
        projection_date_reel: projectionDateReal,
        months_remaining: monthsRemainingTh,
        months_remaining_reel: monthsRemainingReel,
        progress_pct: (actualAmountTheoretical / target) * 100,
        progress_pct_reel: (actualAmountReal / target) * 100,
        is_ahead: actualAmountReal > actualAmountTheoretical,
        delay_months: monthlyDelayFromPlan > 0 ? monthlyDelayFromPlan : (delayMonths || 0),
        impact_status: impactStatus,
        montant_retard: montantRetard
      }
    })

    const totalTarget = enrichedGoals.reduce((s, g) => s + (g.montant_cible || 0), 0)
    const totalCurrent = enrichedGoals.reduce((s, g) => s + g.montant_actuel_temporel, 0)
    const totalReal = enrichedGoals.reduce((s, g) => s + (g.montant_actuel_reel || 0), 0)
    const completedCount = enrichedGoals.filter(g => g.montant_actuel_reel >= (g.montant_cible || 0)).length

    return {
      enrichedGoals,
      epargneMensuelle,
      totalMonthlySavings: epargneMensuelle,
      totalTarget,
      totalCurrent,
      totalReal,
      globalProgress: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0,
      activeGoalsCount: activeGoals.length,
      completedCount
    }
  }, [objectifs, salaryPlan])
}
