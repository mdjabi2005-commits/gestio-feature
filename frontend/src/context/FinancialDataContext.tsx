"use client";

import React, { createContext, useContext, ReactNode, useState, useMemo } from 'react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useFinancialFilters } from '@/hooks/useFinancialFilters';
import { useFinancialSync } from '@/hooks/useFinancialSync';
import { useGoalCalculations } from '@/hooks/useGoalCalculations';
import type { Transaction, Budget, Objectif, SalaryPlan } from '@/api';
import { api } from '@/api';

interface FinancialContextType {
  summary: any; transactions: Transaction[]; loading: boolean; apiStatus: any; refreshData: any;
  addTransaction: any; addEcheance: any; deleteEcheance: any; deleteTransaction: any; updateTransaction: any;
  budgets: Budget[]; setBudget: any; deleteBudget: any; budgetsLoading: boolean;
  echeances: any[]; echeancesLoading: boolean; refreshEcheances: any;
  isAddModalOpen: boolean; setIsAddModalOpen: (v: boolean) => void;
  isEcheanceModalOpen: boolean; setIsEcheanceModalOpen: (v: boolean) => void;
  isSalaryPlanOpen: boolean; setIsSalaryPlanOpen: (v: boolean) => void;
  isSavingsPlanOpen: boolean; setIsSavingsPlanOpen: (v: boolean) => void;
  editingTransaction: Transaction | null; setEditingTransaction: (t: Transaction | null) => void;
  editingEcheance: any | null; setEditingEcheance: (e: any | null) => void;
  editingBudget: Budget | null; setEditingBudget: (b: Budget | null) => void;
  editingGoal: Objectif | null; setEditingGoal: (g: Objectif | null) => void;
  isViewMode: boolean; setIsViewMode: (v: boolean) => void;
  filterCategories: string[]; setFilterCategories: any; toggleCategory: any;
  filterMonths: string[]; setFilterMonths: any; toggleMonth: any;
  filterDateRange: any; setFilterDateRange: any;
  searchQuery: string; setSearchQuery: any; isSunburstSynced: boolean; setIsSunburstSynced: any;
  filteredTransactions: Transaction[]; clearAllFilters: any;
  bulkDeleteTransactions: any; bulkUpdateTransactions: any;
  categoriesYaml: any[]; showFinishedGoals: boolean; setShowFinishedGoals: any;
  objectifs: Objectif[]; objectifsLoading: boolean; setObjectif: any; deleteObjectif: any; refreshObjectifs: any;
  totalMonthlySavings: number; enrichedGoals: any[];
  salaryPlans: SalaryPlan[]; loadingSalaryPlans: boolean; refreshSalaryPlans: any;
  activeSalaryPlan: SalaryPlan | null; setSalaryPlan: any; deleteSalaryPlan: any;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialDataProvider({ children }: { children: ReactNode }) {
  const financialData = useFinancialData();
  const sync = useFinancialSync();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEcheanceModalOpen, setIsEcheanceModalOpen] = useState(false);
  const [isSalaryPlanOpen, setIsSalaryPlanOpen] = useState(false);
  const [isSavingsPlanOpen, setIsSavingsPlanOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingEcheance, setEditingEcheance] = useState<any | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editingGoal, setEditingGoal] = useState<Objectif | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [showFinishedGoals, setShowFinishedGoals] = useState(false);

  const activeSalaryPlan = useMemo(() => 
    sync.salaryPlans.find(p => p.is_active) || (sync.salaryPlans.length > 0 ? sync.salaryPlans[0] : null)
  , [sync.salaryPlans]);

  const { enrichedGoals, totalMonthlySavings } = useGoalCalculations(sync.objectifs, activeSalaryPlan);

  const filters = useFinancialFilters(financialData.transactions, financialData.refreshData);

  const contextValue = {
    ...financialData, ...sync, ...filters,
    isAddModalOpen, setIsAddModalOpen,
    isEcheanceModalOpen, setIsEcheanceModalOpen,
    isSalaryPlanOpen, setIsSalaryPlanOpen,
    isSavingsPlanOpen, setIsSavingsPlanOpen,
    editingTransaction, setEditingTransaction,
    editingEcheance, setEditingEcheance,
    editingBudget, setEditingBudget,
    editingGoal, setEditingGoal,
    isViewMode, setIsViewMode,
    showFinishedGoals, setShowFinishedGoals,
    totalMonthlySavings, enrichedGoals,
    activeSalaryPlan,
    setBudget: async (d: Budget) => { await api.setBudget(d); sync.fetchBudgets(); },
    deleteBudget: async (id: number) => { await api.deleteBudget(id); sync.fetchBudgets(); },
    refreshEcheances: sync.fetchEcheances,
    setObjectif: async (d: Objectif) => { if (d.id) await api.updateObjectif(d.id, d); else await api.addObjectif(d); sync.fetchObjectifs(); },
    deleteObjectif: async (id: number) => { await api.deleteObjectif(id); sync.fetchObjectifs(); },
    refreshObjectifs: sync.fetchObjectifs,
    bulkDeleteTransactions: async (ids: number[]) => { await Promise.all(ids.map(id => financialData.deleteTransaction(id))); await financialData.refreshData(); },
    bulkUpdateTransactions: async (updates: Transaction[]) => { await Promise.all(updates.map(t => financialData.updateTransaction(t.id!, t))); await financialData.refreshData(); },
    setSalaryPlan: async (d: SalaryPlan) => { await api.saveSalaryPlan(d); sync.refreshAll(); },
    deleteSalaryPlan: async (id: number) => { await api.deleteSalaryPlan(id); sync.refreshAll(); },
  };

  return <FinancialContext.Provider value={contextValue as any}>{children}</FinancialContext.Provider>;
}

export function useFinancial() {
  const context = useContext(FinancialContext);
  if (context === undefined) throw new Error('useFinancial must be used within a FinancialDataProvider');
  return context;
}
