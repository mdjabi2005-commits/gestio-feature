const API_BASE_URL = 'http://localhost:8001';

export interface Transaction {
  id?: number;
  type: 'Dépense' | 'Revenu';
  date: string;
  categorie: string;
  montant: number;
  sous_categorie?: string;
  description?: string;
  source?: string;
}

export interface Attachment {
  id?: number;
  transaction_id: number;
  file_name: string;
  file_type?: string;
  upload_date: string;
}

export const api = {
  getSummary: async () => {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/`);
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
};
