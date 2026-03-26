"use client"

import { useState } from "react"
import { CheckSquare, Square, X, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SortField, SortDirection } from "./echeance-types"

// --- FilterDropdown ---
export function FilterDropdown({ label, options, selected, onSelect, onClear }: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onSelect: (value: string) => void
  onClear: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
        selected.length > 0
          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
          : "bg-white/[0.04] text-white/60 border border-white/[0.06] hover:bg-white/[0.06]"
      )}>
        {label}
        {selected.length > 0 && (
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500/40 text-[10px]">{selected.length}</span>
        )}
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-48 rounded-xl bg-[#12121a] border border-white/[0.08] shadow-xl z-20 py-2">
            {selected.length > 0 && (
              <button onClick={() => { onClear(); setIsOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/40 hover:bg-white/[0.04] hover:text-white/60">
                <X className="w-3 h-3" /> Effacer les filtres
              </button>
            )}
            {options.map((option) => (
              <button key={option.value} onClick={() => onSelect(option.value)} className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors",
                selected.includes(option.value) ? "text-indigo-300 bg-indigo-500/10" : "text-white/60 hover:bg-white/[0.04] hover:text-white/80"
              )}>
                {selected.includes(option.value) ? <CheckSquare className="w-3.5 h-3.5 text-indigo-400" /> : <Square className="w-3.5 h-3.5" />}
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// --- SortDropdown ---
const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "date", label: "Date" },
  { value: "amount", label: "Montant" },
  { value: "name", label: "Nom" },
  { value: "status", label: "Statut" },
]

export function SortDropdown({ sortField, sortDirection, onSort }: {
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const current = SORT_OPTIONS.find(o => o.value === sortField)
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-white/[0.04] text-white/60 border border-white/[0.06] hover:bg-white/[0.06] transition-all">
        <ArrowUpDown className="w-3.5 h-3.5" />
        {current?.label}
        <span className="text-white/30">{sortDirection === "asc" ? "↑" : "↓"}</span>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-40 rounded-xl bg-[#12121a] border border-white/[0.08] shadow-xl z-20 py-2">
            {SORT_OPTIONS.map((option) => (
              <button key={option.value} onClick={() => { onSort(option.value); setIsOpen(false) }} className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-xs transition-colors",
                sortField === option.value ? "text-indigo-300 bg-indigo-500/10" : "text-white/60 hover:bg-white/[0.04] hover:text-white/80"
              )}>
                {option.label}
                {sortField === option.value && <span className="text-indigo-400">{sortDirection === "asc" ? "↑" : "↓"}</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
