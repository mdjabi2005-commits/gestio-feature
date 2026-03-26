"use client";

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useFinancial } from '@/context/FinancialDataContext';
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Eye, EyeOff, FilterX } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
// BalanceChart uses Plotly which depends on 'self'/'window', must be imported dynamically for SSR
const BalanceChart = dynamic(() => import('@/components/dashboard/balance-chart').then(mod => mod.BalanceChart), { ssr: false });
import { FinancialCalendar } from '@/components/dashboard/financial-calendar';
// SunburstChart uses Plotly which depends on 'self'/'window', must be imported dynamically for SSR
const SunburstChart = dynamic(() => import('@/components/dashboard/sunburst-chart').then(mod => mod.SunburstChart), { ssr: false });
import { TransactionList } from '@/components/dashboard/transaction-list';
import { api } from '@/api';
import { toast } from 'sonner';

export default function TransactionsPage() {
  const [showMetrics, setShowMetrics] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { 
    summary, 
    transactions,
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

  // Calendar is driven by filteredTransactions (respects Sunburst category filter)
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

  // Dynamic KPIs from filteredTransactions (react to Sunburst + date filters)
  const kpis = useMemo(() => {
    const revenus = filteredTransactions.filter(t => t.type === 'Revenu').reduce((s, t) => s + t.montant, 0);
    const depenses = filteredTransactions.filter(t => t.type === 'Dépense').reduce((s, t) => s + t.montant, 0);
    const solde = revenus - depenses;
    const nb = filteredTransactions.length;
    const avgDepense = nb > 0 ? depenses / filteredTransactions.filter(t => t.type === 'Dépense').length || 0 : 0;
    return { revenus, depenses, solde, nb, avgDepense };
  }, [filteredTransactions]);

  const contextLabel = filterCategory ? `· ${filterCategory}` : '';

  const listTitle = useMemo(() => {
    if (!filterDateRange || !filterDateRange.start) return "Toutes les transactions";
    const d = new Date(filterDateRange.start);
    const month = d.toLocaleDateString("fr-FR", { month: "long" });
    const year = d.getFullYear();
    return `Transactions - Mois de ${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
  }, [filterDateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!summary) return null;

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="max-w-[1700px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 space-y-6">

      {/* Floating Sticky KPI Strip */}
      <div className={cn(
        "sticky top-2 z-40 transition-all duration-300",
        showMetrics ? "bg-background/80 backdrop-blur-xl rounded-2xl border border-border/20 p-2 min-h-[44px]" : "pointer-events-none"
      )}>
        {/* Toggle Button */}
        <div className="absolute right-2 top-2 z-40 pointer-events-auto">
           <button 
             onClick={() => setShowMetrics(!showMetrics)} 
             className={cn(
               "p-1.5 text-muted-foreground/60 hover:text-foreground transition-all rounded-lg",
               showMetrics ? "hover:bg-white/5" : "bg-background/80 backdrop-blur-md border border-border/20 shadow-sm hover:bg-background"
             )}
             title={showMetrics ? "Masquer les métriques" : "Afficher les métriques"}
           >
               {showMetrics ? <EyeOff size={16} /> : <Eye size={16} />}
           </button>
        </div>

        {/* Metrics Grid */}
        {showMetrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pr-10 animate-in fade-in zoom-in-95 duration-200">
            {[
              {
                label: `Revenus ${contextLabel}`,
                value: fmt(kpis.revenus),
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/20',
                dot: 'bg-emerald-500'
              },
              {
                label: `Dépenses ${contextLabel}`,
                value: fmt(kpis.depenses),
                color: 'text-rose-400',
                bg: 'bg-rose-500/10',
                border: 'border-rose-500/20',
                dot: 'bg-rose-500'
              },
              {
                label: 'Solde net',
                value: fmt(kpis.solde),
                color: kpis.solde >= 0 ? 'text-emerald-400' : 'text-rose-400',
                bg: kpis.solde >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10',
                border: kpis.solde >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20',
                dot: kpis.solde >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
              },
              {
                label: `Transactions ${contextLabel}`,
                value: kpis.nb.toString(),
                color: 'text-indigo-400',
                bg: 'bg-indigo-500/10',
                border: 'border-indigo-500/20',
                dot: 'bg-indigo-500'
              }
            ].map((kpi, i) => (
              <div key={i} className={cn(
                "glass-card rounded-2xl px-5 py-4 flex items-center gap-4 border transition-all duration-300 hover:bg-white/5",
                kpi.border
              )}>
                <div className={cn("w-2.5 h-2.5 rounded-full shrink-0 ring-4 ring-white/10", kpi.dot)} />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate font-medium">{kpi.label}</p>
                  <p className={cn("text-xl font-bold tracking-tight", kpi.color)}>{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row 1: Sunburst & Calendar (3/5 - 2/5) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
        <div className="lg:col-span-3 h-[500px] animate-in slide-in-from-bottom-4 duration-700">
          <div className="glass-card rounded-2xl p-8 h-full flex flex-col">
            <SunburstChart data={summary.repartition_categories} title="Répartition hiérarchique" />
          </div>
        </div>
        <div className="lg:col-span-2 h-[500px] animate-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="glass-card rounded-2xl h-full overflow-hidden p-6">
            <FinancialCalendar 
              transactions={calendarData} 
              selectedRange={filterDateRange}
              onRangeSelect={setFilterDateRange}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Balance Chart & Transaction List (1/2 - 1/2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="glass-card rounded-2xl p-6 h-[500px] animate-in slide-in-from-bottom-4 duration-700 delay-100">
          <BalanceChart data={balanceData} />
        </div>
        <div className="h-[500px] animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="glass-card rounded-2xl h-full">
            <TransactionList 
              transactions={filteredTransactions} 
              categories={summary.repartition_categories}
              title={listTitle}
              onView={(t: any) => {
                setEditingTransaction(t);
                setIsViewMode(true);
                setIsAddModalOpen(true);
              }}
              onEdit={(t: any) => {
                setIsViewMode(false);
                setEditingTransaction(t);
                setIsAddModalOpen(true);
              }}
              onDelete={async (id) => {
                setDeleteId(id);
              }}
              onAttach={(id) => {
                const input = document.getElementById('transaction-file-input') as HTMLInputElement;
                if (input) {
                  input.dataset.transactionId = id.toString();
                  input.click();
                }
              }}
            />
          </div>
        </div>
      </div>



      {/* Reset Filters FAB */}
      {(filterDateRange || filterCategory) && (
        <button
          onClick={() => {
            setFilterDateRange({ start: null, end: null });
            setFilterCategory(null);
          }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-card border border-border hover:bg-secondary text-foreground rounded-full shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 animate-in zoom-in-95 backdrop-blur-xl"
          title="Effacer les filtres actifs"
        >
          <FilterX className="w-5 h-5 text-rose-500" />
          <span className="font-bold text-sm">Effacer les filtres</span>
        </button>
      )}

      {/* Hidden File Input for Attachments */}
      <input 
        type="file" 
        id="transaction-file-input" 
        className="hidden" 
        onChange={async (e) => {
          const file = e.target.files?.[0];
          const transactionId = e.target.dataset.transactionId;
          if (file && transactionId) {
            try {
              toast.loading("Envoi du fichier...");
              await api.uploadAttachment(parseInt(transactionId), file);
              toast.dismiss();
              toast.success("Fichier joint avec succès !");
            } catch (err) {
              toast.dismiss();
              toast.error("Échec de l'envoi");
            }
          }
          e.target.value = ''; // Reset for next use
        }}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Supprimer cette transaction ?"
        description="Cette action est irréversible. La transaction sera définitivement supprimée."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId === null) return;
          try {
            await deleteTransaction(deleteId);
            toast.success("Transaction supprimée !");
          } catch (e) {
            console.error("Erreur API suppression:", e);
            toast.error("Échec de la suppression");
          }
        }}
      />
    </div>
  );
}
