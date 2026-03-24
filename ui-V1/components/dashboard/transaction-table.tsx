"use client"

import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react"

export interface Transaction {
  id: string
  type: "income" | "expense"
  description: string
  amount: number
  category: string
  categoryColor: string
  date: string
}

interface TransactionTableProps {
  transactions: Transaction[]
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const formatCurrency = (amount: number, type: "income" | "expense") => {
    const formatted = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(amount)
    return type === "income" ? `+${formatted}` : `-${formatted}`
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
    <div className="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:border-indigo-500/30">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <h3 className="text-lg font-semibold text-foreground">
          Transactions Récentes
        </h3>
        <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
          Voir tout
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Transaction
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Catégorie
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Montant
              </th>
              <th className="px-6 py-4 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => (
              <tr
                key={transaction.id}
                className={cn(
                  "group border-b border-border/30 last:border-0 transition-colors duration-200",
                  "hover:bg-secondary/30"
                )}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-xl transition-transform duration-200 group-hover:scale-110",
                        transaction.type === "income"
                          ? "bg-emerald-500/10"
                          : "bg-red-500/10"
                      )}
                    >
                      {transaction.type === "income" ? (
                        <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {transaction.description}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {transaction.type === "income" ? "Revenu" : "Dépense"}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${transaction.categoryColor}15`,
                      color: transaction.categoryColor,
                      border: `1px solid ${transaction.categoryColor}30`,
                    }}
                  >
                    {transaction.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(transaction.date)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      transaction.type === "income"
                        ? "text-emerald-400"
                        : "text-red-400"
                    )}
                  >
                    {formatCurrency(transaction.amount, transaction.type)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
