"use client";

import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useFinancialData } from '@/hooks/useFinancialData';
import type { Transaction, Budget } from '@/api';
import { api } from '@/api';

interface FinancialContextType {
  summary: any;
  transactions: Transaction[];
  loading: boolean;
  apiStatus: "connected" | "disconnected" | "loading";
  refreshData: (params?: { start_date?: string | null, end_date?: string | null, category?: string | null }) => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  addEcheance: (echeance: any) => Promise<void>;
  deleteEcheance: (id: number | string) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  updateTransaction: (id: number, data: Transaction) => Promise<void>;

  // Budget State
  budgets: Budget[];
  setBudget: (data: Budget) => Promise<void>;
  deleteBudget: (id: number) => Promise<void>;
  budgetsLoading: boolean;

  // Echeances State
  echeances: any[];
  echeancesLoading: boolean;
  refreshEcheances: () => Promise<void>;

  // UI State
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (t: Transaction | null) => void;
  isViewMode: boolean;
  setIsViewMode: (v: boolean) => void;

  // Filtering State
  filterCategory: string | null;
  setFilterCategory: (c: string | null) => void;
  filterDateRange: { start: string | null, end: string | null };
  setFilterDateRange: (range: { start: string | null, end: string | null }) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredTransactions: Transaction[];
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialDataProvider({ children }: { children: ReactNode }) {
  const financialData = useFinancialData();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // Budgets
  const [budgets, setBudgetsState] = useState<Budget[]>([]);
  const [budgetsLoading, setBudgetsLoading] = useState(false);

  const fetchBudgets = async () => {
    setBudgetsLoading(true);
    try { setBudgetsState(await api.getBudgets()); } catch {}
    finally { setBudgetsLoading(false); }
  };

  // Echeances
  const [echeances, setEcheances] = useState<any[]>([]);
  const [echeancesLoading, setEcheancesLoading] = useState(false);

  const fetchEcheances = async () => {
    setEcheancesLoading(true);
    try { setEcheances(await api.getEcheances()); } catch {}
    finally { setEcheancesLoading(false); }
  };

  React.useEffect(() => { 
    fetchBudgets();
    fetchEcheances();
  }, []);

  const handleSetBudget = async (data: Budget) => {
    await api.setBudget(data);
    await fetchBudgets();
  };

  const handleDeleteBudget = async (id: number) => {
    await api.deleteBudget(id);
    await fetchBudgets();
  };

  // Filters
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<{ start: string | null, end: string | null }>({ start: null, end: null });
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = React.useMemo(() => {
    return financialData.transactions.filter(t => {
      // Category/Type filter (checks type, main category and sub-categories)
      if (filterCategory && 
          t.type !== filterCategory && 
          t.categorie !== filterCategory && 
          t.sous_categorie !== filterCategory) return false;

      // Date range filter
      if (filterDateRange.start || filterDateRange.end) {
        const tDate = new Date(t.date).getTime();
        if (filterDateRange.start && tDate < new Date(filterDateRange.start).getTime()) return false;
        if (filterDateRange.end && tDate > new Date(filterDateRange.end).getTime()) return false;
      }

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const desc = (t.description || "").toLowerCase();
        const cat = t.categorie.toLowerCase();
        const sub = (t.sous_categorie || "").toLowerCase();
        if (!desc.includes(q) && !cat.includes(q) && !sub.includes(q) && !t.montant.toString().includes(q)) return false;
      }

      return true;
    });
  }, [financialData.transactions, filterCategory, filterDateRange, searchQuery]);

  // Synchronize dashboard summary when date filter changed
  React.useEffect(() => {
    financialData.refreshData({
       start_date: filterDateRange.start,
       end_date: filterDateRange.end
    });
  }, [filterDateRange]);


  const contextValue = {
    ...financialData,
    isAddModalOpen,
    setIsAddModalOpen,
    editingTransaction,
    setEditingTransaction,
    isViewMode,
    setIsViewMode,
    filterCategory,
    setFilterCategory,
    filterDateRange,
    setFilterDateRange,
    searchQuery,
    setSearchQuery,
    filteredTransactions,
    budgets,
    setBudget: handleSetBudget,
    deleteBudget: handleDeleteBudget,
    budgetsLoading,
    echeances,
    echeancesLoading,
    refreshEcheances: fetchEcheances,
  };

  return (
    <FinancialContext.Provider value={contextValue}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialDataProvider');
  }
  return context;
}
