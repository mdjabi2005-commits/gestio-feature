"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import AddTransactionModal from '@/components/AddTransactionModal';
import { ScannerModal } from '@/components/dashboard/ScannerModal';
import { BatchReview } from '@/components/dashboard/BatchReview';
import { useFinancial } from '@/context/FinancialDataContext';
import type { OCRScanResponse, ScannedTicket } from '@/api';
import { api } from '@/api';
import { toast } from 'sonner';

const viewTitles: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/transactions": "Transactions",
  "/recurrences": "Récurrences",
  "/settings": "Paramètres",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { 
    apiStatus, 
    refreshData, 
    isAddModalOpen, 
    setIsAddModalOpen, 
    editingTransaction, 
    setEditingTransaction,
    isViewMode,
    setIsViewMode,
  } = useFinancial();
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanResultsQueue, setScanResultsQueue] = useState<ScannedTicket[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const currentScanResult = editingIndex !== null ? scanResultsQueue[editingIndex].result : null;
  const currentScanFile = editingIndex !== null ? scanResultsQueue[editingIndex].file : null;

  const title = viewTitles[pathname] || "Gestio V4";

  const handleTransactionSuccess = () => {
    if (editingIndex !== null) {
      setScanResultsQueue(prev => prev.filter((_, i) => i !== editingIndex));
      setEditingIndex(null);
    }
    setEditingTransaction(null);
    setIsAddModalOpen(false);
    setIsViewMode(false);
    refreshData();
  };

  const handleScanResults = (results: ScannedTicket[]) => {
    setScanResultsQueue(prev => [...prev, ...results]);
    setIsScannerOpen(false);
  };

  const handleValidate = async (index: number) => {
    const { result, file } = scanResultsQueue[index];
    try {
      const transactionId = await api.addTransaction(result.transaction);
      
      // Automatic attachment upload
      if (transactionId && file) {
        try {
          await api.uploadAttachment(transactionId, file);
        } catch (attachError) {
          console.error("Failed to upload auto-attachment:", attachError);
          toast.error("Transaction validée, mais échec de la pièce jointe");
        }
      }

      setScanResultsQueue(prev => prev.filter((_, i) => i !== index));
      refreshData();
      toast.success("Transaction validée avec pièce jointe ! 📎");
    } catch (e) {
      toast.error("Échec de la validation");
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden w-full text-foreground">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <Header
          title={title}
          onAddTransaction={() => {
            setScanResultsQueue([]);
            setEditingTransaction(null);
            setIsAddModalOpen(true);
          }}
          onScanClick={() => setIsScannerOpen(true)}
          apiStatus={apiStatus}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
          {children}
        </main>
      </div>

      {/* Scanner Modal */}
      <ScannerModal 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanResults={handleScanResults}
      />

      {/* Add Transaction Modal */}
      {/* Batch Results Review */}
      <BatchReview 
        results={scanResultsQueue}
        onValidate={handleValidate}
        onEdit={(index) => {
          setEditingIndex(index);
          setIsAddModalOpen(true);
        }}
        onRemove={(index) => setScanResultsQueue(prev => prev.filter((_, i) => i !== index))}
      />

      {/* Add Transaction Modal */}
      {/* Add Transaction Modal */}
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
          scannedFile={currentScanFile} // We might want the modal to handle the file too
          readOnly={isViewMode}
        />
      )}
    </div>
  );
}
