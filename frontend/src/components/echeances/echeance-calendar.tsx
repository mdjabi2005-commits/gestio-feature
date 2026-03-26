"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Installment } from "./echeance-types"

const MONTH_NAMES = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]
const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

interface EcheanceCalendarProps {
  items: Installment[]
  onSelectDate?: (date: string | null) => void
  selectedDate?: string | null
}

export function EcheanceCalendar({ items, onSelectDate, selectedDate }: EcheanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showAll, setShowAll] = useState(false)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let startDay = firstDay.getDay() - 1
  if (startDay < 0) startDay = 6

  const days: (number | null)[] = []
  for (let i = 0; i < startDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  const itemsByDate = useMemo(() => {
    const map: Record<string, Installment[]> = {}
    items.forEach(item => {
      const dateKey = item.date_prevue.slice(0, 10)
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(item)
    })
    return map
  }, [items])

  const prevMonth = () => setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n })
  const nextMonth = () => setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n })

  const selectedDateItems = selectedDate ? itemsByDate[selectedDate] || [] : []
  const displayItems = showAll ? selectedDateItems : selectedDateItems.slice(0, 10)

  const getDayStatus = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const dayItems = itemsByDate[dateStr] || []
    if (dayItems.length === 0) return null
    
    const hasPaid = dayItems.some(i => i.status === "paid")
    const hasOverdue = dayItems.some(i => i.status === "overdue")
    const hasPending = dayItems.some(i => i.status === "pending")
    
    if (hasOverdue) return "overdue"
    if (hasPending) return "pending"
    if (hasPaid) return "paid"
    return "pending"
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-6 bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{MONTH_NAMES[month]} {year}</h3>
          <div className="flex gap-1">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/10"><ChevronLeft className="w-5 h-5 text-white/60" /></button>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/10"><ChevronRight className="w-5 h-5 text-white/60" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEK_DAYS.map((d, i) => (
            <div key={i} className="text-xs font-medium text-white/30 text-center py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const dateStr = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : null
            const status = day ? getDayStatus(day) : null
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            const isSelected = dateStr === selectedDate
            const itemCount = dateStr ? (itemsByDate[dateStr]?.length || 0) : 0
            const dayItems = dateStr ? (itemsByDate[dateStr] || []) : []
            const isHovered = dateStr === hoveredDate && dayItems.length > 0
            
            return (
              <div key={i} className="relative">
                <button
                  disabled={!day}
                  onClick={() => day && onSelectDate?.(isSelected ? null : dateStr)}
                  onMouseEnter={() => day && setHoveredDate(dateStr)}
                  onMouseLeave={() => setHoveredDate(null)}
                  className={cn(
                    "relative w-full aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all",
                    !day && "invisible",
                    isToday && "bg-indigo-500/30 text-white ring-2 ring-indigo-500/50",
                    !isToday && isSelected && "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30",
                    !isToday && !isSelected && "text-white/60 hover:bg-white/10",
                    status === "overdue" && !isToday && "text-rose-400",
                    status === "paid" && !isToday && "text-emerald-400"
                  )}
                >
                  {day}
                  {itemCount > 0 && (
                    <span className={cn(
                      "absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center",
                      status === "overdue" ? "bg-rose-500 text-white" : 
                      status === "paid" ? "bg-emerald-500 text-white" : 
                      "bg-indigo-500 text-white"
                    )}>
                      {itemCount}
                    </span>
                  )}
                </button>
                
                {/* Tooltip on hover */}
                {isHovered && dayItems.length > 0 && (
                  <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 rounded-xl bg-gray-900 border border-white/10 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-white">
                        {new Date(dateStr!).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                      <span className="text-[10px] text-white/40">{dayItems.length} échéance(s)</span>
                    </div>
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                      {dayItems.slice(0, 5).map(item => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              item.status === "paid" ? "bg-emerald-400" :
                              item.status === "overdue" ? "bg-rose-400" : "bg-indigo-400"
                            )} />
                            <span className="text-white/80 truncate max-w-[140px]">{item.name}</span>
                          </div>
                          <span className={cn(
                            "font-medium",
                            item.type === "income" ? "text-emerald-400" : "text-rose-400"
                          )}>
                            {item.type === "income" ? "+" : "-"}{item.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}€
                          </span>
                        </div>
                      ))}
                      {dayItems.length > 5 && (
                        <p className="text-[10px] text-indigo-400 text-center pt-1">
                          +{dayItems.length - 5} autres
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              {new Date(selectedDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </h4>
            <span className="text-xs text-white/40">{selectedDateItems.length} échéance(s)</span>
          </div>
          
          {displayItems.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {displayItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      item.status === "paid" ? "bg-emerald-400" :
                      item.status === "overdue" ? "bg-rose-400" : "bg-indigo-400"
                    )} />
                    <div>
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs text-white/40">{item.category}</p>
                    </div>
                  </div>
                  <p className={cn(
                    "text-sm font-bold",
                    item.type === "income" ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {item.type === "income" ? "+" : "-"}{item.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/40 text-center py-4">Aucune échéance ce jour</p>
          )}

          {selectedDateItems.length > 10 && (
            <button 
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-3 py-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showAll ? "Voir moins" : `Voir les ${selectedDateItems.length - 10} autres échéances`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function getWeekItems(items: Installment[], weekStart: Date): Installment[] {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  
  return items.filter(item => {
    const itemDate = new Date(item.date_prevue)
    return itemDate >= weekStart && itemDate < weekEnd
  })
}
