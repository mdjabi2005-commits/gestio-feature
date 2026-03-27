import type { LucideIcon } from "lucide-react"

export type InstallmentStatus = "paid" | "pending" | "overdue"
export type InstallmentType = "expense" | "income"
export type PaymentMethod = "automatic" | "manual"
export type SortField = "date" | "amount" | "name" | "status"
export type SortDirection = "asc" | "desc"

export interface Installment {
  id: string
  echeance_base_id?: string | number  // real DB echeance ID (for total spent lookup)
  icon: any
  color: string
  name: string
  category: string
  sous_categorie?: string
  date: string // Display string (ex: "26 mars")
  date_prevue: string // ISO string (ex: "2024-03-26")
  date_debut: string // ISO
  date_fin?: string // ISO
  frequence: string
  description?: string
  daysRemaining: number
  amount: number
  type: InstallmentType
  status: InstallmentStatus
  paymentMethod: PaymentMethod
}

export const statusConfig: Record<InstallmentStatus, { label: string; bg: string; text: string }> = {
  paid:    { label: "Payé",       bg: "bg-emerald-500/15", text: "text-emerald-400" },
  pending: { label: "En attente", bg: "bg-indigo-500/15",  text: "text-indigo-400" },
  overdue: { label: "À vérifier", bg: "bg-amber-500/15",   text: "text-amber-400" },
}
