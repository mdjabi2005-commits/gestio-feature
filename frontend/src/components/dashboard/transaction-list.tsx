"use client"
import React, { useState, useEffect } from "react"
import { Search, Table as TableIcon, Trash2, Save, X, CheckSquare } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { TransactionRow } from "./TransactionRow"
import { useFinancial } from "@/context/FinancialDataContext"
import { FilterBar } from "@/components/transactions/FilterBar"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export interface TransactionItem {
  id?: number
  type: "depense" | "revenu"
  description?: string
  montant: number
  categorie: string
  sous_categorie?: string
  date: string
  status?: "completed" | "pending" | "failed"
  merchant?: string
  has_attachments?: boolean
  attachment?: string
  objectif_id?: number
}

interface TransactionListProps {
  transactions: TransactionItem[]
  categories?: any[]
  title?: string
  initialExcelMode?: boolean
  onEdit?: (transaction: TransactionItem) => void
  onView?: (transaction: TransactionItem) => void
  onDelete?: (id: number) => void
  onAttach?: (id: number) => void
}

export function TransactionList({
  transactions,
  categories = [],
  title = "Transactions",
  initialExcelMode = false,
  onEdit,
  onView,
  onDelete,
  onAttach,
}: TransactionListProps) {
  const { searchQuery, setSearchQuery, bulkDeleteTransactions, bulkUpdateTransactions, objectifs, categoriesYaml } = useFinancial()
  const [isExcelMode, setIsExcelMode] = useState(initialExcelMode)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [localTransactions, setLocalTransactions] = useState<TransactionItem[]>(transactions)
  const [changedIds, setChangedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!isExcelMode) {
      setLocalTransactions(transactions)
    }
  }, [transactions, isExcelMode])

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? transactions.map(t => t.id!).filter(Boolean) : [])
  }

  const handleToggleSelect = (id: number, selected: boolean) => {
    setSelectedIds(prev => selected ? [...prev, id] : prev.filter(i => i !== id))
  }

  const handleLocalUpdate = (id: number, data: Partial<TransactionItem>) => {
    setLocalTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    setChangedIds(prev => new Set(prev).add(id))
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    const promise = bulkDeleteTransactions(selectedIds)
    toast.promise(promise, {
      loading: 'Suppression groupée...',
      success: 'Transactions supprimées !',
      error: 'Échec de la suppression',
    })
    await promise
    setSelectedIds([])
  }

  const handleBulkSave = async () => {
    const updates = localTransactions.filter(t => changedIds.has(t.id!))
    if (updates.length === 0) return
    const promise = bulkUpdateTransactions(updates as any)
    toast.promise(promise, {
      loading: 'Sauvegarde des changements...',
      success: 'Toutes les modifications enregistrées !',
      error: 'Échec de la sauvegarde',
    })
    await promise
    setChangedIds(new Set())
    setIsExcelMode(false)
  }

  const hasChanges = selectedIds.length > 0 || changedIds.size > 0
  const allSelected = selectedIds.length === transactions.length && transactions.length > 0

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden relative">
      <ListHeader title={title} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {hasChanges && (
        <BulkActionBar
          selectedCount={selectedIds.length}
          changedCount={changedIds.size}
          onBulkDelete={handleBulkDelete}
          onBulkSave={handleBulkSave}
          onCancelEdits={() => { setChangedIds(new Set()); setLocalTransactions(transactions); setIsExcelMode(false); }}
          onClearSelection={() => setSelectedIds([])}
        />
      )}

      <FilterBar />

      {isExcelMode && <ExcelHeaders />}
      
      {!isExcelMode && transactions.length > 0 && (
        <div className="px-6 py-2 flex items-center bg-secondary/10 border-b border-border/20 shrink-0">
          <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} className="border-white/10" />
          <span className="ml-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Tout sélectionner</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {localTransactions.length === 0 ? (
          <EmptyState />
        ) : (
          localTransactions.map((transaction, index) => (
            <TransactionRow 
              key={transaction.id || index}
              transaction={transaction}
              index={index}
              isLast={index === localTransactions.length - 1}
              categories={categories}
              categoriesYaml={categoriesYaml}
              objectifs={objectifs}
              isSelected={selectedIds.includes(transaction.id!)}
              onSelect={handleToggleSelect}
              isEditing={isExcelMode}
              onUpdate={handleLocalUpdate}
              onEdit={onEdit}
              onView={onView}
              onDelete={onDelete}
              onAttach={onAttach}
            />
          ))
        )}
      </div>

      <ListFooter count={localTransactions.length} changedCount={changedIds.size} searchQuery={searchQuery} onClearSearch={() => setSearchQuery("")} />
    </div>
  )
}

