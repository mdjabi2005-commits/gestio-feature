"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { useFinancial } from '@/context/FinancialDataContext';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { calculatePlannedByTarget } from '@/lib/budget-utils';
import { TransactionTable } from '@/components/dashboard/transaction-table';
import { EcheanceTable, type Echeance } from '@/components/dashboard/echeance-table';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { api } from '@/api';

const SunburstChart = dynamic(() => import('@/components/dashboard/sunburst-chart').then(mod => mod.SunburstChart), { ssr: false });

export default function DashboardPage() {
  const { 
    summary, transactions, loading, budgets, echeances 
  } = useFinancial();

  const budgetSummary = React.useMemo(() => {
    const now = new Date(), year = now.getFullYear(), month = now.getMonth();
    const currentMonthSpent = transactions.reduce((acc: Record<string, number>, t) => {
        const d = new Date(t.date);
        if (t.type === 'depense' && d.getMonth() === month && d.getFullYear() === year) acc[t.categorie] = (acc[t.categorie] || 0) + t.montant;
        return acc;
    }, {});
    const plannedByCategory = calculatePlannedByTarget(echeances, transactions, year, month);
    const totalBudget = budgets.reduce((acc, b) => acc + b.montant_max, 0);
    const totalSpent = budgets.reduce((acc, b) => acc + (currentMonthSpent[b.categorie] || 0), 0);
    const totalPlanned = budgets.reduce((acc, b) => acc + (plannedByCategory[b.categorie] || 0), 0);
    const totalForecasted = totalSpent + totalPlanned;
    return {
        total_budget_prevu: totalBudget, total_consomme: totalSpent, total_planifie: totalPlanned, total_previsionnel: totalForecasted,
        consommation_pct: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
        prevision_pct: totalBudget > 0 ? Math.round((totalForecasted / totalBudget) * 100) : 0
    };
  }, [transactions, budgets, echeances]);

  const [annualSummary, setAnnualSummary] = React.useState<any>(null);
  
  React.useEffect(() => {
    const fetchAnnual = async () => {
      const year = new Date().getFullYear();
      // Assuming 'api' is imported or available globally, e.g., from a utility file
      // If not, this line will cause a reference error.
      const res = await api.getSummary({ 
        start_date: `${year}-01-01`, 
        end_date: `${year}-12-31` 
      });
      setAnnualSummary(res);
    };
    fetchAnnual();
  }, [transactions]); // Refresh when transactions change

  if (loading || !summary) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" /></div>;

  const realEcheances: Echeance[] = (summary?.prochaines_echeances || []).map((e: any) => ({
    id: e.id, nom: e.nom || e.description || "Échéance", montant: e.montant, date_prevue: e.date_prevue, categorie: e.categorie, type: e.type, status: e.statut || "pending"
  }));

  const monthlyBalance = (summary?.total_revenus || 0) - (summary?.total_depenses || 0);
  const savingsRate = summary?.total_revenus > 0 ? Math.round((monthlyBalance / summary.total_revenus) * 100) : 0;
  
  const annualSavings = annualSummary ? (annualSummary.total_revenus - annualSummary.total_depenses) : 0;
  const annualGoalProgress = (annualSavings / 3000) * 100;

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <KpiCards balance={summary?.solde || 0} income={summary?.total_revenus || 0} expenses={summary?.total_depenses || 0} />
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
        <div className="lg:col-span-3 glass-card rounded-3xl p-8 h-[550px]">
          <SunburstChart data={summary?.repartition_categories || []} title="Distribution des flux" />
        </div>
        <DashboardMetrics 
            savingsRate={savingsRate} 
            monthlyBalance={monthlyBalance}
            annualGoalProgress={annualGoalProgress}
            budgetSummary={budgetSummary} 
            transactionCount={transactions.length} 
            categoryCount={summary.repartition_categories?.length || 0} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest opacity-60">Activité Récente</h3>
            <div className="glass-card rounded-3xl p-2 border-white/5 bg-white/[0.01]">
                <TransactionTable transactions={transactions.slice(0, 8)} categories={summary.repartition_categories} />
            </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest opacity-60 text-indigo-400">Prochaines Échéances</h3>
            <div className="glass-card rounded-3xl p-6 border-white/5 bg-white/[0.01] min-h-[400px]">
                <EcheanceTable echeances={realEcheances} loading={loading} />
            </div>
        </div>
      </div>
    </div>
  );
}
