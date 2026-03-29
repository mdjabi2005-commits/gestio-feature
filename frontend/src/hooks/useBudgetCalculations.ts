"use client"

import { useMemo } from "react"
import type { Budget, Echeance, Transaction } from "@/api"
import { calculatePlannedExpenses, calculatePlannedIncomes, getMonthOccurrences } from "@/lib/budget-utils"
import { getCategoryMetadata } from "@/lib/categories"

export interface BudgetCalculations {
  spentByCategory: Record<string, number>
  incomeByCategory: Record<string, number>
  plannedExpensesByCategory: Record<string, number>
  plannedIncomeByCategory: Record<string, number>
  totalBudget: number
  totalSpent: number
  totalIncome: number
  totalPlannedExpenses: number
  totalPlannedIncome: number
  totalForecastedExpenses: number
  totalForecastedIncome: number
  totalForecastedSavings: number
  globalPct: number
  forecastPct: number
  overBudget: Budget[]
  potentiallyOver: Budget[]
}

export interface StrategicBalanceResult {
  fixedChargesBalance: number
  totalVariableBudgets: number
  totalStrategicIncome: number
  totalStrategicExpense: number
  fixedExpenseCategories: Set<string>
}

export function useBudgetCalculations(
  budgets: Budget[],
  transactions: Transaction[],
  echeances: Echeance[],
  selectedMonth?: number,
  selectedYear?: number
): BudgetCalculations {
  const now = new Date()
  const year = selectedYear ?? now.getFullYear()
  const month = selectedMonth ?? now.getMonth()

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    transactions.forEach(t => {
      const d = new Date(t.date)
      if (t.type === "depense" && d.getMonth() === month && d.getFullYear() === year) {
        const parentKey = t.categorie
        const subKey = t.sous_categorie ? `${t.categorie} > ${t.sous_categorie}` : null
        
        map[parentKey] = (map[parentKey] ?? 0) + t.montant
        if (subKey) {
          map[subKey] = (map[subKey] ?? 0) + t.montant
        }
      }
    })
    return map
  }, [transactions, month, year])

  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    transactions.forEach(t => {
      const d = new Date(t.date)
      if (t.type === "revenu" && d.getMonth() === month && d.getFullYear() === year) {
        const parentKey = t.categorie
        const subKey = t.sous_categorie ? `${t.categorie} > ${t.sous_categorie}` : null
        
        map[parentKey] = (map[parentKey] ?? 0) + t.montant
        if (subKey) {
          map[subKey] = (map[subKey] ?? 0) + t.montant
        }
      }
    })
    return map
  }, [transactions, month, year])

  const plannedExpensesByCategory = useMemo(() => {
    return calculatePlannedExpenses(echeances, transactions, year, month)
  }, [echeances, transactions, year, month])

  const plannedIncomeByCategory = useMemo(() => {
    return calculatePlannedIncomes(echeances, transactions, year, month)
  }, [echeances, transactions, year, month])

  const totalBudget = useMemo(() => budgets.reduce((s, b) => s + b.montant_max, 0), [budgets])
  const totalSpent = useMemo(() => budgets.reduce((s, b) => s + (spentByCategory[b.categorie] ?? 0), 0), [budgets, spentByCategory])
  const totalIncome = useMemo(() => budgets.reduce((s, b) => s + (incomeByCategory[b.categorie] ?? 0), 0), [budgets, incomeByCategory])
  const totalPlannedExpenses = useMemo(() => budgets.reduce((s, b) => s + (plannedExpensesByCategory[b.categorie] ?? 0), 0), [budgets, plannedExpensesByCategory])
  const totalPlannedIncome = useMemo(() => budgets.reduce((s, b) => s + (plannedIncomeByCategory[b.categorie] ?? 0), 0), [budgets, plannedIncomeByCategory])

  const totalForecastedExpenses = totalSpent + totalPlannedExpenses
  const totalForecastedIncome = totalIncome + totalPlannedIncome
  const totalForecastedSavings = totalForecastedIncome - totalForecastedExpenses

  const globalPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0
  const forecastPct = totalBudget > 0 ? Math.min((totalForecastedExpenses / totalBudget) * 100, 100) : 0

  const overBudget = useMemo(() => 
    budgets.filter(b => (spentByCategory[b.categorie] ?? 0) > b.montant_max),
    [budgets, spentByCategory]
  )

  const potentiallyOver = useMemo(() => 
    budgets.filter(b => {
      const spent = spentByCategory[b.categorie] ?? 0
      const planned = plannedExpensesByCategory[b.categorie] ?? 0
      return spent <= b.montant_max && (spent + planned) > b.montant_max
    }),
    [budgets, spentByCategory, plannedExpensesByCategory]
  )

  return {
    spentByCategory,
    incomeByCategory,
    plannedExpensesByCategory,
    plannedIncomeByCategory,
    totalBudget,
    totalSpent,
    totalIncome,
    totalPlannedExpenses,
    totalPlannedIncome,
    totalForecastedExpenses,
    totalForecastedIncome,
    totalForecastedSavings,
    globalPct,
    forecastPct,
    overBudget,
    potentiallyOver,
  }
}

