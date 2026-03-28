"use client";

import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useFinancialFilters } from '@/hooks/useFinancialFilters';
import type { Transaction, Budget, Objectif } from '@/api';
import { api } from '@/api';

interface FinancialContextType {
  summary: any;
  transactions: Transaction[];
  loading: boolean;
  apiStatus: "connected" | "disconnected" | "loading";
  refreshData: (params?: any) => Promise<void>;
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
  filterCategories: string[];
  setFilterCategories: (c: string[]) => void;
  toggleCategory: (c: string) => void;
  filterMonths: string[];
  setFilterMonths: (m: string[]) => void;
  toggleMonth: (m: string) => void;
  filterDateRange: { start: string | null, end: string | null };
  setFilterDateRange: (range: { start: string | null, end: string | null }) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSunburstSynced: boolean;
  setIsSunburstSynced: (v: boolean) => void;
  filteredTransactions: Transaction[];
  clearAllFilters: () => void;
  bulkDeleteTransactions: (ids: number[]) => Promise<void>;
  bulkUpdateTransactions: (updates: Transaction[]) => Promise<void>;

  // Categories Structure
  categoriesYaml: any[];

  // Objectifs State
  showFinishedGoals: boolean;
  setShowFinishedGoals: (show: boolean) => void;
  objectifs: Objectif[];
  objectifsLoading: boolean;
  setObjectif: (data: Objectif) => Promise<void>;
  deleteObjectif: (id: number) => Promise<void>;
  refreshObjectifs: () => Promise<void>;
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

  // Objectifs
  const [objectifs, setObjectifs] = useState<Objectif[]>([]);
  const [objectifsLoading, setObjectifsLoading] = useState(false);
  const [showFinishedGoals, setShowFinishedGoals] = useState(false);
  const fetchObjectifs = async () => {
    setObjectifsLoading(true);
    try { setObjectifs(await api.getObjectifs()); } catch {}
    finally { setObjectifsLoading(false); }
  };
  
  // Categories Yaml
  const [categoriesYaml, setCategoriesYaml] = useState<any[]>([]);
  const fetchCategories = async () => {
    try { setCategoriesYaml(await api.getCategories()); } catch {}
  };

  React.useEffect(() => { 
    fetchBudgets();
    fetchEcheances();
    fetchObjectifs();
    fetchCategories();
  }, []);

  const filters = useFinancialFilters(financialData.transactions, financialData.refreshData);

  const contextValue = {
    ...financialData,
    ...filters,
    isAddModalOpen,
    setIsAddModalOpen,
    editingTransaction,
    setEditingTransaction,
    isViewMode,
    setIsViewMode,
    budgets,
    setBudget: async (d: Budget) => { await api.setBudget(d); fetchBudgets(); },
    deleteBudget: async (id: number) => { await api.deleteBudget(id); fetchBudgets(); },
    budgetsLoading,
    echeances,
    echeancesLoading,
    refreshEcheances: fetchEcheances,
    showFinishedGoals,
    setShowFinishedGoals,
    objectifs,
    objectifsLoading,
    setObjectif: async (d: Objectif) => { if (d.id) await api.updateObjectif(d.id, d); else await api.addObjectif(d); fetchObjectifs(); },
    deleteObjectif: async (id: number) => { await api.deleteObjectif(id); fetchObjectifs(); },
    refreshObjectifs: fetchObjectifs,
    categoriesYaml,
    bulkDeleteTransactions: async (ids: number[]) => {
      await Promise.all(ids.map(id => financialData.deleteTransaction(id)));
      await financialData.refreshData();
    },
    bulkUpdateTransactions: async (updates: Transaction[]) => {
      await Promise.all(updates.map(t => financialData.updateTransaction(t.id!, t)));
      await financialData.refreshData();
    },
  };

  return (
    <FinancialContext.Provider value={contextValue}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  const context = useContext(FinancialContext);
  if (context === undefined) throw new Error('useFinancial must be used within a FinancialDataProvider');
  return context;
}
