export type RecordType = 'asset' | 'debt' | 'insurance' | 'trust';

export type AssetCategory = 'bank' | 'real-estate' | 'investment' | 'pension' | 'car-boat-motorcycle' | 'other';
export type DebtCategory = 'mortgage' | 'credit-card' | 'loan' | 'llc' | 'other';
export type TrustType = 'revocable' | 'irrevocable' | 'will';

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
  currentBalance?: string; // New field
  assetValue?: string; // New field for all assets
  purchasePrice?: string; // Real estate
  currentValue?: string; // Real estate
  // Specific fields
  deedUrl?: string; // Real estate
  countyClerkUrl?: string; // Real estate
  autoCheckUrl?: string; // Car/Boat/Motorcycle
}

export interface DebtRecord extends BaseRecord {
  type: 'debt';
  category: DebtCategory;
  accountNumber?: string;
  url?: string;
  lenderName?: string;
  currentBalance?: string; // New field
  startBalance?: string; // New field for specific categories
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

export interface TrustRecord extends BaseRecord {
  type: 'trust';
  trustType?: TrustType;
  trusteeDetails?: string;
  url?: string;
}

export type FinancialRecord = AssetRecord | DebtRecord | InsuranceRecord | TrustRecord;

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isGuest: boolean;
  isDemo?: boolean;
  isPremium?: boolean;
}
