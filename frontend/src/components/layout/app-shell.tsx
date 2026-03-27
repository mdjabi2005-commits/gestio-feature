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
    editingTransaction, setEditingTransaction, isViewMode, setIsViewMode,
  } = useFinancial();

  const {
    scanResultsQueue, setScanResultsQueue, editingIndex, setEditingIndex,
    currentScanResult, currentScanFile,
    handleScanResults, handleValidate, handleTransactionSuccess
  } = useTransactionQueue(refreshData, setEditingTransaction, setIsAddModalOpen, setIsViewMode);

  const title = viewTitles[pathname] || "Gestio V4";

  return (
    <div className="flex h-screen bg-background overflow-hidden w-full text-foreground">
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
