import {
  Home, Zap, Wifi, Car, CreditCard, TrendingUp, ShoppingBag,
  Utensils, Briefcase, Receipt, type LucideIcon,
} from "lucide-react"
import type { Transaction } from "@/api"
import type { CategoryType, Installment, InstallmentStatus } from "./echeance-types"

// Category → CategoryType (for color scheme)
const CAT_TYPE: Record<string, CategoryType> = {
  "Logement":           "housing",
  "Énergie":            "energy",
  "Services":           "energy",
  "Salaire":            "income",
  "Revenu":             "income",
  "Bourse":             "income",
  "Investissement":     "income",
  "Voiture":            "vehicle",
  "Uber":               "vehicle",
  "Alimentation":       "subscriptions",
  "Shopping":           "subscriptions",
  "Loisirs":            "subscriptions",
}

// Category → Icon
const CAT_ICON: Record<string, LucideIcon> = {
  "Logement":           Home,
  "Énergie":            Zap,
  "Services":           Wifi,
  "Salaire":            CreditCard,
  "Revenu":             TrendingUp,
  "Bourse":             TrendingUp,
  "Investissement":     TrendingUp,
  "Voiture":            Car,
  "Uber":               Car,
  "Alimentation":       Utensils,
  "Shopping":           ShoppingBag,
  "Travail Animateur":  Briefcase,
}

/** Maps a raw Transaction from the API to an Installment for display. */
export function mapTransactionToInstallment(t: Transaction): Installment {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const txDate = new Date(t.date)
  const diffMs = txDate.getTime() - today.getTime()
  const daysRemaining = Math.round(diffMs / 86_400_000)

  const status: InstallmentStatus = daysRemaining < 0
    ? "paid"
    : daysRemaining === 0
    ? "overdue"
    : "pending"

  const formatted = txDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })

  return {
    id: String(t.id ?? crypto.randomUUID()),
    icon: CAT_ICON[t.categorie] ?? Receipt,
    name: t.description || t.sous_categorie || t.categorie,
    category: t.categorie,
    sous_categorie: t.sous_categorie,
    categoryType: CAT_TYPE[t.categorie] ?? "other",
    date: formatted,
    date_prevue: t.date, // ISO
    date_debut: t.date, // Best guess for past transaction
    frequence: t.recurrence || "mensuelle",
    description: t.description,
    daysRemaining,
    amount: t.montant,
    type: t.type === "Revenu" ? "income" : "expense",
    status,
    paymentMethod: t.source === "manual" ? "manual" : "automatic",
  }
}

/** Maps a raw echeance from dashboard summary OR EcheanceResponse API to an Installment. */
export function mapEcheanceToInstallment(e: any): Installment {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Handle both API response format (date_prevue as ISO) and dashboard format
  const isoDate = e.date_prevue ?? e.date
  const txDate = new Date(isoDate)
  const diffMs = txDate.getTime() - today.getTime()
  const daysRemaining = Math.round(diffMs / 86_400_000)

  // Handle status from both formats
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

  // Handle both French (dashboard) and English (API response) field names
  const catName = e.categorie ?? e.category ?? ""
  const nomName = e.nom ?? e.name ?? e.description ?? catName
  const montant = e.montant ?? e.amount ?? 0
  const typeStr = e.type

  return {
    id: String(e.id),
    icon: CAT_ICON[catName] ?? Receipt,
    name: nomName,
    category: catName,
    sous_categorie: e.sous_categorie || e.categoryType,
    categoryType: CAT_TYPE[catName] ?? "other",
    date: formatted,
    date_prevue: isoDate,
    date_debut: e.date_debut || isoDate,
    date_fin: e.date_fin,
    frequence: e.frequence || "mensuelle",
    description: e.description,
    daysRemaining,
    amount: montant,
    type: typeStr === "Revenu" || typeStr === "income" ? "income" : "expense",
    status,
    paymentMethod: e.paymentMethod || "automatic",
  }
}
