import type { LucideIcon } from "lucide-react"

export type InstallmentStatus = "paid" | "pending" | "overdue"
export type InstallmentType = "expense" | "income"
export type PaymentMethod = "automatic" | "manual"
export type CategoryType = "housing" | "energy" | "subscriptions" | "vehicle" | "income" | "other"
export type SortField = "date" | "amount" | "name" | "status"
export type SortDirection = "asc" | "desc"

export interface Installment {
  id: string
  icon: LucideIcon
  name: string
  category: string
  sous_categorie?: string
  categoryType: CategoryType
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

export const categoryColors: Record<CategoryType, { bg: string; icon: string; label: string }> = {
  housing:       { bg: "bg-pink-500/15",   icon: "text-pink-400",   label: "Logement" },
  energy:        { bg: "bg-sky-500/15",    icon: "text-sky-400",    label: "Énergie" },
  subscriptions: { bg: "bg-violet-500/15", icon: "text-violet-400", label: "Abonnements" },
  vehicle:       { bg: "bg-amber-500/15",  icon: "text-amber-400",  label: "Véhicule" },
  income:        { bg: "bg-emerald-500/15",icon: "text-emerald-400",label: "Revenus" },
  other:         { bg: "bg-zinc-500/15",   icon: "text-zinc-400",   label: "Autre" },
}

export const statusConfig: Record<InstallmentStatus, { label: string; bg: string; text: string }> = {
  paid:    { label: "Payé",       bg: "bg-emerald-500/15", text: "text-emerald-400" },
  pending: { label: "En attente", bg: "bg-indigo-500/15",  text: "text-indigo-400" },
  overdue: { label: "À vérifier", bg: "bg-amber-500/15",   text: "text-amber-400" },
}