function ListHeader({ title, searchQuery, onSearchChange }: { title: string; searchQuery: string; onSearchChange: (q: string) => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0 bg-background/50 backdrop-blur-sm z-20">
      <h3 className="text-lg font-semibold text-foreground truncate">{title}</h3>
      <div className="flex items-center gap-3 shrink-0">
        <Link href="/transactions/excel" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm bg-secondary/50 text-muted-foreground hover:bg-indigo-500 hover:text-white hover:shadow-lg hover:shadow-indigo-500/20">
          <TableIcon className="w-3.5 h-3.5" />
          Mode Excel
        </Link>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-4 py-1.5 w-48 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
          />
        </div>
      </div>
    </div>
  )
}

function BulkActionBar({ selectedCount, changedCount, onBulkDelete, onBulkSave, onCancelEdits, onClearSelection }: {
  selectedCount: number; changedCount: number; onBulkDelete: () => void; onBulkSave: () => void; onCancelEdits: () => void; onClearSelection: () => void
}) {
  return (
    <div className="absolute top-[72px] inset-x-0 h-14 bg-indigo-600 shadow-2xl z-30 flex items-center justify-between px-8 animate-in slide-in-from-top duration-300 border-b border-indigo-500">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center bg-white/10 rounded-full w-8 h-8"><CheckSquare className="w-4 h-4 text-white" /></div>
        <div className="flex flex-col">
          <span className="text-xs font-black text-white uppercase tracking-widest leading-none">{selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}</span>
          {changedCount > 0 && <span className="text-[10px] text-white/70 font-bold uppercase tracking-tighter">{changedCount} modification{changedCount > 1 ? 's' : ''} en attente</span>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {selectedCount > 0 && <Button variant="ghost" onClick={onBulkDelete} className="h-9 rounded-xl bg-white/5 hover:bg-rose-500 text-white hover:text-white border border-white/10 transition-all font-bold group"><Trash2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />Supprimer</Button>}
        {changedCount > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onCancelEdits} className="h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold">Annuler</Button>
            <Button onClick={onBulkSave} className="h-9 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl shadow-black/20 font-bold"><Save className="w-4 h-4 mr-2" />Valider {changedCount} changements</Button>
          </div>
        )}
        {selectedCount > 0 && changedCount === 0 && <Button variant="ghost" onClick={onClearSelection} className="text-white hover:text-white/80"><X className="w-4 h-4" /></Button>}
      </div>
    </div>
  )
}

function ExcelHeaders() {
  return (
    <div className="px-6 py-3 bg-secondary/30 border-b border-border/50 grid grid-cols-12 gap-3 items-center shrink-0 ml-10">
      <div className="col-span-2 text-xs font-black text-muted-foreground uppercase tracking-widest pl-1">Date</div>
      <div className="col-span-1 text-xs font-black text-muted-foreground uppercase tracking-widest">Type</div>
      <div className="col-span-2 text-xs font-black text-muted-foreground uppercase tracking-widest">Catégorie</div>
      <div className="col-span-2 text-xs font-black text-muted-foreground uppercase tracking-widest">Sous-cat.</div>
      <div className="col-span-1 text-xs font-black text-muted-foreground uppercase tracking-widest text-right pr-4">Montant</div>
      <div className="col-span-2 text-xs font-black text-muted-foreground uppercase tracking-widest">Description</div>
      <div className="col-span-2 text-xs font-black text-muted-foreground uppercase tracking-widest">Objectif</div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm p-8 text-center animate-in fade-in duration-500">
      <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center mb-3"><Search className="w-6 h-6 opacity-20" /></div>
      Aucune transaction ne correspond à vos filtres.
    </div>
  )
}

function ListFooter({ count, changedCount, searchQuery, onClearSearch }: { count: number; changedCount: number; searchQuery: string; onClearSearch: () => void }) {
  return (
    <div className="px-6 py-3 border-t border-border/50 bg-secondary/10 shrink-0 flex items-center justify-between">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">{count} transaction{count > 1 ? 's' : ''} trouvée{count > 1 ? 's' : ''}</span>
      <div className="flex items-center gap-4">
        {changedCount > 0 && <span className="text-[10px] font-black text-amber-400 uppercase animate-pulse">Modifications non sauvegardées ({changedCount})</span>}
        {searchQuery && <button onClick={onClearSearch} className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-tighter">Effacer la recherche</button>}
      </div>
    </div>
  )
}
