"use client"
import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCalendar } from "@/hooks/useCalendar"

interface TransactionDay {
  date: string
  revenus: number
  depenses: number
  items?: string[]
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
    <div className="h-full flex flex-col select-none pb-2">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em] opacity-30">Calendrier</h3>
        <div className="flex gap-4">
          {(selectedRange.start || selectedRange.end) && (
            <button onClick={() => onRangeSelect?.({ start: null, end: null })} className="text-[10px] font-black text-rose-400 hover:text-rose-300 uppercase tracking-tighter transition-colors">Effacer</button>
          )}
          <button onClick={goToToday} className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-tighter transition-colors">{"Aujourd'hui"}</button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 shrink-0 bg-white/[0.03] p-1 rounded-xl border border-white/5">
        <button onClick={goToPrevMonth} className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-[11px] font-black text-foreground uppercase tracking-widest">{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
        <button onClick={goToNextMonth} className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"><ChevronRight className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 shrink-0">
        {DAYS.map((day) => <div key={day} className="text-center text-[9px] font-black text-white/20 py-0.5 uppercase tracking-tighter">{day}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1 min-h-0 place-items-center">
        {calendarDays.map((day: any, index: number) => {
          const dateStr = formatLocalDate(day.date)
          const isSelected = selectedRange.start === dateStr || selectedRange.end === dateStr
          const inRange = isInRange(dateStr, selectedRange)
          const items = day.transaction?.items || []
          
          const colIndex = index % 7;
          const tooltipClasses = cn(
            "absolute bottom-[calc(100%+8px)] mb-0 w-56 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl opacity-0 pointer-events-none group-hover/day:opacity-100 group-hover/day:translate-y-0 translate-y-2 transition-all z-50",
            colIndex < 2 ? "left-0 translate-x-0" : 
            colIndex > 4 ? "left-auto right-0 translate-x-0" : 
            "left-1/2 -translate-x-1/2"
          );

          const arrowClasses = cn(
            "absolute top-full w-2 h-2 bg-gray-900 border-r border-b border-white/10 rotate-45 -mt-1",
            colIndex < 2 ? "left-4" : 
            colIndex > 4 ? "right-4" : 
            "left-1/2 -translate-x-1/2"
          );
          
          return (
            <div key={index} className="w-full h-full flex justify-center py-0.5 relative group/day">
              <button
                onClick={() => day.isCurrentMonth && handleDateClick(dateStr, selectedRange)}
                disabled={!day.isCurrentMonth}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-lg w-full h-full text-sm font-black transition-all duration-300",
                  day.isCurrentMonth ? "text-foreground hover:bg-white/5" : "text-white/5 cursor-default",
                  isToday(day.date) && "ring-1 ring-indigo-500/50 bg-indigo-500/10",
                  isSelected && "bg-indigo-500 text-white shadow-xl shadow-indigo-500/30 z-10",
                  !isSelected && inRange && "bg-indigo-500/20 text-indigo-400"
                )}
              >
                <span className={cn(
                  "relative z-10",
                  isSelected ? "text-white scale-110" : "group-hover/day:scale-110 transition-transform"
                )}>
                  {day.date.getDate()}
                </span>
                
                {day.isCurrentMonth && (day.transaction?.revenus > 0 || day.transaction?.depenses > 0) && (
                  <div className="flex gap-0.5 mt-0.5 relative z-10">
                    {day.transaction?.revenus > 0 && <div className={cn("w-1 h-1 rounded-full", isSelected ? "bg-white" : "bg-emerald-500")} />}
                    {day.transaction?.depenses > 0 && <div className={cn("w-1 h-1 rounded-full", isSelected ? "bg-white/70" : "bg-rose-500")} />}
                  </div>
                )}
              </button>

              {/* Hover Details Tooltip */}
              {day.isCurrentMonth && items.length > 0 && (
                <div className={tooltipClasses}>
                  <div className={arrowClasses} />
                  <div className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2 border-b border-white/5 pb-1 relative z-10">
                    Transactions du {day.date.getDate()} {MONTHS[day.date.getMonth()]}
                  </div>
                  <div className="space-y-1.5 relative z-10">
                    {items.slice(0, 5).map((item: string, i: number) => (
                      <div key={i} className="text-[10px] font-bold text-white/90 flex items-center gap-2 truncate">
                        <div className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                        {item}
                      </div>
                    ))}
                    {items.length > 5 && (
                      <div className="text-[8px] font-black text-indigo-400 tracking-widest pt-1 italic opacity-60">
                        + {items.length - 5} AUTRES
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-6 mt-auto pt-4 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-1.5 opacity-60">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Revenus</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-60">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Dépenses</span>
        </div>
      </div>
    </div>
  )
}
