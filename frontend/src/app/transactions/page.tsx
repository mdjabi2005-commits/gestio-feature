"use client";

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useFinancial } from '@/context/FinancialDataContext';
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
    filterCategories,
    filterMonths
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
    const dayMap: Record<string, { revenus: number; depenses: number; items: string[] }> = {};
    filteredTransactions.forEach((t) => {
      const d = typeof t.date === 'string' ? t.date.split('T')[0] : String(t.date);
      if (!dayMap[d]) dayMap[d] = { revenus: 0, depenses: 0, items: [] };
      if (t.type === 'revenu') dayMap[d].revenus += t.montant;
      else dayMap[d].depenses += t.montant;
      
      const desc = t.description || t.merchant || t.categorie;
      if (desc && !dayMap[d].items.includes(desc)) dayMap[d].items.push(desc);
    });
    return Object.entries(dayMap).map(([date, v]) => ({ date, ...v }));
  }, [filteredTransactions]);

  const kpis = useMemo(() => {
    const revenus = filteredTransactions.filter(t => t.type === 'revenu').reduce((s, t) => s + t.montant, 0);
    const depenses = filteredTransactions.filter(t => t.type === 'depense').reduce((s, t) => s + t.montant, 0);
    return { revenus, depenses, solde: revenus - depenses, nb: filteredTransactions.length };
  }, [filteredTransactions]);

  const listTitle = useMemo(() => {
    if (filterMonths.length > 0) {
      if (filterMonths.length === 1) {
        const [year, month] = filterMonths[0].split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const monthLabel = date.toLocaleDateString("fr-FR", { month: "long" });
        return `Transactions - ${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)} ${year}`;
      }
      return `Transactions - ${filterMonths.length} mois sélectionnés`;
    }
    if (filterDateRange?.start) return "Période personnalisée";
    return "Toutes les transactions";
  }, [filterDateRange, filterMonths]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" /></div>
  if (!summary) return null;

  return (
    <div className="max-w-[1700px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 space-y-6">
      <TransactionMetrics kpis={kpis} contextLabel={filterCategories.length > 0 ? `· ${filterCategories.join(', ')}` : ''} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
        <div className="lg:col-span-3 h-[500px]">
          <div className="glass-card rounded-2xl p-8 h-full flex flex-col">
            <SunburstChart data={summary.repartition_categories} title="Répartition hiérarchique" />
          </div>
        </div>
        <div className="lg:col-span-2 h-[500px]">
          <div className="glass-card rounded-2xl h-full p-6 relative">
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
