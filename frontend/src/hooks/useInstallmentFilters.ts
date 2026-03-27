"use client"
import { useMemo } from "react"
import { type Installment, type InstallmentStatus, type SortField, type SortDirection } from "@/components/echeances/echeance-types"

export function useInstallmentFilters(
  items: Installment[], 
  search: string, 
  statusF: string[], 
  catF: string[], 
  typeF: string[], 
  sortField: SortField, 
  sortDir: SortDirection, 
  selectedDate: string | null
) {
  return useMemo(() => {
    let r = [...items]
    const ord = { overdue: 0, pending: 1, paid: 2 } as Record<InstallmentStatus, number>
    const now = new Date()
    const currentMonth = now.getMonth(), currentYear = now.getFullYear()

    r = r.filter(i => {
      if (search) {
        const q = search.toLowerCase()
        if (!i.name.toLowerCase().includes(q) && !i.category.toLowerCase().includes(q)) return false
      }
      if (statusF.length && !statusF.includes(i.status)) return false
      if (catF.length && !catF.includes(i.category)) return false
      if (typeF.length && !typeF.includes(i.type)) return false
      return true
    })

    if (selectedDate) {
      r = r.filter(i => i.date_prevue && i.date_prevue.startsWith(selectedDate))
    } else if (!search && !statusF.length && !catF.length && !typeF.length) {
      // Vue par défaut : On affiche tout ce qui est projeté (6 mois passés à 24 mois futurs)
      // mais on peut limiter à "récent" si besoin. Pour l'instant, on montre tout pour répondre à la demande.
      r = r.filter(i => {
        const d = new Date(i.date_prevue)
        const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return d >= sixMonthsAgo;
      })
    }

    r.sort((a, b) => {
      const aDate = new Date(a.date_prevue), bDate = new Date(b.date_prevue)
      let cmp = 0
      if (sortField === "date") cmp = aDate.getTime() - bDate.getTime()
      else if (sortField === "amount") cmp = a.amount - b.amount
      else if (sortField === "name") cmp = a.name.localeCompare(b.name)
      else cmp = ord[a.status] - ord[b.status]
      return sortDir === "asc" ? cmp : -cmp
    })
    return r
  }, [items, search, statusF, catF, typeF, sortField, sortDir, selectedDate])
}
