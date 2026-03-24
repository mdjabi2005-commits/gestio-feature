"use client"

import { cn } from "@/lib/utils"
import {
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Gamepad2,
  Heart,
  Briefcase,
  TrendingUp,
  MoreHorizontal,
  Search,
  Filter,
} from "lucide-react"

export interface TransactionItem {
  id: string
  type: "income" | "expense"
  description: string
  amount: number
  category: string
  categoryColor: string
  date: string
  status?: "completed" | "pending" | "failed"
  merchant?: string
}

interface TransactionListProps {
  transactions: TransactionItem[]
  title?: string
  onSearch?: (query: string) => void
  onFilter?: () => void
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Alimentation: Utensils,
  Logement: Home,
  Transport: Car,
  Loisirs: Gamepad2,
  Santé: Heart,
  Salaire: Briefcase,
  Freelance: Briefcase,
  Investissement: TrendingUp,
  Autre: ShoppingCart,
}

export function TransactionList({
  transactions,
  title = "Transactions",
  onSearch,
  onFilter,
}: TransactionListProps) {
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
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hier"
    }

    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
    }).format(date)
  }

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString))
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            En attente
          </span>
        )
      case "failed":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Échoué
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:border-indigo-500/30 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-9 pr-4 py-1.5 w-48 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
          {/* Filter */}
          <button
            onClick={onFilter}
            className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto">
        {transactions.map((transaction, index) => {
          const IconComponent = categoryIcons[transaction.category] || ShoppingCart

          return (
            <div
              key={transaction.id}
              className={cn(
                "group flex items-center gap-4 px-6 py-4 transition-all duration-200",
                "hover:bg-secondary/30 cursor-pointer",
                index !== transactions.length - 1 && "border-b border-border/30"
              )}
            >
              {/* Category Avatar */}
              <div
                className="relative shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{ backgroundColor: `${transaction.categoryColor}15` }}
              >
                <IconComponent
                  className="w-5 h-5"
                  style={{ color: transaction.categoryColor }}
                />
                {/* Type indicator */}
                <div
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card flex items-center justify-center text-[8px] font-bold",
                    transaction.type === "income"
                      ? "bg-emerald-500 text-emerald-950"
                      : "bg-rose-500 text-rose-950"
                  )}
                >
                  {transaction.type === "income" ? "+" : "-"}
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground truncate">
                    {transaction.description}
                  </h4>
                  {getStatusBadge(transaction.status)}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-xs px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: `${transaction.categoryColor}10`,
                      color: transaction.categoryColor,
                    }}
                  >
                    {transaction.category}
                  </span>
                  {transaction.merchant && (
                    <span className="text-xs text-muted-foreground">
                      {transaction.merchant}
                    </span>
                  )}
                </div>
              </div>

              {/* Amount & Date */}
              <div className="text-right shrink-0">
                <p
                  className={cn(
                    "text-sm font-bold",
                    transaction.type === "income"
                      ? "text-emerald-400"
                      : "text-rose-400"
                  )}
                >
                  {formatCurrency(transaction.amount, transaction.type)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(transaction.date)} · {formatTime(transaction.date)}
                </p>
              </div>

              {/* Actions */}
              <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border/50 bg-secondary/20">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {transactions.length} transactions
          </span>
          <button className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            Voir tout
          </button>
        </div>
      </div>
    </div>
  )
}
