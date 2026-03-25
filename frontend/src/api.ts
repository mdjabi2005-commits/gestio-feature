const API_BASE_URL = 'http://localhost:8002';

export interface Transaction {
  id?: number;
  type: 'Dépense' | 'Revenu';
  date: string;
  categorie: string;
  montant: number;
  sous_categorie?: string;
  description?: string;
  source?: 'manual' | 'ocr' | 'pdf';
  external_id?: string;
  has_attachments?: boolean;
}

export interface Attachment {
  id?: number;
  transaction_id: number;
  file_name: string;
  file_type?: string;
  upload_date: string;
}

export interface OCRScanResponse {
  transaction: Transaction;
  warnings: string[];
  raw_ocr_text: string;
}

export interface ScannedTicket {
  result: OCRScanResponse;
  file: File;
}

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

  getTransactions: async (): Promise<Transaction[]> => {
    const res = await fetch(`${API_BASE_URL}/api/transactions/`);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  addTransaction: async (data: Transaction) => {
    const res = await fetch(`${API_BASE_URL}/api/transactions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add transaction');
    return res.json();
  },

  updateTransaction: async (id: number, data: Transaction) => {
    const res = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update transaction');
    return res.json();
  },

  deleteTransaction: async (id: number) => {
    const res = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
    return res.json();
  },

  // Attachment methods
  getAttachments: async (transactionId: number): Promise<Attachment[]> => {
    const res = await fetch(`${API_BASE_URL}/api/attachments/transaction/${transactionId}`);
    if (!res.ok) throw new Error('Failed to fetch attachments');
    return res.json();
  },

  uploadAttachment: async (transactionId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/api/attachments/transaction/${transactionId}`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload attachment');
    return res.json();
  },

  deleteAttachment: async (attachmentId: number) => {
    const res = await fetch(`${API_BASE_URL}/api/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete attachment');
    return res.json();
  },

  getAttachmentUrl: (attachmentId: number) => `${API_BASE_URL}/api/attachments/${attachmentId}`,

  scanTicket: async (file: File): Promise<OCRScanResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/api/ocr/scan`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      if (res.status === 400) throw new Error('Format de fichier non supporté');
      if (res.status === 500) throw new Error('Échec de la lecture du ticket (ticket illisible ?)');
      throw new Error('Erreur lors du scan du ticket');
    }
    return res.json();
  },

  warmupOCR: async () => {
    try {
      await fetch(`${API_BASE_URL}/api/ocr/warmup`);
    } catch (e) {
      console.warn("OCR Warmup failed", e);
    }
  },

  scanTicketsBatch: async (files: File[]): Promise<{ results: OCRScanResponse[] }> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const res = await fetch(`${API_BASE_URL}/api/ocr/scan-batch`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Échec du scan par lot");
    }
    return res.json();
  },
};
