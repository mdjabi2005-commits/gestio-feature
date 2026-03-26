import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api';
import type { Transaction } from '@/api';

export function useFinancialData() {
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<"connected" | "disconnected" | "loading">("loading");

  const fetchData = useCallback(async (params?: { start_date?: string | null, end_date?: string | null, category?: string | null }) => {
    setLoading(true);
    setApiStatus("loading");
    try {
      const [summaryData, transactionsData] = await Promise.all([
        api.getSummary(params),
        api.getTransactions()
      ]);
      setSummary(summaryData);
      setTransactions(transactionsData);
      setApiStatus("connected");
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setApiStatus("disconnected");
    } finally {
      setLoading(false);
    }
  }, []);

  const addTransaction = async (transaction: Transaction) => {
    await api.addTransaction(transaction);
    const newTransactions = await api.getTransactions();
    setTransactions(newTransactions);
    const newSummary = await api.getSummary();
    setSummary(newSummary);
  };

  const addEcheance = async (echeance: any) => {
    await api.addEcheance(echeance);
    const newSummary = await api.getSummary();
    setSummary(newSummary);
    const newTransactions = await api.getTransactions();
    setTransactions(newTransactions);
  };

  const deleteEcheance = async (id: number | string) => {
    await api.deleteEcheance(String(id));
    const newSummary = await api.getSummary();
    setSummary(newSummary);
    const newTransactions = await api.getTransactions();
    setTransactions(newTransactions);
  };

  const deleteTransaction = async (id: number) => {
    await api.deleteTransaction(id);
    const newTransactions = await api.getTransactions();
    setTransactions(newTransactions);
    const newSummary = await api.getSummary();
    setSummary(newSummary);
  };

  const updateTransaction = async (id: number, data: Transaction) => {
    try {
      await api.updateTransaction(id, data);
      await fetchData();
    } catch (error) {
      console.error('Failed to update transaction:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    summary,
    transactions,
    loading,
    apiStatus,
    refreshData: fetchData,
    addTransaction,
    addEcheance,
    deleteEcheance,
    deleteTransaction,
    updateTransaction
  };
}
