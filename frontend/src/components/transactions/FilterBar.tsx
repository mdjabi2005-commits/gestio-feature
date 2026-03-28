"use client";

import React from 'react';
import { X, Calendar, Search, Tag, FilterX } from 'lucide-react';
import { useFinancial } from '@/context/FinancialDataContext';
import { cn } from '@/lib/utils';
import { CATEGORY_STYLES } from '@/lib/categories';

export function FilterBar() {
  const { 
    filterCategories, 
    toggleCategory, 
    filterMonths, 
    toggleMonth, 
    filterDateRange, 
    setFilterDateRange,
    searchQuery,
    setSearchQuery,
    clearAllFilters
  } = useFinancial();

  const hasFilters = filterCategories.length > 0 || filterMonths.length > 0 || searchQuery || filterDateRange.start;

  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-secondary/10 border-b border-border/50 animate-in fade-in slide-in-from-top-1 duration-300">
      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mr-2">
        <Tag className="w-3 h-3" />
        Filtres actifs:
      </div>

      {/* Category Chips */}
      {filterCategories.map(cat => {
        const style = CATEGORY_STYLES[cat] || { couleur: "#94a3b8" };
        return (
          <div 
            key={cat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border/50 text-xs font-medium animate-in zoom-in-95"
            style={{ borderColor: `${style.couleur}40` }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.couleur }} />
            {cat}
            <button 
              onClick={() => toggleCategory(cat)}
              className="ml-1 p-0.5 hover:bg-secondary rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      {/* Month Chips */}
      {filterMonths.map(month => (
        <div 
          key={month}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-medium text-indigo-400 animate-in zoom-in-95"
        >
          <Calendar className="w-3 h-3" />
          {month}
          <button 
            onClick={() => toggleMonth(month)}
            className="ml-1 p-0.5 hover:bg-indigo-500/20 rounded-full transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* Search Chip */}
      {searchQuery && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-medium text-emerald-400 animate-in zoom-in-95">
          <Search className="w-3 h-3" />
          "{searchQuery}"
          <button 
            onClick={() => setSearchQuery("")}
            className="ml-1 p-0.5 hover:bg-emerald-500/20 rounded-full transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Date Range Chip */}
      {filterDateRange.start && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-xs font-medium text-rose-400 animate-in zoom-in-95">
          <Calendar className="w-3 h-3" />
          Période spécifique
          <button 
            onClick={() => setFilterDateRange({ start: null, end: null })}
            className="ml-1 p-0.5 hover:bg-rose-500/20 rounded-full transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Clear All */}
      <button 
        onClick={clearAllFilters}
        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-full transition-all"
      >
        <FilterX className="w-3 h-3" />
        TOUT EFFACER
      </button>
    </div>
  );
}
