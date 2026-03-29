"use client"
import React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { TransactionRow } from "@/components/dashboard/TransactionRow"
import { useFinancial } from "@/context/FinancialDataContext"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TrendingDown, Wallet, Calendar, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Budget, Transaction } from "@/api"

interface BudgetTransactionsDrawerProps {
  budget: Budget | null
  transactions: Transaction[]
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedMonth: number
  selectedYear: number
}

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
]

export function BudgetTransactionsDrawer({
  budget,
  transactions,
  open,
  onOpenChange,
  selectedMonth,
  selectedYear,
}: BudgetTransactionsDrawerProps) {
  const { summary, categoriesYaml, objectifs, deleteTransaction, setIsViewMode, setEditingTransaction, setIsAddModalOpen } = useFinancial()

  if (!budget) return null

  const totalSpent = transactions.reduce((sum, t) => sum + t.montant, 0)
  const remaining = budget.montant_max - totalSpent
  const isOver = totalSpent > budget.montant_max

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md border-l border-white/10 bg-slate-950 p-0 overflow-hidden flex flex-col">
        <SheetHeader className="p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-indigo-400" />
            </div>
            <SheetTitle className="text-xl font-bold text-white tracking-tight">
              {budget.categorie}
            </SheetTitle>
          </div>
          <SheetDescription className="text-white/40 font-medium">
            Dépenses de {MONTHS[selectedMonth]} {selectedYear}
          </SheetDescription>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Dépensé</p>
              <p className={cn("text-lg font-black tabular-nums", isOver ? "text-rose-400" : "text-white")}>
                {totalSpent.toLocaleString("fr-FR")} €
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Reste</p>
              <p className={cn("text-lg font-black tabular-nums", isOver ? "text-rose-400" : "text-emerald-400")}>
                {remaining.toLocaleString("fr-FR")} €
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6 py-4 flex items-center justify-between bg-white/[0.01] border-b border-white/5">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/20">Transactions ({transactions.length})</h4>
            <div className="flex items-center gap-2">
               <Calendar className="w-3.5 h-3.5 text-white/20" />
               <span className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">{MONTHS[selectedMonth]} {selectedYear}</span>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="divide-y divide-white/5">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-10 text-center opacity-30">
                  <AlertCircle className="w-10 h-10 mb-4" />
                  <p className="text-sm font-medium">Aucune transaction enregistrée dans cette catégorie.</p>
                </div>
              ) : (
                transactions.map((t, i) => (
                  <TransactionRow
                    key={t.id || i}
                    transaction={t as any}
                    index={i}
                    isLast={i === transactions.length - 1}
                    categories={summary?.repartition_categories ?? []}
                    categoriesYaml={categoriesYaml}
                    objectifs={objectifs}
                    onView={(trans) => { 
                      setEditingTransaction(trans as any); 
                      setIsViewMode(true); 
                      setIsAddModalOpen(true); 
                    }}
                    onEdit={(trans) => { 
                      setIsViewMode(false); 
                      setEditingTransaction(trans as any); 
                      setIsAddModalOpen(true); 
                    }}
                    onDelete={deleteTransaction}
                  />
                ))
              )}
            </div>
            <div className="h-20" /> {/* Spacer */}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}
