// api.ts — Thin aggregator. Keep under 200 lines (AGENTS.md rule).
// Types are in api/types.ts. Domain methods in api/*.ts

export type { Transaction, Attachment, OCRScanResponse, ScannedTicket, Budget, BudgetSummaryItem, BudgetSummary, Echeance, IncomeScanResponse, IncomeSplit, SalaryPlan, SalaryPlanItem } from './api/types';
import { budgetsApi } from './api/budgets';
import { ocrApi } from './api/ocr';

const API_BASE_URL = 'http://localhost:8002';

export const api = {
  getSummary: async (params?: { start_date?: string | null, end_date?: string | null, category?: string | null }) => {
    const url = new URL(`${API_BASE_URL}/api/dashboard/`);
    if (params) {
      if (params.start_date) url.searchParams.append('start_date', params.start_date);
      if (params.end_date) url.searchParams.append('end_date', params.end_date);
      if (params.category) url.searchParams.append('category', params.category);
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
  },

  getCategories: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  getTransactions: async () => {
    const res = await fetch(`${API_BASE_URL}/api/transactions/`);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  addTransaction: async (data: any) => {
    const res = await fetch(`${API_BASE_URL}/api/transactions/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add transaction');
    return res.json();
  },

  updateTransaction: async (id: number, data: any) => {
    const res = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update transaction');
    return res.json();
  },

  deleteTransaction: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/api/transactions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete transaction');
    return res.json();
  },

  getEcheances: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE_URL}/api/echeances/`);
    if (!res.ok) throw new Error('Failed to fetch echeances');
    return res.json();
  },

  getCalendarEcheances: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE_URL}/api/echeances/calendar`);
    if (!res.ok) throw new Error('Failed to fetch calendar echeances');
    return res.json();
  },

  addEcheance: async (data: any) => {
    const res = await fetch(`${API_BASE_URL}/api/echeances/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add echeance');
    return res.json();
  },

  updateEcheance: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE_URL}/api/echeances/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update echeance');
    return res.json();
  },

  deleteEcheance: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/api/echeances/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete echeance');
    return res.json();
  },

  getAttachments: async (txId: number) => {
    const res = await fetch(`${API_BASE_URL}/api/attachments/transaction/${txId}`);
    if (!res.ok) throw new Error('Failed to fetch attachments');
    return res.json();
  },

  getEcheanceAttachments: async (echeanceId: string) => {
    const res = await fetch(`${API_BASE_URL}/api/attachments/echeance/${echeanceId}`);
    if (!res.ok) throw new Error('Failed to fetch echeance attachments');
    return res.json();
  },

  uploadAttachment: async (txId: number, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch(`${API_BASE_URL}/api/attachments/transaction/${txId}`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Failed to upload attachment');
    return res.json();
  },

  uploadEcheanceAttachment: async (echeanceId: string, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch(`${API_BASE_URL}/api/attachments/echeance/${echeanceId}`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Failed to upload attachment');
    return res.json();
  },

  deleteAttachment: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/api/attachments/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete attachment');
    return res.json();
  },

  getAttachmentUrl: (id: number) => `${API_BASE_URL}/api/attachments/${id}`,

  getOCRConfig: async (): Promise<{ api_key?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ocr/config`);
      if (!res.ok) return {}; // Silently return empty if not implemented yet
      return res.json();
    } catch (err) {
      return {};
    }
  },

  updateOCRConfig: async (data: { api_key: string }) => {
    const res = await fetch(`${API_BASE_URL}/api/ocr/config?api_key=${encodeURIComponent(data.api_key)}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to update OCR config');
    return res.json();
  },

  // Domain sub-modules
  ...budgetsApi,
  ...ocrApi,
};
