"use client";

import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useFinancialData } from '@/hooks/useFinancialData';
import type { Transaction } from '@/api';

interface FinancialContextType {
  summary: any;
  transactions: Transaction[];
  loading: boolean;
  apiStatus: "connected" | "disconnected" | "loading";
  refreshData: () => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  updateTransaction: (id: number, data: Transaction) => Promise<void>;
  
  // UI State
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (t: Transaction | null) => void;
  isViewMode: boolean;
  setIsViewMode: (v: boolean) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialDataProvider({ children }: { children: ReactNode }) {
  const financialData = useFinancialData();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const contextValue = {
    ...financialData,
    isAddModalOpen,
    setIsAddModalOpen,
    editingTransaction,
    setEditingTransaction,
    isViewMode,
    setIsViewMode,
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
