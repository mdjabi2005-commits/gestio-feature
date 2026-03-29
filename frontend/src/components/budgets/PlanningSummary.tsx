"use client"

import React from "react"
import { PiggyBank, Receipt, ShoppingCart, Wallet, ArrowRight, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlanningSummaryProps {
  referenceSalary: number
  fixedChargesBalance: number
  variableBudgets: number
  planName?: string
  className?: string
  onEdit?: () => void
}

export function PlanningSummary({ referenceSalary, fixedChargesBalance, variableBudgets, planName, className, onEdit }: PlanningSummaryProps) {
  const disposableIncome = referenceSalary + fixedChargesBalance
  const theoreticalSavings = disposableIncome - variableBudgets
  const isDeficit = theoreticalSavings < 0
  
  // Le revenu total affiché est le salaire de base + les gains récurrents nets (si positifs)
  const totalCapacity = Math.max(referenceSalary, referenceSalary + fixedChargesBalance)

  const segments = []
  
  // 1. Si le solde des échéances est négatif, c'est une "charge fixe" (Rouge)
  if (fixedChargesBalance < 0) {
    segments.push({ 
      label: "Charges Fixes", 
      value: Math.abs(fixedChargesBalance), 
      color: "bg-rose-600", 
      icon: Receipt 
    })
  }
  
  // 2. Si le solde est positif, c'est un "gain récurrent" (Vert Foncé)
  if (fixedChargesBalance > 0) {
    segments.push({ 
      label: "Revenus Récurrents", 
      value: fixedChargesBalance, 
      color: "bg-emerald-700", 
      icon: TrendingUp 
    })
  }

  // 3. Budgets Variables (Vert)
  segments.push({ 
    label: "Variables", 
    value: variableBudgets, 
    color: "bg-emerald-500", 
    icon: ShoppingCart 
  })

  // 4. Épargne (Bleu)
  if (!isDeficit) {
    segments.push({ 
      label: "Épargne", 
      value: theoreticalSavings, 
      color: "bg-sky-400", 
      icon: PiggyBank 
    })
  }

  const barTotal = segments.reduce((acc, s) => acc + s.value, 0)
  const maxVal = Math.max(barTotal, totalCapacity)

  return (
    <div 
      className={cn(
        "glass-card rounded-3xl p-6 border-white/5 bg-white/[0.01] transition-all",
        onEdit ? "cursor-pointer hover:bg-white/[0.03] active:scale-[0.99]" : "",
        className
      )}
      onClick={onEdit}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
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
            </div>
            <p className="text-2xl font-black text-white tabular-nums">{referenceSalary.toLocaleString("fr-FR")} €</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 md:gap-8">
          <div className="space-y-1">
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5",
              fixedChargesBalance >= 0 ? "text-emerald-500/60" : "text-rose-500/60"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", fixedChargesBalance >= 0 ? "bg-emerald-600" : "bg-rose-600")} /> 
              Solde Échéances
            </p>
            <p className={cn("text-lg font-bold tabular-nums", fixedChargesBalance >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {fixedChargesBalance >= 0 ? "+" : ""}{fixedChargesBalance.toLocaleString("fr-FR")} €
            </p>
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

      {/* Visual Indicator - Multi-segment bar */}
      <div className="space-y-4">
        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex gap-0.5 p-0.5">
          {segments.map((s, i) => (
            <div
              key={i}
              className={cn(s.color, "h-full transition-all duration-1000 ease-out first:rounded-l-full last:rounded-r-full")}
              style={{ width: `${(s.value / maxVal) * 100}%` }}
              title={`${s.label}: ${s.value}€`}
            />
          ))}
        </div>
        
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter text-white/20">
          <span>0 €</span>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-3 h-3" />
            <span>Capacité Totale: {maxVal.toLocaleString("fr-FR")} €</span>
            {isDeficit && <span className="text-rose-500 font-black ml-2">DÉFICIT DE {Math.abs(theoreticalSavings)}€</span>}
          </div>
          <p className="text-[9px] font-black tabular-nums">{maxVal.toLocaleString("fr-FR")} €</p>
        </div>
      </div>
    </div>
  )
}
