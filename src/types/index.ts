export type RecordType = 'asset' | 'debt' | 'insurance';

export type AssetCategory = 'bank' | 'real-estate' | 'investment' | 'pension' | 'other';
export type DebtCategory = 'mortgage' | 'credit-card' | 'loan' | 'llc' | 'other';

export interface BaseRecord {
  id: string;
  userId: string;
  name: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AssetRecord extends BaseRecord {
  type: 'asset';
  category: AssetCategory;
  accountNumber?: string;
  url?: string;
  institutionName?: string; // For banks, investment firms
  // Specific fields
  deedUrl?: string; // Real estate
  countyClerkUrl?: string; // Real estate
}

export interface DebtRecord extends BaseRecord {
  type: 'debt';
  category: DebtCategory;
  accountNumber?: string;
  url?: string;
  lenderName?: string;
  controlNumber?: string; // LLC
  stateUrl?: string; // LLC
}

export interface InsuranceRecord extends BaseRecord {
  type: 'insurance';
  companyName: string;
  accountNumber?: string;
  amount?: string; // Coverage amount
  url?: string;
  representativeName?: string;
  representativeContact?: string;
}

export type FinancialRecord = AssetRecord | DebtRecord | InsuranceRecord;

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isGuest: boolean;
  isDemo?: boolean;
}
