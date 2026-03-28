// OCR domain API methods

import type { OCRScanResponse, IncomeScanResponse, SalaryPlan } from './types';

const API_BASE_URL = 'http://localhost:8002';

export const ocrApi = {
  scanTicket: async (file: File): Promise<OCRScanResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/api/ocr/scan`, { method: 'POST', body: formData });
    if (!res.ok) {
      if (res.status === 400) throw new Error('Format de fichier non supporté');
      if (res.status === 500) throw new Error('Échec de la lecture du ticket (ticket illisible ?)');
      throw new Error('Erreur lors du scan du ticket');
    }
    return res.json();
  },

  scanIncome: async (file: File): Promise<IncomeScanResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/api/ocr/scan-income`, { method: 'POST', body: formData });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Échec de l\'analyse de la fiche de paie' }));
      throw new Error(error.detail || 'Échec de l\'analyse de la fiche de paie');
    }
    return res.json();
  },

  warmupOCR: async () => {
    try { await fetch(`${API_BASE_URL}/api/ocr/warmup`); } catch (e) { console.warn('OCR Warmup failed', e); }
  },

  scanTicketsBatch: async (files: File[]): Promise<{ results: OCRScanResponse[] }> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const res = await fetch(`${API_BASE_URL}/api/ocr/scan-batch`, { method: 'POST', body: formData });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Échec du scan par lot');
    }
    return res.json();
  },
  scanPending: async (): Promise<{ results: OCRScanResponse[] }> => {
    const res = await fetch(`${API_BASE_URL}/api/ocr/scan-pending`, { method: 'POST' });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Échec du scan du dossier' }));
      throw new Error(error.detail || 'Échec du scan du dossier');
    }
    return res.json();
  },
};
