"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import AddTransactionModal from '@/components/AddTransactionModal';
import { ScannerModal } from '@/components/dashboard/ScannerModal';
import { BatchReview } from '@/components/dashboard/BatchReview';
import { useFinancial } from '@/context/FinancialDataContext';
import { useTransactionQueue } from '@/hooks/useTransactionQueue';
import { InstallmentForm } from '@/components/echeances/InstallmentForm';
import { BudgetForm } from '@/components/budgets/BudgetForm';
import { GoalForm } from '@/components/objectifs/GoalForm';
import { SalaryPlanSetup } from '@/components/budgets/SalaryPlanSetup';
import { GoalSavingsConfig } from '@/components/objectifs/GoalSavingsConfig';

const viewTitles: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/transactions": "Transactions",
  "/echeances": "Échéances",
  "/budgets": "Budgets",
  "/settings": "Paramètres",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  const { 
    apiStatus, refreshData, isAddModalOpen, setIsAddModalOpen, 
    isEcheanceModalOpen, setIsEcheanceModalOpen,
    isSalaryPlanOpen, setIsSalaryPlanOpen,
    isSavingsPlanOpen, setIsSavingsPlanOpen,
    editingTransaction, setEditingTransaction,
    editingEcheance, setEditingEcheance,
    editingBudget, setEditingBudget,
    editingGoal, setEditingGoal,
    isViewMode, setIsViewMode,
    addEcheance, setBudget, setObjectif, refreshEcheances,
    activeSalaryPlan, setSalaryPlan, 
    enrichedGoals, totalMonthlySavings
  } = useFinancial();

  const {
    scanResultsQueue, setScanResultsQueue, editingIndex, setEditingIndex,
    currentScanResult, currentScanFile,
    handleScanResults, handleValidate, handleTransactionSuccess
  } = useTransactionQueue(refreshData, setEditingTransaction, setIsAddModalOpen, setIsViewMode);

  const title = viewTitles[pathname] || "Gestio V4";

  return (
    <div className="flex h-screen bg-background overflow-hidden w-full text-foreground font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          title={title}
          apiStatus={apiStatus}
          onAddTransaction={() => {
            setScanResultsQueue([]);
            setEditingTransaction(null);
            setIsAddModalOpen(true);
          }}
          onScanClick={() => setIsScannerOpen(true)}
          onAddEcheance={() => { setEditingEcheance(null); setIsEcheanceModalOpen(true); }}
          onAddBudget={() => setIsSalaryPlanOpen(true)}
          onAddGoal={() => setIsSavingsPlanOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
          {children}
        </main>
      </div>

      <ScannerModal 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanResults={(results) => {
          handleScanResults(results);
          setIsScannerOpen(false);
        }}
      />

      <BatchReview 
        results={scanResultsQueue}
        onValidate={handleValidate}
        onEdit={(index) => { setEditingIndex(index); setIsAddModalOpen(true); }}
        onRemove={(index) => setScanResultsQueue(prev => prev.filter((_, i) => i !== index))}
      />

      {/* Global Modals */}
      {isEcheanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="w-full max-w-xl bg-[#0f0f13] border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden relative">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">{editingEcheance ? "Modifier l'échéance" : "Nouvelle échéance"}</h2>
                <button onClick={() => { setIsEcheanceModalOpen(false); setEditingEcheance(null); }} className="p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/10 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <InstallmentForm 
                initial={editingEcheance} 
                onSave={async (d:any) => { await addEcheance(d); setIsEcheanceModalOpen(false); setEditingEcheance(null); refreshEcheances(); }} 
                onCancel={() => { setIsEcheanceModalOpen(false); setEditingEcheance(null); }} 
              />
           </div>
        </div>
      )}

      {/* Plans Globaux (Header Actions) */}
      {isSalaryPlanOpen && (
        <SalaryPlanSetup 
          plan={activeSalaryPlan} 
          onSave={setSalaryPlan} 
          onClose={() => setIsSalaryPlanOpen(false)} 
        />
      )}

      {isSavingsPlanOpen && (
        <GoalSavingsConfig 
          open={isSavingsPlanOpen}
          onOpenChange={setIsSavingsPlanOpen}
          goals={enrichedGoals}
          totalMonthlySavings={totalMonthlySavings}
          onSaved={() => {}} 
        />
      )}

      {/* Édition individuelle (via pages) */}
      {editingBudget && (
        <BudgetForm 
          initial={editingBudget}
          onClose={() => setEditingBudget(null)} 
          onSave={async (d:any) => { await setBudget(d); setEditingBudget(null); }} 
        />
      )}

      {editingGoal && (
        <GoalForm 
          initial={editingGoal} 
          onClose={() => setEditingGoal(null)} 
          onSave={async (d:any) => { await setObjectif(d); setEditingGoal(null); }} 
        />
      )}

      {isAddModalOpen && (
        <AddTransactionModal 
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingIndex(null);
            setEditingTransaction(null);
            setIsViewMode(false);
          }} 
          onSuccess={handleTransactionSuccess}
          onRescan={editingIndex !== null ? () => {
            setIsAddModalOpen(false);
            setEditingIndex(null);
            setIsScannerOpen(true);
          } : undefined}
          initialData={editingTransaction || currentScanResult?.transaction}
          warnings={currentScanResult?.warnings}
          rawOcrText={currentScanResult?.raw_ocr_text}
          scannedFile={currentScanFile}
          readOnly={isViewMode}
        />
      )}
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
