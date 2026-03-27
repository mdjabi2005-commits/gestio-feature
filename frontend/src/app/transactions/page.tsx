"use client";

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useFinancial } from '@/context/FinancialDataContext';
import { FilterX } from "lucide-react";
import { TransactionMetrics } from "@/components/transactions/TransactionMetrics"
import { TransactionDialogs } from "@/components/transactions/TransactionDialogs"
import { FinancialCalendar } from '@/components/dashboard/financial-calendar';
import { TransactionList } from '@/components/dashboard/transaction-list';
import { toast } from 'sonner';

const BalanceChart = dynamic(() => import('@/components/dashboard/balance-chart').then(mod => mod.BalanceChart), { ssr: false });
const SunburstChart = dynamic(() => import('@/components/dashboard/sunburst-chart').then(mod => mod.SunburstChart), { ssr: false });

export default function TransactionsPage() {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { 
    summary, 
    filteredTransactions, 
    loading, 
    deleteTransaction,
    setEditingTransaction,
    setIsAddModalOpen,
    setIsViewMode,
    filterDateRange,
    setFilterDateRange,
    filterCategory,
    setFilterCategory
  } = useFinancial();

  const balanceData = useMemo(() => {
    if (!summary?.historique) return [];
    return summary.historique.map((h: any) => ({
      date: h.date,
      balance: h.solde,
      revenu: h.revenus,
      depense: h.depenses
    }));
  }, [summary]);

  const calendarData = useMemo(() => {
    const dayMap: Record<string, { revenus: number; depenses: number }> = {};
    filteredTransactions.forEach((t) => {
      const d = typeof t.date === 'string' ? t.date.split('T')[0] : String(t.date);
      if (!dayMap[d]) dayMap[d] = { revenus: 0, depenses: 0 };
      if (t.type === 'Revenu') dayMap[d].revenus += t.montant;
      else dayMap[d].depenses += t.montant;
    });
    return Object.entries(dayMap).map(([date, v]) => ({ date, ...v }));
  }, [filteredTransactions]);

  const kpis = useMemo(() => {
    const revenus = filteredTransactions.filter(t => t.type === 'Revenu').reduce((s, t) => s + t.montant, 0);
    const depenses = filteredTransactions.filter(t => t.type === 'Dépense').reduce((s, t) => s + t.montant, 0);
    return { revenus, depenses, solde: revenus - depenses, nb: filteredTransactions.length };
  }, [filteredTransactions]);

  const listTitle = useMemo(() => {
    if (!filterDateRange?.start) return "Toutes les transactions";
    const d = new Date(filterDateRange.start);
    const month = d.toLocaleDateString("fr-FR", { month: "long" });
    const year = d.getFullYear();
    return `Transactions - ${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
  }, [filterDateRange]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" /></div>
  if (!summary) return null;

  return (
    <div className="max-w-[1700px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 space-y-6">
      <TransactionMetrics kpis={kpis} contextLabel={filterCategory ? `· ${filterCategory}` : ''} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
        <div className="lg:col-span-3 h-[500px]">
          <div className="glass-card rounded-2xl p-8 h-full flex flex-col">
            <SunburstChart data={summary.repartition_categories} title="Répartition hiérarchique" />
          </div>
        </div>
        <div className="lg:col-span-2 h-[500px]">
          <div className="glass-card rounded-2xl h-full overflow-hidden p-6">
            <FinancialCalendar transactions={calendarData} selectedRange={filterDateRange} onRangeSelect={setFilterDateRange} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="glass-card rounded-2xl p-6 h-[500px]">
          <BalanceChart data={balanceData} />
        </div>
        <div className="h-[500px]">
          <div className="glass-card rounded-2xl h-full">
            <TransactionList 
              transactions={filteredTransactions} 
              categories={summary.repartition_categories}
              title={listTitle}
              onView={(t: any) => { setEditingTransaction(t); setIsViewMode(true); setIsAddModalOpen(true); }}
              onEdit={(t: any) => { setIsViewMode(false); setEditingTransaction(t); setIsAddModalOpen(true); }}
              onDelete={async (id) => setDeleteId(id)}
              onAttach={(id) => { const input = document.getElementById('transaction-file-input') as HTMLInputElement; if (input) { input.dataset.transactionId = id.toString(); input.click(); } }}
            />
          </div>
        </div>
      </div>

      {(filterDateRange?.start || filterCategory) && (
        <button
          onClick={() => { setFilterDateRange({ start: null, end: null }); setFilterCategory(null); }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-card border border-border hover:bg-secondary text-foreground rounded-full shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 animate-in zoom-in-95 backdrop-blur-xl"
          title="Effacer les filtres actifs"
        >
          <FilterX className="w-5 h-5 text-rose-500" /><span className="font-bold text-sm">Effacer les filtres</span>
        </button>
      )}

      <TransactionDialogs 
        deleteId={deleteId} 
        setDeleteId={setDeleteId} 
        onDeleted={async (id) => {
          try {
            await deleteTransaction(id);
            toast.success("Transaction supprimée !");
          } catch (e) { toast.error("Échec de la suppression"); }
        }} 
      />
    </div>
  );
}
