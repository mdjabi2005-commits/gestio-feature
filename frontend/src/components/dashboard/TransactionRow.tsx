"use client"
import React from 'react'
import { cn } from "@/lib/utils"
import { MoreHorizontal, Pencil, Trash2, Paperclip } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CategoryIcon } from "@/components/ui/CategoryIcon"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { AmountDisplay } from "@/components/ui/AmountDisplay"
import { formatDate, formatTime } from "@/lib/formatters"
import { type TransactionItem } from './transaction-list'

interface TransactionRowProps {
  transaction: TransactionItem;
  index: number;
  isLast: boolean;
  categories: any[];
  onEdit?: (t: TransactionItem) => void;
  onView?: (t: TransactionItem) => void;
  onDelete?: (id: number) => void;
  onAttach?: (id: number) => void;
}

export function TransactionRow({
  transaction,
  index,
  isLast,
  categories,
  onEdit,
  onView,
  onDelete,
  onAttach,
}: TransactionRowProps) {
  const itemType = transaction.type === "Revenu" ? "income" : "expense"

  return (
    <div className={cn("group flex items-center transition-all duration-200 hover:bg-secondary/20", !isLast && "border-b border-border/30")}>
      <div 
        onClick={() => onView?.(transaction)}
        onDoubleClick={() => onEdit?.(transaction)}
        className="flex flex-1 items-center gap-4 px-6 py-4 cursor-pointer active:scale-[0.99] origin-center"
      >
        <CategoryIcon 
          category={transaction.categorie} 
          categories={categories} 
          showTypeIndicator={itemType} 
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground truncate">{transaction.description || "Sans description"}</h4>
            {transaction.status && <StatusBadge status={transaction.status} />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">
              {transaction.sous_categorie || transaction.categorie}
            </span>
            {transaction.merchant && <span className="text-[10px] text-muted-foreground/60 truncate max-w-[150px]">@ {transaction.merchant}</span>}
            {(transaction.has_attachments || transaction.attachment) && (
              <span title={transaction.attachment ? `Archivé : ${transaction.attachment}` : "Document joint"}>
                <Paperclip className={cn("w-3 h-3", transaction.attachment ? "text-blue-400" : "text-indigo-400")} />
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <AmountDisplay amount={transaction.montant} type={transaction.type} />
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-bold tracking-tighter opacity-60">
            {formatDate(transaction.date)}
          </p>
        </div>
      </div>

      <div className="px-6 py-4 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 opacity-0 group-hover:opacity-100 transition-all duration-200 outline-none">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={() => onEdit?.(transaction)}><Pencil className="mr-2 h-4 w-4" /><span>Modifier</span></DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAttach?.(transaction.id!)}><Paperclip className="mr-2 h-4 w-4" /><span>Joindre un fichier</span></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onDelete?.(transaction.id!)} className="text-rose-400 focus:text-rose-400 focus:bg-rose-400/10"><Trash2 className="mr-2 h-4 w-4" /><span>Supprimer</span></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
