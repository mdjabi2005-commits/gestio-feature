"use client";

import React from 'react';
import Link from 'next/link';
import { useFinancial } from '@/context/FinancialDataContext';
import { TransactionList } from '@/components/dashboard/transaction-list';
import { ChevronLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ExcelModePage() {
  const { 
    filteredTransactions, 
    loading, 
    summary,
    setEditingTransaction,
    setIsAddModalOpen,
    setIsViewMode,
    deleteTransaction
  } = useFinancial();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Chargement de l'éditeur haute densité...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/transactions">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight underline decoration-indigo-500/30 decoration-4 underline-offset-8">
              Édition Excel
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 opacity-60">
              Modification en masse · {filteredTransactions.length} transactions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">
               Mode Haute Densité Actif
             </span>
          </div>
        </div>
      </div>

      {/* Main Content - Full Height Table */}
      <div className="flex-1 glass-card rounded-3xl overflow-hidden border-white/5 shadow-2xl shadow-indigo-500/5">
        <TransactionList 
          transactions={filteredTransactions} 
          categories={summary?.repartition_categories}
          title="Grille d'édition"
          initialExcelMode={true}
          onView={(t: any) => { setEditingTransaction(t); setIsViewMode(true); setIsAddModalOpen(true); }}
          onEdit={(t: any) => { setIsViewMode(false); setEditingTransaction(t); setIsAddModalOpen(true); }}
          onDelete={async (id) => {
            if (confirm("Supprimer cette transaction ?")) {
              await deleteTransaction(id);
            }
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
      
      {/* Tips */}
      <div className="flex items-center gap-6 px-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Auto-save activé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Sélection multiple supportée</span>
        </div>
      </div>
    </div>
  );
}
