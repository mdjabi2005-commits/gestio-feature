import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api';
import type { Transaction } from '@/api';

export function useFinancialData() {
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<"connected" | "disconnected" | "loading">("loading");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setApiStatus("loading");
    try {
      const [summaryData, transactionsData] = await Promise.all([
        api.getSummary(),
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

  const deleteTransaction = async (id: number) => {
    try {
      await api.deleteTransaction(id);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      throw error;
    }
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
    deleteTransaction,
    updateTransaction
  };
}
