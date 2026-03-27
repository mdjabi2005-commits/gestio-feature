"use client"
import React, { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { TransactionRow } from "./TransactionRow"

export interface TransactionItem {
  id?: number
  type: "Dépense" | "Revenu"
  description?: string
  montant: number
  categorie: string
  sous_categorie?: string
  date: string
  status?: "completed" | "pending" | "failed"
  merchant?: string
  has_attachments?: boolean
  attachment?: string
}

interface TransactionListProps {
  transactions: TransactionItem[]
  categories?: any[]
  title?: string
  onEdit?: (transaction: TransactionItem) => void
  onView?: (transaction: TransactionItem) => void
  onDelete?: (id: number) => void
  onAttach?: (id: number) => void
}

export function TransactionList({
  transactions,
  categories = [],
  title = "Transactions",
  onEdit,
  onView,
  onDelete,
  onAttach,
}: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const displayedTransactions = useMemo(() => {
    if (!searchQuery) return transactions
    const q = searchQuery.toLowerCase()
    return transactions.filter(t => 
      t.description?.toLowerCase().includes(q) ||
      t.categorie.toLowerCase().includes(q) ||
      t.merchant?.toLowerCase().includes(q) ||
      t.sous_categorie?.toLowerCase().includes(q)
    )
  }, [transactions, searchQuery])

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
        <h3 className="text-lg font-semibold text-foreground truncate">{title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-48 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {displayedTransactions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
            Aucune transaction trouvée.
          </div>
        ) : (
          displayedTransactions.map((transaction, index) => (
            <TransactionRow 
              key={transaction.id || index}
              transaction={transaction}
              index={index}
              isLast={index === displayedTransactions.length - 1}
              categories={categories}
              onEdit={onEdit}
              onView={onView}
              onDelete={onDelete}
              onAttach={onAttach}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border/50 bg-secondary/10 shrink-0">
        <span className="text-xs font-medium text-muted-foreground">
           {displayedTransactions.length} transaction{displayedTransactions.length > 1 ? 's' : ''} {searchQuery ? "trouvée(s)" : ""}
        </span>
      </div>
    </div>
  )
}
