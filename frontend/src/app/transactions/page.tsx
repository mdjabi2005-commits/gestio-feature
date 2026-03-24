"use client";

import React, { useMemo } from 'react';
import { useFinancial } from '@/context/FinancialDataContext';
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BalanceChart } from '@/components/dashboard/balance-chart';
import { FinancialCalendar } from '@/components/dashboard/financial-calendar';
import { SunburstChart } from '@/components/dashboard/sunburst-chart';
import { TransactionList } from '@/components/dashboard/transaction-list';

export default function TransactionsPage() {
  const { summary, transactions, loading } = useFinancial();

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
    return summary?.historique || [];
  }, [summary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="max-w-[1700px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 space-y-8">
      
      {/* Row 1: Evolution on Left (2/3), Calendar on Right (1/3) - TALLER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 h-[500px] animate-in slide-in-from-bottom-4 duration-700">
          <BalanceChart data={balanceData} />
        </div>
        <div className="lg:col-span-1 h-[500px] glass-card rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-700 delay-100">
          <FinancialCalendar transactions={calendarData} />
        </div>
      </div>

      {/* Row 2: Sunburst on Left (3/5), List on Right (2/5) - HUGE SUNBURS T */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
        <div className="lg:col-span-3 h-[700px] animate-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="glass-card rounded-2xl p-8 h-full flex flex-col">
            <SunburstChart data={summary.repartition_categories} title="Répartition hiérarchique" />
          </div>
        </div>
        <div className="lg:col-span-2 h-[700px] animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <TransactionList 
            transactions={transactions} 
            categories={summary.repartition_categories}
            title="Toutes les transactions"
          />
        </div>
      </div>

      {/* Row 3: Small KPI Stats (4 cards at bottom) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-700 delay-300">
        {[
          { label: "Revenus totaux", value: summary.total_revenus, color: "text-emerald-400", bg: "bg-emerald-500/10", icon: <ArrowUpRight className="w-5 h-5 text-emerald-400" /> },
          { label: "Dépenses totales", value: summary.total_depenses, color: "text-rose-400", bg: "bg-rose-500/10", icon: <ArrowDownRight className="w-5 h-5 text-rose-400" /> },
          { label: "Transactions", value: transactions.length, color: "text-indigo-400", bg: "bg-indigo-500/10", icon: <div className="w-5 h-5 rounded flex items-center justify-center border border-indigo-500/50 text-[10px] uppercase font-bold text-indigo-400">T</div> },
          { label: "Moyenne/jour", value: (summary.total_depenses / 30).toFixed(0), color: "text-purple-400", bg: "bg-purple-500/10", icon: <div className="w-5 h-5 rounded flex items-center justify-center border border-purple-500/50 text-[10px] uppercase font-bold text-purple-400">M</div> }
        ].map((stat, i) => (
          <div key={i} className="glass-card rounded-2xl p-6 flex flex-col gap-2 transition-all hover:scale-[1.02] cursor-default border border-border/10">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg)}>
                {stat.icon}
              </div>
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
            </div>
            <div className="flex flex-col mt-2">
              <span className={cn("text-2xl font-bold", stat.color)}>
                {typeof stat.value === 'number' ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stat.value) : `${stat.value}€`}
              </span>
              {i < 2 && <span className="text-[10px] text-muted-foreground">ce mois-ci</span>}
              {i === 2 && <span className="text-[10px] text-muted-foreground">au total</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
