"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useFinancialData } from '@/hooks/useFinancialData';
import type { Transaction } from '@/api';

interface FinancialContextType {
  summary: any;
  transactions: Transaction[];
  loading: boolean;
  apiStatus: "connected" | "disconnected" | "loading";
  refreshData: () => Promise<void>;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialDataProvider({ children }: { children: ReactNode }) {
  const financialData = useFinancialData();

  return (
    <FinancialContext.Provider value={financialData}>
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
