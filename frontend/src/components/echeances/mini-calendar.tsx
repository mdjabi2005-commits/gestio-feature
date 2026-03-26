"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const MONTH_NAMES = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]

export function MiniCalendar({ deadlineDates = [] }: { deadlineDates?: number[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let startDay = firstDay.getDay() - 1
  if (startDay < 0) startDay = 6

  const days: (number | null)[] = []
  for (let i = 0; i < startDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const today = new Date().getDate()
  const prevMonth = () => setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n })
  const nextMonth = () => setCurrentDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n })

  return (
    <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.06]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{MONTH_NAMES[month]} {year}</h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-white/10"><ChevronLeft className="w-4 h-4 text-white/40" /></button>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-white/10"><ChevronRight className="w-4 h-4 text-white/40" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {["L","M","M","J","V","S","D"].map((d, i) => (
          <div key={i} className="text-[9px] font-medium text-white/30 text-center py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          const hasDeadline = day && deadlineDates.includes(day)
          const isToday = day === today
          const isPast = day !== null && day < today
          return (
            <div key={i} className={cn(
              "relative aspect-square flex items-center justify-center rounded text-[10px] font-medium",
              day === null && "invisible",
              isToday && "bg-indigo-500/30 text-white",
              !isToday && isPast && "text-white/20",
              !isToday && !isPast && "text-white/50"
            )}>
              {day}
              {hasDeadline && <span className={cn("absolute bottom-0.5 w-1 h-1 rounded-full", isPast ? "bg-rose-400/60" : "bg-emerald-400")} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
