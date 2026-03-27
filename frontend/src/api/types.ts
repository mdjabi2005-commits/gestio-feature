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
  attachment?: string;
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
  depense_planifiee?: number;
}

export interface BudgetSummary {
  total_budget_prevu: number;
  total_consomme: number;
  total_planifie?: number;
  repartition_budget: BudgetSummaryItem[];
}

export interface Echeance {
  id: string;
  nom: string;
  montant: number;
  date_prevue: string;
  categorie: string;
  sous_categorie?: string;
  type: 'Dépense' | 'Revenu';
  statut: 'active' | 'paid' | 'overdue';
  frequence: string;
  date_debut: string;
  date_fin?: string;
  description?: string;
}

export interface IncomeSplit {
  categorie: string;
  sous_categorie?: string;
  montant: number;
  description: string;
}

export interface IncomeScanResponse {
  total_net: number;
  date: string;
  suggested_splits: IncomeSplit[];
  archived_path?: string;
  raw_text: string;
}

export interface SalaryPlanItem {
  id?: number;
  categorie: string;
  montant: number;
  type: 'fixed' | 'percent';
  sub_distribution_mode: 'equal' | 'manual';
  sub_allocations?: { name: string; value: number }[]; // Value is % of category envelope
}

export interface SalaryPlan {
  id?: number;
  nom: string;
  is_active: boolean;
  reference_salary: number;
  default_remainder_category?: string;
  items: SalaryPlanItem[];
}
