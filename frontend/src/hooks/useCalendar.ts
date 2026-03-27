"use client"
import { useState, useMemo } from "react"

export function useCalendar(
  transactions: any[], 
  onRangeSelected?: (range: { start: string | null, end: string | null }) => void, 
  initialRange: { start: string | null, end: string | null } = { start: null, end: null }
) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const transactionMap = useMemo(() => {
    const map = new Map<string, any>()
    transactions.forEach((t) => map.set(t.date, t))
    return map
  }, [transactions])

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear(), month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    let startPadding = firstDay.getDay() - 1
    if (startPadding < 0) startPadding = 6
    
    const days: any[] = []
    for (let i = startPadding - 1; i >= 0; i--) days.push({ date: new Date(year, month, -i), isCurrentMonth: false })
    for (let i = 1; i <= new Date(year, month + 1, 0).getDate(); i++) {
        const d = new Date(year, month, i)
        days.push({ date: d, isCurrentMonth: true, transaction: transactionMap.get(formatLocalDate(d)) })
    }
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    return days
  }, [currentMonth, transactionMap])

  const handleDateClick = (dateStr: string, selectedRange: any) => {
    if (!onRangeSelected) return
    if (!selectedRange.start || (selectedRange.start && selectedRange.end && selectedRange.start !== selectedRange.end)) {
      onRangeSelected({ start: dateStr, end: dateStr })
    } else {
      const start = selectedRange.start; const end = dateStr
      onRangeSelected(new Date(end) < new Date(start) ? { start: end, end: start } : { start, end })
    }
  }

  const isInRange = (dateStr: string, selectedRange: any) => {
    if (!selectedRange.start || !selectedRange.end) return false
    const d = new Date(dateStr).getTime(), s = new Date(selectedRange.start).getTime(), e = new Date(selectedRange.end).getTime()
    return d >= s && d <= e
  }

  return {
    currentMonth, setCurrentMonth, calendarDays,
    goToPrevMonth: () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)),
    goToNextMonth: () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)),
    goToToday: () => setCurrentMonth(new Date()),
    handleDateClick, isInRange, formatLocalDate
  }
}
