"use client"

import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { getCategoryMetadata } from "@/lib/categories"

export interface Transaction {
  id?: number
  type: "Dépense" | "Revenu"
  description?: string
  montant: number
  categorie: string
  sous_categorie?: string
  date: string
}

interface TransactionTableProps {
  transactions: Transaction[]
  categories?: any[]
}

export function TransactionTable({ transactions, categories = [] }: TransactionTableProps) {
  const formatCurrency = (amount: number, type: "Dépense" | "Revenu") => {
    const formatted = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(amount)
    return type === "Revenu" ? `+${formatted}` : `-${formatted}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:border-indigo-500/30 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <h3 className="text-lg font-semibold text-foreground">
          Transactions Récentes
        </h3>
        <button className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
          Voir tout
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-background/80 backdrop-blur-md z-10">
            <tr className="border-b border-border/50">
              <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Transaction
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Catégorie
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Montant
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {transactions.map((transaction, index) => {
              const itemType = transaction.type === "Revenu" ? "income" : "expense"
              const meta = getCategoryMetadata(categories, transaction.categorie)
              
              return (
              <tr
                key={transaction.id || index}
                className={cn(
                  "group transition-colors duration-200 hover:bg-secondary/30"
                )}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3 text-left">
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg shadow-sm transition-transform duration-200 group-hover:scale-110",
                        itemType === "income"
                          ? "bg-emerald-500/10"
                          : "bg-red-500/10"
                      )}
                    >
                      {itemType === "income" ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate max-w-[150px]">
                        {transaction.description || "Sans description"}
                      </span>
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {transaction.type}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border"
                    style={{ 
                      backgroundColor: `${meta.couleur}15`, 
                      color: meta.couleur,
                      borderColor: `${meta.couleur}30`
                    }}
                  >
                    {transaction.sous_categorie || transaction.categorie}
                  </span>
                </td>
                <td className="px-6 py-4 text-left">
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(transaction.date)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={cn(
                      "text-xs font-bold font-mono",
                      itemType === "income"
                        ? "text-emerald-400"
                        : "text-red-400"
                    )}
                  >
                    {formatCurrency(transaction.montant, transaction.type)}
                  </span>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
