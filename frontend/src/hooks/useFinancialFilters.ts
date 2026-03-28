"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Transaction } from '@/api';

export function useFinancialFilters(transactions: Transaction[], refreshSummary: (params: any) => void) {
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterMonths, setFilterMonths] = useState<string[]>([]);
  const [filterDateRange, setFilterDateRange] = useState<{ start: string | null, end: string | null }>({ start: null, end: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSunburstSynced, setIsSunburstSynced] = useState(false);

  // Toggle Category
  const toggleCategory = (category: string) => {
    setFilterCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  // Toggle Month
  const toggleMonth = (month: string) => {
    setFilterMonths(prev => 
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Multiple Categories Filter
      if (filterCategories.length > 0) {
        const matches = filterCategories.some(cat => 
          t.type === cat || t.categorie === cat || t.sous_categorie === cat
        );
        if (!matches) return false;
      }

      // Multiple Months Filter
      if (filterMonths.length > 0) {
        const tMonth = new Date(t.date).toISOString().slice(0, 7); // YYYY-MM
        if (!filterMonths.includes(tMonth)) return false;
      }

      // Date Range Filter (Fallback or specific)
      if (filterDateRange.start || filterDateRange.end) {
        const tDate = new Date(t.date).getTime();
        if (filterDateRange.start && tDate < new Date(filterDateRange.start).getTime()) return false;
        if (filterDateRange.end && tDate > new Date(filterDateRange.end).getTime()) return false;
      }

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const desc = (t.description || "").toLowerCase();
        const cat = t.categorie.toLowerCase();
        const sub = (t.sous_categorie || "").toLowerCase();
        const merc = (t.merchant || "").toLowerCase();
        if (!desc.includes(q) && !cat.includes(q) && !sub.includes(q) && !merc.includes(q)) return false;
      }

      return true;
    });
  }, [transactions, filterCategories, filterMonths, filterDateRange, searchQuery]);

  // Synchronize Summary when filters change
  useEffect(() => {
    if (isSunburstSynced) {
      // Calculate min/max dates from filterMonths
      if (filterMonths.length > 0) {
        const sorted = [...filterMonths].sort();
        refreshSummary({
          start_date: `${sorted[0]}-01`,
          end_date: `${sorted[sorted.length - 1]}-31`
        });
      } else {
        refreshSummary({ start_date: filterDateRange.start, end_date: filterDateRange.end });
      }
    } else {
      // Load all time (or a very wide range) for Sunburst if not synced
      refreshSummary({ start_date: null, end_date: null });
    }
  }, [isSunburstSynced, filterMonths, filterDateRange, refreshSummary]);

  const clearAllFilters = () => {
    setFilterCategories([]);
    setFilterMonths([]);
    setFilterDateRange({ start: null, end: null });
    setSearchQuery("");
  };

  return {
    filterCategories, setFilterCategories, toggleCategory,
    filterMonths, setFilterMonths, toggleMonth,
    filterDateRange, setFilterDateRange,
    searchQuery, setSearchQuery,
    isSunburstSynced, setIsSunburstSynced,
    filteredTransactions,
    clearAllFilters
  };
}
