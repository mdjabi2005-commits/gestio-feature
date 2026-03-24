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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    summary,
    transactions,
    loading,
    apiStatus,
    refreshData: fetchData
  };
}
