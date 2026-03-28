"use client"
import React from 'react'
import { cn } from "@/lib/utils"
import { MoreHorizontal, Pencil, Trash2, Paperclip, Check } from "lucide-react"
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
import { type TransactionItem } from './transaction-list'
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

interface TransactionRowProps {
  transaction: TransactionItem;
  index: number;
  isLast: boolean;
  categories: any[];
  categoriesYaml?: any[];
  objectifs?: any[];
  isSelected?: boolean;
  onSelect?: (id: number, selected: boolean) => void;
  isEditing?: boolean;
  onUpdate?: (id: number, data: Partial<TransactionItem>) => void;
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
  categoriesYaml = [],
  objectifs = [],
  isSelected = false,
  onSelect,
  isEditing = false,
  onUpdate,
  onEdit,
  onView,
  onDelete,
  onAttach,
}: TransactionRowProps) {
  const itemType = transaction.type === "revenu" ? "income" : "expense"

  if (isEditing) {
    return (
      <div className={cn(
        "group flex items-center gap-4 px-6 py-3 bg-indigo-500/5 border-b border-indigo-500/20 animate-in fade-in duration-300",
        isSelected && "bg-indigo-500/10"
      )}>
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={(val) => onSelect?.(transaction.id!, !!val)}
          className="border-indigo-500/30 data-[state=checked]:bg-indigo-500"
        />
        
        <div className="flex-1 grid grid-cols-12 gap-3 items-center">
          {/* Date */}
          <div className="col-span-2">
            <Input 
              type="date" 
              value={transaction.date.split('T')[0]} 
              onChange={(e) => onUpdate?.(transaction.id!, { date: e.target.value })}
              className="h-10 text-xs bg-background/50 border-white/10 px-2"
            />
          </div>
          {/* Type */}
          <div className="col-span-1">
            <select 
              value={transaction.type}
              onChange={(e) => onUpdate?.(transaction.id!, { type: e.target.value as any })}
              className={cn(
                "w-full h-10 text-[11px] font-black uppercase bg-background/50 border border-white/10 rounded-md px-1 outline-none",
                transaction.type === 'revenu' ? "text-emerald-400" : "text-rose-400"
              )}
            >
              <option value="revenu">REV</option>
              <option value="depense">DEP</option>
            </select>
          </div>
          {/* Catégorie */}
          <div className="col-span-2">
            <select 
              value={transaction.categorie}
              onChange={(e) => {
                const newCat = e.target.value;
                const subs = categoriesYaml.find((c: any) => c.name === newCat)?.subcategories || [];
                onUpdate?.(transaction.id!, { 
                   categorie: newCat, 
                   sous_categorie: subs.length > 0 ? subs[0] : "" 
                });
              }}
              className="w-full h-10 text-xs font-bold bg-background/50 border border-white/10 rounded-md px-2 outline-none"
            >
              {categoriesYaml.map((c: any) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          {/* Sous-catégorie */}
          <div className="col-span-2">
            <select 
              value={transaction.sous_categorie || ""}
              onChange={(e) => onUpdate?.(transaction.id!, { sous_categorie: e.target.value })}
              className="w-full h-10 text-xs bg-background/50 border border-white/10 rounded-md px-2 outline-none"
            >
              <option value="">(Aucune)</option>
              {(categoriesYaml.find((c: any) => c.name === transaction.categorie)?.subcategories || []).map((s: string) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {/* Montant */}
          <div className="col-span-1">
            <Input 
              type="number" 
              value={transaction.montant} 
              onChange={(e) => onUpdate?.(transaction.id!, { montant: parseFloat(e.target.value) })}
              className={cn(
                "h-10 text-xs font-black text-right border-white/10 px-2",
                transaction.type === 'revenu' ? "text-emerald-400 bg-emerald-500/5" : "text-rose-400 bg-rose-500/5"
              )}
            />
          </div>
          {/* Description */}
          <div className="col-span-2">
            <Input 
              value={transaction.description || ""} 
              placeholder="Notes..."
              onChange={(e) => onUpdate?.(transaction.id!, { description: e.target.value })}
              className="h-10 text-xs font-medium bg-background/50 border-white/10"
            />
          </div>
          {/* Objectif */}
          <div className="col-span-2">
            <select 
              value={transaction.objectif_id || ""}
              onChange={(e) => onUpdate?.(transaction.id!, { objectif_id: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full h-10 text-[11px] bg-background/50 border border-white/10 rounded-md px-1 outline-none font-bold"
            >
              <option value="">Aucun objectif</option>
              {objectifs.map((o: any) => <option key={o.id} value={o.id}>🎯 {o.nom}</option>)}
            </select>
          </div>
        </div>

        <div className="w-4 flex justify-center">
          <Check className="w-3 h-3 text-emerald-500 opacity-50" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "group flex items-center transition-all duration-200 hover:bg-secondary/20", 
      !isLast && "border-b border-border/30",
      isSelected && "bg-indigo-500/5 border-l-2 border-l-indigo-500"
    )}>
      <div className="pl-6 py-4 shrink-0">
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={(val) => onSelect?.(transaction.id!, !!val)}
          className="border-white/10 data-[state=checked]:bg-indigo-500"
        />
      </div>

      <div 
        onClick={() => onView?.(transaction)}
        onDoubleClick={() => onEdit?.(transaction)}
        className="flex flex-1 items-center gap-4 pr-6 pl-2 py-4 cursor-pointer active:scale-[0.99] origin-center"
      >
        <CategoryIcon 
          category={transaction.categorie} 
          categories={categories} 
          showTypeIndicator={itemType} 
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground truncate">{transaction.description || "Sans description"}</h4>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">
              {transaction.sous_categorie || transaction.categorie}
            </span>
            {transaction.merchant && <span className="text-[10px] text-muted-foreground/60 truncate max-w-[150px]">@ {transaction.merchant}</span>}
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
