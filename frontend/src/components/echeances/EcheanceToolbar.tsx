"use client"
import React from 'react'
import { Search, Filter, CheckSquare, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FilterDropdown, SortDropdown } from './echeance-filters'
import { type SortField, type SortDirection } from './echeance-types'

interface EcheanceToolbarProps {
  search: string;
  setSearch: (v: string) => void;
  typeF: string[];
  setTypeF: (v: string[] | ((p: string[]) => string[])) => void;
  statusF: string[];
  setStatusF: (v: string[] | ((p: string[]) => string[])) => void;
  catF: string[];
  setCatF: (v: string[] | ((p: string[]) => string[])) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (f: SortField) => void;
  selMode: boolean;
  setSelMode: (v: boolean) => void;
  setSelected: (v: string[]) => void;
  categoryOptions: { value: string; label: string }[];
  statusOptions: { value: string; label: string }[];
  filteredCount: number;
}

export function EcheanceToolbar({
  search, setSearch,
  typeF, setTypeF,
  statusF, setStatusF,
  catF, setCatF,
  sortField, sortDirection, onSort,
  selMode, setSelMode, setSelected,
  categoryOptions, statusOptions,
  filteredCount
}: EcheanceToolbarProps) {
  const hasFilters = !!(search || statusF.length || catF.length || typeF.length)
  const clearFilters = () => { setSearch(""); setStatusF([]); setCatF([]); setTypeF([]) }

  return (
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="Rechercher..." 
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 transition-all" 
        />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-white/40" /></button>}
      </div>
      
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-white/30" />
        <FilterDropdown 
          label="Type" 
          options={[{value: "expense", label: "Dépenses"}, {value: "income", label: "Revenus"}]} 
          selected={typeF} 
          onSelect={v => setTypeF(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])} 
          onClear={() => setTypeF([])} 
        />
        <FilterDropdown 
          label="Statut" 
          options={statusOptions} 
          selected={statusF} 
          onSelect={v => setStatusF(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])} 
          onClear={() => setStatusF([])} 
        />
        <FilterDropdown 
          label="Catégorie" 
          options={categoryOptions} 
          selected={catF} 
          onSelect={v => setCatF(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])} 
          onClear={() => setCatF([])} 
        />
      </div>

      <SortDropdown sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
      
      <button 
        onClick={() => { setSelMode(!selMode); setSelected([]) }} 
        className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all", selMode ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-white/[0.04] text-white/60 border border-white/[0.06] hover:bg-white/[0.06]")}
      >
        <CheckSquare className="w-3.5 h-3.5" />Sélection
      </button>
      
      {hasFilters && (
        <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-all">
          <X className="w-3.5 h-3.5" />Effacer
        </button>
      )}
    </div>
  )
}
