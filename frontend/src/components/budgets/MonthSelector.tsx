"use client"
import React from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface MonthSelectorProps {
  selectedMonth: number // 0-11
  selectedYear: number
  onChange: (month: number, year: number) => void
}

export function MonthSelector({ selectedMonth, selectedYear, onChange }: MonthSelectorProps) {
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ]

  const handlePrev = () => {
    if (selectedMonth === 0) {
      onChange(11, selectedYear - 1)
    } else {
      onChange(selectedMonth - 1, selectedYear)
    }
  }

  const handleNext = () => {
    if (selectedMonth === 11) {
      onChange(0, selectedYear + 1)
    } else {
      onChange(selectedMonth + 1, selectedYear)
    }
  }

  const handleCurrent = () => {
    const now = new Date()
    onChange(now.getMonth(), now.getFullYear())
  }

  return (
    <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl p-2 mb-6 animate-in fade-in slide-in-from-top-1 duration-500">
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrev}
          className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center px-4 min-w-[140px]">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-400 opacity-60" />
            <span className="text-sm font-bold text-white tracking-tight">
              {months[selectedMonth]} {selectedYear}
            </span>
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mt-0.5">Période d'analyse</p>
        </div>

        <button
          onClick={handleNext}
          className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <button
        onClick={handleCurrent}
        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-indigo-300 transition-all border border-indigo-500/10"
      >
        Mois en cours
      </button>
    </div>
  )
}