export function useStrategicBalance(
  echeances: Echeance[],
  budgets: Budget[],
  selectedMonth?: number,
  selectedYear?: number
): StrategicBalanceResult {
  const now = new Date()
  const year = selectedYear ?? now.getFullYear()
  const month = selectedMonth ?? now.getMonth()

  return useMemo(() => {
    let totalStrategicIncome = 0
    let totalStrategicExpense = 0
    const fixedExpenseCategories = new Set<string>()

    echeances.forEach(ech => {
      // Skip inactive echeances (we include 'paid' for strategic planning)
      const echAny = ech as any
      const statut = echAny.statut || echAny.status || 'active'
      if (statut === 'inactive') return
      
      const occurrences = getMonthOccurrences(echAny, year, month)
      const amount = Number(echAny.montant || echAny.amount) || 0
      const totalAmount = occurrences.length * amount
      
      if (totalAmount > 0) {
        const type = echAny.type || 'depense'
        if (type === 'revenu' || type === 'income') {
          totalStrategicIncome += totalAmount
        } else {
          totalStrategicExpense += totalAmount
          const cat = (echAny.categorie || echAny.category || '').trim().toLowerCase()
          if (cat) fixedExpenseCategories.add(cat)
          if (echAny.sous_categorie) {
            fixedExpenseCategories.add(`${cat} > ${(echAny.sous_categorie || '').trim().toLowerCase()}`)
          }
        }
      }
    })

    const fixedChargesBalance = totalStrategicIncome - totalStrategicExpense

    const totalVariableBudgets = budgets.reduce((acc, b) => {
      const cat = b.categorie.trim().toLowerCase()
      const isSub = cat.includes(' > ')
      const parentCat = isSub ? cat.split(' > ')[0] : cat
      
      if (fixedExpenseCategories.has(cat) || fixedExpenseCategories.has(parentCat)) {
        return acc
      }
      return acc + b.montant_max
    }, 0)

    return {
      fixedChargesBalance,
      totalVariableBudgets,
      totalStrategicIncome,
      totalStrategicExpense,
      fixedExpenseCategories,
    }
  }, [echeances, budgets, year, month])
}

export interface BudgetCardCalculations {
  totalForecastedSpent: number
  totalForecastedIncome: number
  netForecasted: number
  pctRealSpent: number
  pctPlannedSpent: number
  pctIncome: number
  remainingActual: number
  remainingForecast: number
  isOver: boolean
  isPotentiallyOver: boolean
  isWarning: boolean
  localPct: number
  cardColor: string
}

export function useBudgetCardCalculations(
  budget: Budget,
  spent: number,
  planned: number,
  income: number,
  plannedIncome: number,
  allCategories: any[],
  localAmount: number,
  parentBudget?: Budget | null,
  isFiltered?: boolean
): BudgetCardCalculations {
  const totalForecastedSpent = spent + planned
  const totalForecastedIncome = income + plannedIncome
  const netForecasted = totalForecastedIncome - totalForecastedSpent
  
  const pctRealSpent = budget.montant_max > 0 ? Math.min((spent / budget.montant_max) * 100, 100) : 0
  const pctPlannedSpent = budget.montant_max > 0 ? Math.min((planned / budget.montant_max) * 100, 100 - pctRealSpent) : 0
  const pctIncome = budget.montant_max > 0 ? Math.min((totalForecastedIncome / budget.montant_max) * 100, 100) : 0
  
  const remainingActual = budget.montant_max - spent
  const remainingForecast = budget.montant_max - totalForecastedSpent
  
  const isOver = spent > budget.montant_max
  const isPotentiallyOver = !isOver && totalForecastedSpent > budget.montant_max
  const isWarning = budget.montant_max > 0 && (spent / budget.montant_max) >= 0.8 && !isOver

  const catMeta = getCategoryMetadata(allCategories, budget.categorie)
  const cardColor = catMeta.icone ? '' : catMeta.couleur || '#666'
  
  const isSub = budget.categorie.includes(' > ')
  const localPct = (isSub && parentBudget && parentBudget.montant_max > 0) 
    ? Math.round((localAmount / parentBudget.montant_max) * 100) 
    : 0

  return {
    totalForecastedSpent,
    totalForecastedIncome,
    netForecasted,
    pctRealSpent,
    pctPlannedSpent,
    pctIncome,
    remainingActual,
    remainingForecast,
    isOver,
    isPotentiallyOver,
    isWarning,
    localPct,
    cardColor: catMeta.couleur || '#666',
  }
}

export function useBudgetFilters(budgets: Budget[], selectedCategory: string | null) {
  const parentCategories = useMemo(() => {
    const set = new Set<string>()
    budgets.forEach(b => {
      const parent = b.categorie.includes(' > ') ? b.categorie.split(' > ')[0] : b.categorie
      set.add(parent)
    })
    return Array.from(set).sort()
  }, [budgets])

  const filteredBudgets = useMemo(() => {
    if (!selectedCategory) {
      const subCategoryParents = new Set(
        budgets
          .filter(b => b.categorie.trim().includes(' > '))
          .map(b => b.categorie.trim().split(' > ')[0])
      )

      const leafBudgets = budgets.filter(b => {
        const cat = b.categorie.trim()
        const isParent = !cat.includes(' > ')
        if (isParent) {
          return !subCategoryParents.has(cat)
        }
        return true
      })

      return leafBudgets.sort((a, b) => {
        const catA = a.categorie.trim()
        const catB = b.categorie.trim()
        const pA = catA.split(' > ')[0]
        const pB = catB.split(' > ')[0]
        if (pA === pB) return catA.localeCompare(catB)
        return pA.localeCompare(pB)
      })
    }
    return budgets.filter(b => b.categorie.trim().startsWith(selectedCategory) && b.categorie.trim() !== selectedCategory)
  }, [budgets, selectedCategory])

  return { parentCategories, filteredBudgets }
}
