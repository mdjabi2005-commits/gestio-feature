import type { LucideIcon } from "lucide-react"

export type InstallmentStatus = "paid" | "pending" | "overdue"
export type InstallmentType = "depense" | "revenu"
export type PaymentMethod = "automatic" | "manual"
export type SortField = "date" | "montant" | "nom" | "statut"
export type SortDirection = "asc" | "desc"

export interface Installment {
  id: string
  echeance_base_id?: string | number
  icon: any
  color: string
  nom: string
  categorie: string
  sous_categorie?: string
  date: string
  date_prevue: string
  date_debut: string
  date_fin?: string
  frequence: string
  description?: string
  daysRemaining: number
  montant: number
  type: InstallmentType
  statut: InstallmentStatus
  statut_base?: string
  paymentMethod: PaymentMethod
}

export const statusConfig: Record<InstallmentStatus, { label: string; bg: string; text: string }> = {
  paid:    { label: "Payé",       bg: "bg-emerald-500/15", text: "text-emerald-400" },
  pending: { label: "En attente", bg: "bg-indigo-500/15",  text: "text-indigo-400" },
  overdue: { label: "À vérifier", bg: "bg-amber-500/15",   text: "text-amber-400" },
}
