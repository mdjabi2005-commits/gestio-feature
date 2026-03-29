"use client"

import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, Search, X } from "lucide-react"
import { getCategoryMetadata } from "@/lib/categories"
import { useFinancial } from "@/context/FinancialDataContext"

export interface Transaction {
  id?: number
  type: "depense" | "revenu"
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
  const { searchQuery, setSearchQuery, filterCategories, setFilterCategories, filterDateRange, setFilterDateRange } = useFinancial();
  
  const hasActiveFilters = !!(searchQuery || filterCategories.length > 0 || filterDateRange.start || filterDateRange.end);

  const clearAllFilters = () => {
    setSearchQuery("");
    setFilterCategories([]);
    setFilterDateRange({ start: null, end: null });
  };

  const formatCurrency = (amount: number, type: "depense" | "revenu") => {
    const formatted = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(amount)
    return type === "revenu" ? `+${formatted}` : `-${formatted}`
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
    <div className="h-full flex flex-col min-h-0">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-border/50 gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-foreground">
            Transactions
          </h3>
          {hasActiveFilters && (
            <button 
              onClick={clearAllFilters}
              className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold hover:bg-rose-500/20 transition-colors"
            >
              Effacer les filtres
            </button>
          )}
        </div>

        <div className="relative group max-w-xs w-full">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary/30 border border-border/50 rounded-xl pl-10 pr-10 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
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
              const itemType = transaction.type === "revenu" ? "income" : "expense"
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
