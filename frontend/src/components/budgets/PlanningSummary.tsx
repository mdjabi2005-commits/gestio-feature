"use client"

import React from "react"
import { PiggyBank, Receipt, ShoppingCart, Wallet, ArrowRight, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlanningSummaryProps {
  referenceSalary: number
  recurringIncomes?: number
  fixedCosts: number
  variableBudgets: number
  planName?: string
  className?: string
}

export function PlanningSummary({ referenceSalary, recurringIncomes = 0, fixedCosts, variableBudgets, planName, className }: PlanningSummaryProps) {
  const totalIncome = referenceSalary + recurringIncomes
  const disposableIncome = totalIncome - fixedCosts
  const theoreticalSavings = disposableIncome - variableBudgets
  const isDeficit = theoreticalSavings < 0

  const segments = [
    { label: "Fixe", value: fixedCosts, color: "bg-indigo-500", icon: Receipt },
    { label: "Variable", value: variableBudgets, color: "bg-emerald-500", icon: ShoppingCart },
    { label: isDeficit ? "Déficit" : "Épargne", value: Math.abs(theoreticalSavings), color: isDeficit ? "bg-rose-500" : "bg-sky-400", icon: PiggyBank },
  ]

  const total = segments.reduce((acc, s) => acc + s.value, 0)
  const maxVal = Math.max(total, referenceSalary)

  return (
    <div className={cn("glass-card rounded-3xl p-6 border-white/5 bg-white/[0.01]", className)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Revenu de Référence</p>
              {planName && (
                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-black uppercase tracking-tighter">
                  {planName}
                </span>
              )}
              {recurringIncomes > 0 && (
                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black uppercase tracking-tighter">
                  +{recurringIncomes}€ récurrents
                </span>
              )}
            </div>
            <p className="text-2xl font-black text-white tabular-nums">{totalIncome.toLocaleString("fr-FR")} €</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 md:gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Charges Fixes
            </p>
            <p className="text-lg font-bold text-white tabular-nums">{fixedCosts.toLocaleString("fr-FR")} €</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Budgets Variables
            </p>
            <p className="text-lg font-bold text-white tabular-nums">{variableBudgets.toLocaleString("fr-FR")} €</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-400/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Épargne / Mois
            </p>
            <p className={cn("text-lg font-bold tabular-nums", isDeficit ? "text-rose-400" : "text-sky-400")}>
              {theoreticalSavings.toLocaleString("fr-FR")} €
            </p>
          </div>
        </div>
      </div>

      {/* Yearly Projection Banner */}
      {!isDeficit && theoreticalSavings > 0 && (
        <div className="mb-8 p-3 rounded-2xl bg-sky-400/5 border border-sky-400/10 flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-400/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-xs font-medium text-white/60">
              En suivant ce plan, vous aurez mis <span className="text-sky-400 font-bold">{(theoreticalSavings * 12).toLocaleString("fr-FR")} €</span> de côté dans 1 an ! ✨
            </p>
          </div>
          <div className="text-[10px] font-bold text-sky-400/40 uppercase tracking-widest group-hover:text-sky-400/60 transition-colors">
            Boost Motivation
          </div>
        </div>
      )}

      {/* Visual Indicator */}
      <div className="space-y-4">
        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex">
          {segments.map((s, i) => (
            <div
              key={i}
              className={cn(s.color, "h-full transition-all duration-1000 ease-out border-r border-black/20 last:border-0")}
              style={{ width: `${(s.value / maxVal) * 100}%` }}
            />
          ))}
        </div>
        
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter text-white/20">
          <span>0 €</span>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-3 h-3" />
            <span>Planification mensuelle</span>
          </div>
          <span>{maxVal.toLocaleString("fr-FR")} €</span>
        </div>
      </div>
    </div>
  )
}
