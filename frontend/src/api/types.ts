// Shared types — single source of truth for all API models

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
  recurrence?: string;
  date_fin?: string;
  echeance_id?: string;
}

export interface Attachment {
  id?: number;
  transaction_id?: number;
  echeance_id?: string;
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

export interface Budget {
  id?: number;
  categorie: string;
  montant_max: number;
  date_creation?: string;
}

export interface BudgetSummaryItem {
  nom: string;
  budget: number;
  depense_reelle: number;
}

export interface BudgetSummary {
  total_budget_prevu: number;
  total_consomme: number;
  repartition_budget: BudgetSummaryItem[];
}
