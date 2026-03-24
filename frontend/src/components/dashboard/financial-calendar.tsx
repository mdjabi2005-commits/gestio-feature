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
  onDateSelect?: (date: string) => void
  selectedDate?: string | null
}

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
]

export function FinancialCalendar({
  transactions,
  onDateSelect,
  selectedDate,
}: FinancialCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

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
    
    // Adjust for Monday start (0 = Monday in our display)
    let startPadding = firstDay.getDay() - 1
    if (startPadding < 0) startPadding = 6
    
    const days: Array<{
      date: Date
      isCurrentMonth: boolean
      transaction?: TransactionDay
    }> = []

    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({ date, isCurrentMonth: false })
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      const dateStr = date.toISOString().split("T")[0]
      days.push({
        date,
        isCurrentMonth: true,
        transaction: transactionMap.get(dateStr),
      })
    }

    // Next month padding
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i)
      days.push({ date, isCurrentMonth: false })
    }

    return days
  }, [currentMonth, transactionMap])

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  return (
    <div className="glass-card rounded-2xl p-6 transition-all duration-300 hover:border-indigo-500/30 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-lg font-semibold text-foreground">
          Calendrier Financier
        </h3>
        <button
          onClick={goToToday}
          className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {"Aujourd'hui"}
        </button>
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

      {/* Calendar Grid - FLEX TO FILL */}
      <div className="grid grid-cols-7 gap-1 flex-1 min-h-0">
        {calendarDays.map((day, index) => {
          const dateStr = day.date.toISOString().split("T")[0]
          const hasIncome = day.transaction && day.transaction.revenus > 0
          const hasExpense = day.transaction && day.transaction.depenses > 0
          const isSelected = selectedDate === dateStr

          return (
            <button
              key={index}
              onClick={() =>
                day.isCurrentMonth && onDateSelect && onDateSelect(dateStr)
              }
              disabled={!day.isCurrentMonth}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all duration-200 h-full min-h-[40px]",
                day.isCurrentMonth
                  ? "text-foreground hover:bg-secondary/50"
                  : "text-muted-foreground/40 cursor-default",
                isToday(day.date) && "ring-1 ring-indigo-500/50 bg-indigo-500/10",
                isSelected && "bg-indigo-500/20 ring-1 ring-indigo-500"
              )}
            >
              <span>{day.date.getDate()}</span>
              {/* Transaction indicators */}
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
