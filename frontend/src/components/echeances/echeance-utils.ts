import { 
  TrendingUp, TrendingDown, Clock, CheckCircle2, AlertCircle, Calendar, 
  Receipt, type LucideIcon 
} from "lucide-react"
import type { Transaction } from "@/api"
import type { Installment } from "./echeance-types"
import { getCategoryMetadata } from "@/lib/categories"
import { getCategoryIcon } from "@/lib/icons"

/** Transforms a Transaction into an Installment (calcule daysRemaining). */
export function mapTransactionToInstallment(t: Transaction, allCategories: any[] = []): Installment {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const txDate = new Date(t.date)
  const diffMs = txDate.getTime() - today.getTime()
  const daysRemaining = Math.round(diffMs / 86_400_000)

  const catMeta = getCategoryMetadata(allCategories, t.categorie)
  const Icon = getCategoryIcon(catMeta.icone)

  return {
    id: String(t.id ?? crypto.randomUUID()),
    icon: Icon,
    color: catMeta.couleur,
    nom: t.description || t.sous_categorie || t.categorie,
    categorie: t.categorie,
    sous_categorie: t.sous_categorie,
    date: txDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
    date_prevue: t.date,
    date_debut: t.date,
    frequence: t.recurrence || "mensuelle",
    description: t.description,
    daysRemaining,
    montant: t.montant,
    type: t.type,
    statut: daysRemaining < 0 ? "paid" : daysRemaining === 0 ? "overdue" : "pending",
    paymentMethod: "automatic",
  }
}

/** Transforme une échéance API en Installment. */
export function mapEcheanceToInstallment(e: any, allCategories: any[] = []): Installment {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isoDate = e.date_prevue ?? e.date
  const txDate = new Date(isoDate)
  const diffMs = txDate.getTime() - today.getTime()
  const daysRemaining = Math.round(diffMs / 86_400_000)

  const catName = e.categorie || ""
  const catMeta = getCategoryMetadata(allCategories, catName)
  const Icon = getCategoryIcon(catMeta.icone)

  return {
    id: String(e.id),
    echeance_base_id: e.echeance_base_id ?? e.id,
    icon: Icon,
    color: catMeta.couleur,
    nom: e.nom || e.description || catName,
    categorie: catName,
    sous_categorie: e.sous_categorie,
    date: txDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
    date_prevue: isoDate,
    date_debut: e.date_debut || isoDate,
    date_fin: e.date_fin,
    frequence: e.frequence || "mensuelle",
    description: e.description,
    daysRemaining,
    montant: e.montant ?? 0,
    type: e.type,
    statut: e.statut || "pending",
    statut_base: e.statut_base || (e.statut === "paid" && !e.date_prevue ? "inactive" : "active"),
    paymentMethod: e.paymentMethod || "automatic",
  }
}
