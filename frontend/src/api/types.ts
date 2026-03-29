// Shared types — single source of truth for all API models

export interface Transaction {
  id?: number;
  type: 'depense' | 'revenu';
  date: string;
  categorie: string;
  montant: number;
  sous_categorie?: string;
  description?: string;
  merchant?: string;
  source?: 'manual' | 'ocr' | 'pdf';
  external_id?: string;
  has_attachments?: boolean;
  echeance_id?: number;
  compte_id?: number;
  objectif_id?: number;
  recurrence?: string;
  date_fin?: string;
  attachment?: string;
}

export interface Attachment {
  id?: number;
  transaction_id?: number;
  echeance_id?: number;
  objectif_id?: number;
  file_path: string;
  file_name?: string;
  upload_date?: string;
}

export interface OCRScanResponse {
  transaction: Transaction;
  warnings: string[];
  raw_ocr_text: string;
  archived_path?: string;
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
  id?: number;
  nom: string;
  montant: number;
  type: 'depense' | 'revenu';
  categorie: string;
  sous_categorie?: string;
  frequence: string;
  date_debut: string;
  date_fin?: string;
  date_prevue?: string;
  description?: string;
  statut: 'active' | 'inactive' | 'overdue' | 'paid';
  type_echeance?: 'recurrente' | 'ponctuelle';
  objectif_id?: number;
}

export interface IncomeSplit {
  categorie: string;
  sous_categorie: string;
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
  default_remainder_category: string;
  items: SalaryPlanItem[];
  available_plans?: string[];
}

export interface Objectif {
  id?: number;
  nom: string;
  montant_cible: number;
  date_debut?: string;
  date_fin?: string;
  categorie: string;
  description?: string;
  statut?: 'active' | 'completed' | 'archived';
  date_creation?: string;
  montant_actuel?: number;
  montant_mensuel?: number;
  montant_mensuel_calcule?: number;
  poids_allocation?: number;
}

export interface GoalMonthlyProgress {
  month: string;
  theoretical: number;
  real: number;
}
