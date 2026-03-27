"use client"
import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCalendar } from "@/hooks/useCalendar"

interface TransactionDay {
  date: string
  revenus: number
  depenses: number
}

interface FinancialCalendarProps {
  transactions: TransactionDay[]
  onRangeSelect?: (range: { start: string | null, end: string | null }) => void
  selectedRange?: { start: string | null, end: string | null }
}

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]

export function FinancialCalendar({
  transactions,
  onRangeSelect,
  selectedRange = { start: null, end: null },
}: FinancialCalendarProps) {
  const { 
    currentMonth, calendarDays, goToPrevMonth, goToNextMonth, goToToday, 
    handleDateClick, isInRange, formatLocalDate 
  } = useCalendar(transactions, onRangeSelect, selectedRange)

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
  }

  return (
    <div className="h-full flex flex-col select-none overflow-hidden">
      <div className="flex items-center justify-between mb-1 shrink-0">
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest opacity-60">Calendrier Financier</h3>
        <div className="flex gap-4">
          {(selectedRange.start || selectedRange.end) && (
            <button onClick={() => onRangeSelect?.({ start: null, end: null })} className="text-[10px] font-black text-rose-400 hover:text-rose-300 uppercase tracking-tighter transition-colors">Effacer</button>
          )}
          <button onClick={goToToday} className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-tighter transition-colors">{"Aujourd'hui"}</button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2 shrink-0 bg-secondary/20 p-1 rounded-xl border border-white/5">
        <button onClick={goToPrevMonth} className="p-1 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-[11px] font-black text-foreground uppercase tracking-widest">{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
        <button onClick={goToNextMonth} className="p-1 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all"><ChevronRight className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1 shrink-0">
        {DAYS.map((day) => <div key={day} className="text-center text-[10px] font-black text-muted-foreground py-0.5 uppercase opacity-40">{day}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-0.5 flex-1 min-h-0">
        {calendarDays.map((day: any, index: number) => {
          const dateStr = formatLocalDate(day.date)
          const isSelected = selectedRange.start === dateStr || selectedRange.end === dateStr
          const inRange = isInRange(dateStr, selectedRange)
          return (
            <button
              key={index}
              onClick={() => day.isCurrentMonth && handleDateClick(dateStr, selectedRange)}
              disabled={!day.isCurrentMonth}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-all duration-300 grow min-h-0 aspect-square",
                day.isCurrentMonth ? "text-foreground hover:bg-secondary/50" : "text-muted-foreground/10 cursor-default",
                isToday(day.date) && "ring-1 ring-indigo-500/50 bg-indigo-500/10",
                isSelected && "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 z-10",
                !isSelected && inRange && "bg-indigo-500/20 text-indigo-400"
              )}
            >
              <span className="relative z-10">{day.date.getDate()}</span>
              {day.isCurrentMonth && (day.transaction?.revenus > 0 || day.transaction?.depenses > 0) && (
                <div className="flex gap-0.5 mt-0.5 relative z-10">
                  {day.transaction?.revenus > 0 && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
                  {day.transaction?.depenses > 0 && <div className="w-1 h-1 rounded-full bg-rose-500" />}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-auto pt-1 border-t border-border/50 shrink-0">
        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Revenus</span></div>
        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /><span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Dépenses</span></div>
      </div>
    </div>
  )
}
