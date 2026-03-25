"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useFinancial } from '@/context/FinancialDataContext';
import { KpiCards } from '@/components/dashboard/kpi-cards';
// SunburstChart uses Plotly which depends on 'self'/'window', must be imported dynamically for SSR
const SunburstChart = dynamic(() => import('@/components/dashboard/sunburst-chart').then(mod => mod.SunburstChart), { ssr: false });
import { TransactionTable } from '@/components/dashboard/transaction-table';
import { EcheanceTable, type Echeance } from '@/components/dashboard/echeance-table';
// BalanceChart uses Plotly which depends on 'self'/'window', must be imported dynamically for SSR
const BalanceChart = dynamic(() => import('@/components/dashboard/balance-chart').then(mod => mod.BalanceChart), { ssr: false });
import { FinancialCalendar } from '@/components/dashboard/financial-calendar';

export default function DashboardPage() {
  const { 
    summary, 
    transactions, 
    filteredTransactions,
    loading, 
    filterCategory, 
    setFilterCategory,
    filterDateRange,
    setFilterDateRange
  } = useFinancial();

  // Mock data for upcoming echéances (until backend update)
  const mockEcheances: Echeance[] = [
    { id: 1, nom: "Loyer Janvier", montant: 850, date_prevue: "2026-01-01", categorie: "Logement", type: "Dépense", status: "pending" },
    { id: 2, nom: "Salaire", montant: 2450, date_prevue: "2026-01-05", categorie: "Salaire", type: "Revenu", status: "pending" },
    { id: 3, nom: "Assurance Auto", montant: 45, date_prevue: "2026-01-10", categorie: "Transport", type: "Dépense", status: "pending" },
    { id: 4, nom: "Abonnement Free", montant: 29.99, date_prevue: "2026-01-15", categorie: "Abonnement", type: "Dépense", status: "pending" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!summary) return null;

  // Map history data to component formats
  const chartData = summary.historique?.map((h: any) => ({
    date: h.date,
    balance: h.solde,
    revenu: h.revenus,
    depense: h.depenses
  })) || [];

  const calendarData = summary.historique?.map((h: any) => ({
    date: h.date,
    revenus: h.revenus,
    depenses: h.depenses
  })) || [];

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Row 1: Big KPIs */}
      <KpiCards 
        balance={summary.solde} 
        income={summary.total_revenus} 
        expenses={summary.total_depenses} 
      />
      
      {/* Row 2: Visual Summary & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
        <div className="lg:col-span-3 glass-card rounded-3xl p-8 h-[550px] animate-in slide-in-from-bottom-4 duration-700">
          <SunburstChart 
            data={summary.repartition_categories} 
            title="Distribution des flux" 
          />
        </div>

        <div className="lg:col-span-2 glass-card rounded-3xl p-8 flex flex-col justify-between animate-in slide-in-from-bottom-4 duration-700 delay-100 border-indigo-500/10">
          <div className="space-y-10">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest opacity-60">Indicateurs de Performance</h3>
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-muted-foreground">Taux d'épargne</span>
                  <span className="text-emerald-400">32%</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full w-[32%] shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-muted-foreground">Consommation du budget</span>
                  <span className="text-indigo-400">68%</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full w-[68%] shadow-[0_0_15px_rgba(79,70,229,0.3)]" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-muted-foreground">Progression Objectif annuel</span>
                  <span className="text-purple-400">45%</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full w-[45%] shadow-[0_0_15px_rgba(147,51,234,0.3)]" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-10">
            <div className="glass-card bg-white/5 border-white/5 rounded-2xl p-5 text-center transition-all hover:bg-white/10">
              <p className="text-3xl font-black text-foreground tracking-tighter">{transactions.length}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-2 opacity-60">Transactions</p>
            </div>
            <div className="glass-card bg-white/5 border-white/5 rounded-2xl p-5 text-center transition-all hover:bg-white/10">
              <p className="text-3xl font-black text-foreground tracking-tighter">{summary.repartition_categories?.length || 0}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-2 opacity-60">Catégories</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Activity & Upcoming Echéances */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in slide-in-from-bottom-4 duration-700 delay-200">
        
        {/* Left: Recent Activity (60%) */}
        <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-foreground uppercase tracking-widest opacity-60">Activité Récente</h3>
            </div>
            <div className="glass-card rounded-3xl p-2 border-white/5 bg-white/[0.01]">
                <TransactionTable 
                transactions={transactions.slice(0, 8)} 
                categories={summary.repartition_categories}
                />
            </div>
        </div>

        {/* Right: Upcoming Echéances (40%) */}
        <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-foreground uppercase tracking-widest opacity-60 text-indigo-400">Prochaines Échéances</h3>
            </div>
            <div className="glass-card rounded-3xl p-6 border-white/5 bg-white/[0.01] min-h-[400px]">
                <EcheanceTable 
                    echeances={mockEcheances} 
                    loading={loading}
                />
            </div>
        </div>
      </div>
    </div>
  );
}
