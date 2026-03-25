"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

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
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
]

export function FinancialCalendar({
  transactions,
  onRangeSelect,
  selectedRange = { start: null, end: null },
}: FinancialCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const transactionMap = useMemo(() => {
    const map = new Map<string, TransactionDay>()
    transactions.forEach((t) => map.set(t.date, t))
    return map
  }, [transactions])

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    let startPadding = firstDay.getDay() - 1
    if (startPadding < 0) startPadding = 6
    
    const days: Array<{
      date: Date
      isCurrentMonth: boolean
      transaction?: TransactionDay
    }> = []

    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({ date, isCurrentMonth: false })
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      const dateStr = formatLocalDate(date)
      days.push({
        date,
        isCurrentMonth: true,
        transaction: transactionMap.get(dateStr),
      })
    }

    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i)
      days.push({ date, isCurrentMonth: false })
    }

    return days
  }, [currentMonth, transactionMap])

  const handleDateClick = (dateStr: string) => {
    if (!onRangeSelect) return;

    if (!selectedRange.start || (selectedRange.start && selectedRange.end && selectedRange.start !== selectedRange.end)) {
      // Start new selection
      onRangeSelect({ start: dateStr, end: dateStr });
    } else {
      // Complete selection
      const start = selectedRange.start;
      const end = dateStr;
      
      if (new Date(end) < new Date(start)) {
        onRangeSelect({ start: end, end: start });
      } else {
        onRangeSelect({ start, end });
      }
    }
  };

  const isInRange = (dateStr: string) => {
    if (!selectedRange.start || !selectedRange.end) return false;
    const d = new Date(dateStr).getTime();
    const s = new Date(selectedRange.start).getTime();
    const e = new Date(selectedRange.end).getTime();
    return d >= s && d <= e;
  };

  const goToPrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const goToNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  const goToToday = () => setCurrentMonth(new Date());

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-lg font-semibold text-foreground">
          Calendrier Financier
        </h3>
        <div className="flex gap-4">
          {(selectedRange.start || selectedRange.end) && (
            <button
              onClick={() => onRangeSelect?.({ start: null, end: null })}
              className="text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors"
            >
              Effacer
            </button>
          )}
          <button
            onClick={goToToday}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {"Aujourd'hui"}
          </button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <button
          onClick={goToPrevMonth}
          className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-foreground">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button
          onClick={goToNextMonth}
          className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-2 shrink-0">
        {DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const dateStr = formatLocalDate(day.date)
          const hasIncome = day.transaction && day.transaction.revenus > 0
          const hasExpense = day.transaction && day.transaction.depenses > 0
          const isStart = selectedRange.start === dateStr
          const isEnd = selectedRange.end === dateStr
          const isSelected = isStart || isEnd
          const inRange = isInRange(dateStr)

          return (
            <button
              key={index}
              onClick={() => day.isCurrentMonth && handleDateClick(dateStr)}
              disabled={!day.isCurrentMonth}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all duration-200 aspect-square",
                day.isCurrentMonth
                  ? "text-foreground hover:bg-secondary/50"
                  : "text-muted-foreground/40 cursor-default",
                isToday(day.date) && "ring-1 ring-indigo-500/50 bg-indigo-500/10",
                isStart && "bg-rose-500/60 text-white shadow-lg shadow-rose-500/20 z-10",
                isEnd && !isStart && "bg-emerald-500/60 text-white shadow-lg shadow-emerald-500/20 z-10",
                !isSelected && inRange && "bg-indigo-500/10"
              )}
            >
              <span>{day.date.getDate()}</span>
              {day.isCurrentMonth && (hasIncome || hasExpense) && (
                <div className="flex gap-0.5 mt-0.5">
                  {hasIncome && (
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500" />
                  )}
                  {hasExpense && (
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-rose-500" />
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-muted-foreground">Revenus</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-xs text-muted-foreground">Dépenses</span>
        </div>
      </div>
    </div>
  )
}
