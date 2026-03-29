"use client"
import React, { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Installment } from "./echeance-types"
import { useCalendar } from "@/hooks/useCalendar"
import { EcheanceDetails } from "./EcheanceDetails"

const MONTH_NAMES = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]
const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

interface EcheanceCalendarProps {
  items: Installment[]
  onSelectDate?: (date: string | null) => void
  selectedDate?: string | null
}

export function EcheanceCalendar({ items, onSelectDate, selectedDate }: EcheanceCalendarProps) {
  const { currentMonth, calendarDays, goToPrevMonth, goToNextMonth, formatLocalDate } = useCalendar(items, undefined)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  const itemsByDate = useMemo(() => {
    const map: Record<string, Installment[]> = {}
    items.forEach(item => {
      const dateKey = item.date_prevue.slice(0, 10)
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(item)
    })
    return map
  }, [items])

  const getDayStatus = (dateStr: string) => {
    const dayItems = itemsByDate[dateStr] || []
    if (dayItems.length === 0) return null
    if (dayItems.some(i => i.statut === "overdue")) return "overdue"
    if (dayItems.some(i => i.statut === "pending")) return "pending"
    return "paid"
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-4 select-none">
      <div className="rounded-2xl p-6 bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
          <div className="flex gap-1">
            <button onClick={goToPrevMonth} className="p-2 rounded-lg hover:bg-white/10"><ChevronLeft className="w-5 h-5 text-white/60" /></button>
            <button onClick={goToNextMonth} className="p-2 rounded-lg hover:bg-white/10"><ChevronRight className="w-5 h-5 text-white/60" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEK_DAYS.map((d, i) => <div key={i} className="text-xs font-medium text-white/30 text-center py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day: any, i: number) => {
            const dateStr = formatLocalDate(day.date)
            const status = getDayStatus(dateStr)
            const isToday = dateStr === todayStr
            const itemCount = itemsByDate[dateStr]?.length || 0
            const dayItems = itemsByDate[dateStr] || []
            
            return (
              <div key={i} className="relative">
                <button
                  disabled={!day.isCurrentMonth}
                  onClick={() => onSelectDate?.(dateStr === selectedDate ? null : dateStr)}
                  onMouseEnter={() => setHoveredDate(dateStr)} onMouseLeave={() => setHoveredDate(null)}
                  className={cn(
                    "relative w-full aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all",
                    !day.isCurrentMonth && "opacity-10 pointer-events-none",
                    isToday && "bg-indigo-500/30 text-white ring-2 ring-indigo-500/50",
                    dateStr === selectedDate && !isToday && "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30",
                    dateStr !== selectedDate && !isToday && "text-white/60 hover:bg-white/10",
                    status === "overdue" && !isToday && "text-rose-400 font-bold",
                    status === "paid" && !isToday && "text-emerald-400"
                  )}
                >
                  {day.date.getDate()}
                  {itemCount > 0 && (
                    <span className={cn(
                      "absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center shadow-lg",
                      status === "overdue" ? "bg-rose-500" : status === "paid" ? "bg-emerald-500" : "bg-indigo-500"
                    )}>{itemCount}</span>
                  )}
                </button>
                
                {hoveredDate === dateStr && dayItems.length > 0 && (
                  <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 rounded-xl bg-slate-900 border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
                    <p className="text-[10px] font-black text-white/40 mb-2 uppercase tracking-widest">{new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {dayItems.length} ÉCHÉANCE(S)</p>
                    {dayItems.slice(0, 5).map(item => (
                      <div key={item.id} className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-white/80 truncate max-w-[150px]">{item.nom}</span>
                        <span className={item.type === "revenu" ? "text-emerald-400" : "text-rose-400"}>{item.montant.toLocaleString()}€</span>
                      </div>
                    ))}
                    {dayItems.length > 5 && <p className="text-[9px] text-indigo-400 text-center mt-1">+{dayItems.length - 5} AUTRES</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {selectedDate && <EcheanceDetails selectedDate={selectedDate} items={itemsByDate[selectedDate] || []} />}
    </div>
  )
}
