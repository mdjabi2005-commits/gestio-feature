import { 
  TrendingUp, TrendingDown, Clock, CheckCircle2, AlertCircle, Calendar, 
  Receipt, type LucideIcon 
} from "lucide-react"
import type { Transaction } from "@/api"
import type { Installment, InstallmentStatus } from "./echeance-types"
import { getCategoryMetadata } from "@/lib/categories"
import { getCategoryIcon } from "@/lib/icons"

/** Maps a raw Transaction from the API to an Installment for display. */
export function mapTransactionToInstallment(t: Transaction, allCategories: any[] = []): Installment {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const txDate = new Date(t.date)
  const diffMs = txDate.getTime() - today.getTime()
  const daysRemaining = Math.round(diffMs / 86_400_000)

  const catMeta = getCategoryMetadata(allCategories, t.categorie)
  const Icon = getCategoryIcon(catMeta.icone)

  const status: InstallmentStatus = daysRemaining < 0 ? "paid" : daysRemaining === 0 ? "overdue" : "pending"
  const formatted = txDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })

  return {
    id: String(t.id ?? crypto.randomUUID()),
    icon: Icon,
    color: catMeta.couleur,
    name: t.description || t.sous_categorie || t.categorie,
    category: t.categorie,
    sous_categorie: t.sous_categorie,
    date: formatted,
    date_prevue: t.date,
    date_debut: t.date,
    frequence: t.recurrence || "mensuelle",
    description: t.description,
    daysRemaining,
    amount: t.montant,
    type: t.type === "revenu" ? "income" : "expense",
    status,
    paymentMethod: t.source === "manual" ? "manual" : "automatic",
  }
}

/** Maps a raw echeance from dashboard summary OR EcheanceResponse API to an Installment. */
export function mapEcheanceToInstallment(e: any, allCategories: any[] = []): Installment {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isoDate = e.date_prevue ?? e.date
  const txDate = new Date(isoDate)
  const diffMs = txDate.getTime() - today.getTime()
  const daysRemaining = Math.round(diffMs / 86_400_000)

  const rawStatus = e.status ?? e.statut
  let status: InstallmentStatus
  if (rawStatus === "active") {
    status = daysRemaining < 0 ? "overdue" : "pending"
  } else if (rawStatus === "paid" || rawStatus === "overdue" || rawStatus === "pending") {
    status = rawStatus
  } else {
    status = "paid"
  }

  const formatted = txDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
  const catName = e.categorie ?? e.category ?? ""
  
  const catMeta = getCategoryMetadata(allCategories, catName)
  const Icon = getCategoryIcon(catMeta.icone)

  return {
    id: String(e.id),
    echeance_base_id: e.echeance_base_id ?? e.id,
    icon: Icon,
    color: catMeta.couleur,
    name: e.nom ?? e.name ?? e.description ?? catName,
    category: catName,
    sous_categorie: e.sous_categorie || e.categoryType,
    date: formatted,
    date_prevue: isoDate,
    date_debut: e.date_debut || isoDate,
    date_fin: e.date_fin,
    frequence: e.frequence || "mensuelle",
    description: e.description,
    daysRemaining,
    amount: e.montant ?? e.amount ?? 0,
    type: e.type === "revenu" || e.type === "income" ? "income" : "expense",
    status,
    paymentMethod: e.paymentMethod || "automatic",
  }
}
