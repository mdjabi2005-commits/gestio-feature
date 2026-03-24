"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import AddTransactionModal from '@/components/AddTransactionModal';
import { useFinancial } from '@/context/FinancialDataContext';

const viewTitles: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/transactions": "Transactions",
  "/recurrences": "Récurrences",
  "/settings": "Paramètres",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { apiStatus, refreshData } = useFinancial();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const title = viewTitles[pathname] || "Gestio V4";

  const handleTransactionSuccess = () => {
    setIsModalOpen(false);
    refreshData();
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
          onAddTransaction={() => setIsModalOpen(true)}
          apiStatus={apiStatus}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </main>
      </div>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <AddTransactionModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleTransactionSuccess} 
        />
      )}
    </div>
  );
}
