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
import { AmountDisplay } from "@/components/ui/AmountDisplay"
import { formatDate } from "@/lib/formatters"
import { Checkbox } from "@/components/ui/checkbox"

interface TransactionRowViewProps {
  transaction: {
    id?: number
    type: "depense" | "revenu"
    description?: string
    montant: number
    categorie: string
    sous_categorie?: string
    date: string
    merchant?: string
  }
  categories: any[]
  isSelected: boolean
  isLast: boolean
  onSelect: (id: number, selected: boolean) => void
  onView: (t: any) => void
  onEdit: (t: any) => void
  onDelete: (id: number) => void
  onAttach: (id: number) => void
}

export function TransactionRowView({
  transaction,
  categories,
  isSelected,
  isLast,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onAttach,
}: TransactionRowViewProps) {
  return (
    <div className={cn(
      "group flex items-center transition-all duration-200 hover:bg-secondary/20", 
      !isLast && "border-b border-border/30",
      isSelected && "bg-indigo-500/5 border-l-2 border-l-indigo-500"
    )}>
      <div className="pl-6 py-4 shrink-0">
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={(val) => onSelect(transaction.id!, !!val)}
          className="border-white/10 data-[state=checked]:bg-indigo-500"
        />
      </div>

      <div 
        onClick={() => onView(transaction)}
        onDoubleClick={() => onEdit(transaction)}
        className="flex flex-1 items-center gap-4 pr-6 pl-2 py-4 cursor-pointer active:scale-[0.99] origin-center"
      >
        <CategoryIcon 
          category={transaction.categorie} 
          categories={categories} 
          showTypeIndicator={transaction.type === "revenu" ? "income" : "expense"} 
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground truncate">{transaction.description || "Sans description"}</h4>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">
              {transaction.sous_categorie || transaction.categorie}
            </span>
            {transaction.merchant && (
              <span className="text-[10px] text-muted-foreground/60 truncate max-w-[150px]">
                @ {transaction.merchant}
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
        <RowActions
          transaction={transaction}
          onEdit={onEdit}
          onAttach={onAttach}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}

function RowActions({
  transaction,
  onEdit,
  onAttach,
  onDelete,
}: {
  transaction: any
  onEdit: (t: any) => void
  onAttach: (id: number) => void
  onDelete: (id: number) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 opacity-0 group-hover:opacity-100 transition-all duration-200 outline-none">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => onEdit(transaction)}>
          <Pencil className="mr-2 h-4 w-4" /><span>Modifier</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAttach(transaction.id!)}>
          <Paperclip className="mr-2 h-4 w-4" /><span>Joindre un fichier</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onSelect={() => onDelete(transaction.id!)} 
          className="text-rose-400 focus:text-rose-400 focus:bg-rose-400/10"
        >
          <Trash2 className="mr-2 h-4 w-4" /><span>Supprimer</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
