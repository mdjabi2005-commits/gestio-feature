"use client";

import React from 'react';
import { useFinancial } from '@/context/FinancialDataContext';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { SunburstChart } from '@/components/dashboard/sunburst-chart';
import { TransactionTable } from '@/components/dashboard/transaction-table';

export default function DashboardPage() {
  const { summary, transactions, loading } = useFinancial();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-12 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <KpiCards 
        balance={summary.solde} 
        income={summary.total_revenus} 
        expenses={summary.total_depenses} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="glass-card rounded-2xl p-6 h-[500px] animate-in slide-in-from-bottom-4 duration-700">
          <SunburstChart data={summary.repartition_categories} title="Répartition des dépenses" />
        </div>

        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between animate-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="space-y-8">
            <h3 className="text-lg font-semibold text-foreground">Aperçu Mensuel</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taux d'épargne</span>
                  <span className="font-medium text-emerald-500">32%</span>
                </div>
                <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[32%]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget utilisé</span>
                  <span className="font-medium text-indigo-500">68%</span>
                </div>
                <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full w-[68%]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Objectif annuel</span>
                  <span className="font-medium text-purple-500">45%</span>
                </div>
                <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full w-[45%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="glass-card bg-secondary/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Transactions</p>
            </div>
            <div className="glass-card bg-secondary/20 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{summary.repartition_categories?.length || 0}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Catégories</p>
            </div>
          </div>
        </div>
      </div>

      <div className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
        <TransactionTable 
          transactions={transactions.slice(0, 10)} 
          categories={summary.repartition_categories}
        />
      </div>
    </div>
  );
}
