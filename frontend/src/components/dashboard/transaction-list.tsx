import { cn } from "@/lib/utils"
import { Search, Filter, MoreHorizontal, Pencil, Trash2, Paperclip } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCategoryIcon } from "@/lib/icons"
import { getCategoryMetadata } from "@/lib/categories"

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
}

interface TransactionListProps {
  transactions: TransactionItem[]
  categories?: any[]
  title?: string
  onSearch?: (query: string) => void
  onFilter?: () => void
  onEdit?: (transaction: TransactionItem) => void
  onView?: (transaction: TransactionItem) => void
  onDelete?: (id: number) => void
  onAttach?: (id: number) => void
}

export function TransactionList({
  transactions,
  categories = [],
  title = "Transactions",
  onSearch,
  onFilter,
  onEdit,
  onView,
  onDelete,
  onAttach,
}: TransactionListProps) {
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
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {transactions.map((transaction, index) => {
          const itemType = transaction.type === "Revenu" ? "income" : "expense"
          const meta = getCategoryMetadata(categories, transaction.categorie)
          const IconComponent = getCategoryIcon(meta.icone)

          return (
            <div
              key={transaction.id || index}
              onClick={() => onView?.(transaction)}
              onDoubleClick={() => onEdit?.(transaction)}
              title="Clic pour voir · Double-clic pour modifier"
              className={cn(
                "group flex items-center gap-4 px-6 py-4 transition-all duration-200",
                "hover:bg-secondary/30 cursor-pointer active:scale-[0.99] origin-center",
                index !== transactions.length - 1 && "border-b border-border/30"
              )}
            >
              {/* Category Avatar */}
              <div
                className="relative shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{ backgroundColor: `${meta.couleur}15` }}
              >
                <div style={{ color: meta.couleur }}>
                  <IconComponent className="w-5 h-5" />
                </div>
                {/* Type indicator */}
                <div
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center text-[8px] font-bold shadow-sm",
                    itemType === "income"
                      ? "bg-emerald-500 text-white"
                      : "bg-rose-500 text-white"
                  )}
                >
                  {itemType === "income" ? "+" : "-"}
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground truncate">
                    {transaction.description || "Sans description"}
                  </h4>
                  {getStatusBadge(transaction.status)}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                    style={{ backgroundColor: `${meta.couleur}15`, color: meta.couleur }}
                  >
                    {transaction.sous_categorie || transaction.categorie}
                  </span>
                  {transaction.merchant && (
                    <span className="text-[10px] text-muted-foreground truncate max-w-[150px] sm:max-w-[200px]">
                      {transaction.merchant}
                    </span>
                  )}
                  {transaction.has_attachments && (
                    <Paperclip className="w-3 h-3 text-indigo-400" />
                  )}
                </div>
              </div>

              {/* Amount & Date */}
              <div className="text-right shrink-0">
                <p
                  className={cn(
                    "text-sm font-bold",
                    itemType === "income"
                      ? "text-emerald-400"
                      : "text-rose-400"
                  )}
                >
                  {formatCurrency(transaction.montant, transaction.type)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatDate(transaction.date)} · {formatTime(transaction.date)}
                </p>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 opacity-0 group-hover:opacity-100 transition-all duration-200 focus-visible:opacity-100 outline-none"
                    title="Actions"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(transaction); }}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Modifier</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAttach?.(transaction.id!); }}>
                    <Paperclip className="mr-2 h-4 w-4" />
                    <span>Joindre un fichier</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onDelete?.(transaction.id!); }}
                    className="text-rose-400 focus:text-rose-400 focus:bg-rose-400/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Supprimer</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border/50 bg-secondary/10">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {transactions.length} transactions
          </span>
          <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            Voir tout
          </button>
        </div>
      </div>
    </div>
  )
}
