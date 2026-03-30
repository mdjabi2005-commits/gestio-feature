"use client"

import React from "react"
import { Plus, Eye, EyeOff, Sliders } from "lucide-react"

interface GoalPageHeaderProps {
  showSavingsConfig: boolean
  setShowSavingsConfig: (show: boolean) => void
  showFinishedGoals: boolean
  setShowFinishedGoals: (show: boolean) => void
}

export function GoalPageHeader({ 
  showSavingsConfig,
  setShowSavingsConfig, 
  showFinishedGoals, 
  setShowFinishedGoals
}: GoalPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">Objectifs Financiers</h1>
        <p className="text-sm text-white/40 font-medium">Suivez votre progression vers vos rêves.</p>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowSavingsConfig(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-bold hover:bg-emerald-500/10 transition-all shadow-lg shadow-emerald-500/5"
        >
          <Sliders className="w-4 h-4" />
          Plan d'Épargne
        </button>
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
      </div>
    </div>
  )
}
