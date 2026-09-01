import { FinancialRecord, DebtRecord, DebtCategory } from '../types';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface CreditWorthAccount {
  name: string;
  lenderName?: string;
  category?: DebtCategory | string;
  currentBalance?: string | number;
  creditLimit?: string | number;
  accountNumber?: string;
  apr?: string | number;
  balanceAsOf?: string;
  url?: string;
  notes?: string;
  isBusiness?: boolean;
  status?: string;
  minPayment?: string | number;
}

export interface CreditWorthPayload {
  app: 'WhatsMyCreditWorth' | 'NextSteps';
  version: string;
  exportedAt: string;
  userEmail?: string;
  summary?: {
    totalBalance?: number | string;
    totalCreditLimit?: number | string;
    totalAccounts?: number;
    utilizationRate?: string;
  };
  accounts: CreditWorthAccount[];
}

export interface DiffFieldChange {
  fieldName: string;
  label: string;
  oldValue: string;
  newValue: string;
  hasChanged: boolean;
}

export interface AccountDiffItem {
  id: string; // generated temp id or existing record id
  action: 'CREATE' | 'UPDATE' | 'UNCHANGED';
  selected: boolean;
  incomingAccount: CreditWorthAccount;
  existingRecord?: DebtRecord;
  changes: DiffFieldChange[];
}

export interface SyncSnapshot {
  id: string;
  timestamp: number;
  sourceApp: string;
  summaryText: string;
  createdRecordIds: string[];
  previousRecordStates: Record<string, Partial<DebtRecord>>;
  isReverted: boolean;
}

const SNAPSHOTS_KEY = 'nextsteps_creditworth_sync_snapshots';

export const formatCurrencyVal = (val?: string | number): string => {
  if (val === undefined || val === null || val === '') return '$0';
  if (typeof val === 'number') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  }
  const clean = String(val).trim();
  if (clean.startsWith('$')) return clean;
  const num = parseFloat(clean.replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) return clean;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

export const parseNumberVal = (val?: string | number): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
  return isNaN(num) ? 0 : num;
};

// Map raw categories into Next Steps DebtCategory
export const normalizeDebtCategory = (rawCat?: string): DebtCategory => {
  if (!rawCat) return 'credit-card';
  const c = rawCat.toLowerCase();
  if (c.includes('credit') || c.includes('card') || c.includes('revolving')) return 'credit-card';
  if (c.includes('mortgage') || c.includes('home') || c.includes('heloc') || c.includes('equity')) return 'mortgage';
  if (c.includes('llc') || c.includes('business loan') || c.includes('commercial')) return 'llc';
  if (c.includes('loan') || c.includes('auto') || c.includes('student') || c.includes('personal') || c.includes('installment')) return 'loan';
  return 'other';
};

/**
 * Universal Parser for What's My Credit Worth payloads (JSON, text, arrays, CSV data)
 */
export const parseCreditWorthPayload = (rawInput: any): CreditWorthAccount[] => {
  let accounts: CreditWorthAccount[] = [];

  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    // Try JSON
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseCreditWorthPayload(parsed);
      } catch (err) {
        // Not valid JSON, fallback to line-based parsing
      }
    }

    // Attempt CSV/TSV parsing
    try {
      const workbook = XLSX.read(trimmed, { type: 'string' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(firstSheet);
      return parseCreditWorthPayload(rows);
    } catch (e) {
      // ignore
    }
  }

  if (Array.isArray(rawInput)) {
    // Array of accounts or CSV rows
    return rawInput.map(item => normalizeAccountObject(item)).filter(Boolean) as CreditWorthAccount[];
  }

  if (typeof rawInput === 'object' && rawInput !== null) {
    if (Array.isArray(rawInput.accounts)) {
      return rawInput.accounts.map((a: any) => normalizeAccountObject(a)).filter(Boolean) as CreditWorthAccount[];
    }
    if (Array.isArray(rawInput.records)) {
      return rawInput.records.map((a: any) => normalizeAccountObject(a)).filter(Boolean) as CreditWorthAccount[];
    }
    if (Array.isArray(rawInput.debts)) {
      return rawInput.debts.map((a: any) => normalizeAccountObject(a)).filter(Boolean) as CreditWorthAccount[];
    }
    if (rawInput.rawRecords && Array.isArray(rawInput.rawRecords)) {
      return rawInput.rawRecords
        .filter((r: any) => r.type === 'debt' || r.creditLimit || r.lenderName)
        .map((a: any) => normalizeAccountObject(a))
        .filter(Boolean) as CreditWorthAccount[];
    }
    // Single account object
    const single = normalizeAccountObject(rawInput);
    if (single) accounts.push(single);
  }

  return accounts;
};

const normalizeAccountObject = (item: any): CreditWorthAccount | null => {
  if (!item || typeof item !== 'object') return null;

  const name = 
    item.name || 
    item.cardName || 
    item.accountName || 
    item["Card / Account Name"] || 
    item["Account Name"] || 
    item["Item Name"] || 
    item["Lender Name"] ||
    item.lenderName ||
    item.lender;

  if (!name) return null;

  const lenderName = 
    item.lenderName || 
    item.lender || 
    item.bank || 
    item.institutionName || 
    item.financialInstitution || 
    item["Lender / Bank"] || 
    item["Creditor / Lender Name"] || 
    name;

  const currentBalance = 
    item.currentBalance || 
    item.balance || 
    item["Current Balance"] || 
    item["Balance"] || 
    item["Current Outstanding Balance"] || 
    item.amount || 
    '$0';

  const creditLimit = 
    item.creditLimit || 
    item.limit || 
    item["Credit Limit"] || 
    item["Limit"] || 
    item["Line of Credit"] || 
    '';

  const accountNumber = 
    item.accountNumber || 
    item.last4 || 
    item.acctNumber || 
    item["Account Number"] || 
    item["Account #"] || 
    item["Card # (Last 4)"] || 
    '';

  const category = normalizeDebtCategory(
    item.category || 
    item.accountType || 
    item.type || 
    item["Account Type"] || 
    item["Debt Description / Type"]
  );

  const isBusiness = 
    item.isBusiness === true || 
    item.isBusiness === 'YES' || 
    item.isBusiness === 'true' || 
    String(item.category || '').toLowerCase().includes('llc') || 
    String(item.category || '').toLowerCase().includes('business') ||
    String(item.classification || '').toLowerCase().includes('business');

  let notes = item.notes || item["Notes"] || item["Notes & Instructions"] || '';
  if (item.apr || item.interestRate || item["APR"]) {
    const aprStr = `APR: ${item.apr || item.interestRate || item["APR"]}%`;
    if (!notes.includes('APR')) {
      notes = notes ? `${notes} • ${aprStr}` : aprStr;
    }
  }
  if (item.status && !notes.includes(item.status)) {
    notes = notes ? `${notes} • Status: ${item.status}` : `Status: ${item.status}`;
  }

  return {
    name: String(name).trim(),
    lenderName: String(lenderName).trim(),
    category,
    currentBalance: formatCurrencyVal(currentBalance),
    creditLimit: creditLimit ? formatCurrencyVal(creditLimit) : undefined,
    accountNumber: accountNumber ? String(accountNumber).trim() : undefined,
    balanceAsOf: item.balanceAsOf || new Date().toISOString().split('T')[0],
    url: item.url || item.paymentPortal || item["Payment Portal Link"] || item["Online Link"] || undefined,
    notes: notes || undefined,
    isBusiness,
    status: item.status,
    apr: item.apr || item.interestRate
  };
};

/**
 * Generate Smart Comparison Diff between existing Next Steps debts and incoming Credit Worth accounts
 */
export const generateSyncDiff = (
  existingDebts: DebtRecord[],
  incomingAccounts: CreditWorthAccount[]
): AccountDiffItem[] => {
  const diffItems: AccountDiffItem[] = [];

  for (let idx = 0; idx < incomingAccounts.length; idx++) {
    const incoming = incomingAccounts[idx];
    
    // Find matching existing record
    // Match priority: 1) Account number match, 2) Name match, 3) Lender + partial name match
    const existing = existingDebts.find(e => {
      if (incoming.accountNumber && e.accountNumber && incoming.accountNumber.length >= 3 && e.accountNumber.length >= 3) {
        if (incoming.accountNumber === e.accountNumber) return true;
        // Last 4 match
        const incLast4 = incoming.accountNumber.replace(/[^0-9]/g, '').slice(-4);
        const exLast4 = e.accountNumber.replace(/[^0-9]/g, '').slice(-4);
        if (incLast4 && exLast4 && incLast4 === exLast4) return true;
      }

      const eNameNorm = e.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const incNameNorm = incoming.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (eNameNorm === incNameNorm) return true;

      // Check if one contains the other and lender matches
      if (incoming.lenderName && e.lenderName && 
          incoming.lenderName.toLowerCase() === e.lenderName.toLowerCase() &&
          (eNameNorm.includes(incNameNorm) || incNameNorm.includes(eNameNorm))) {
        return true;
      }

      return false;
    });

    if (!existing) {
      // New Account (CREATE)
      const changes: DiffFieldChange[] = [
        { fieldName: 'name', label: 'Debt / Card Name', oldValue: '—', newValue: incoming.name, hasChanged: true },
        { fieldName: 'currentBalance', label: 'Current Balance', oldValue: '$0', newValue: String(incoming.currentBalance || '$0'), hasChanged: true },
        { fieldName: 'creditLimit', label: 'Credit Limit', oldValue: '—', newValue: String(incoming.creditLimit || '—'), hasChanged: !!incoming.creditLimit },
        { fieldName: 'lenderName', label: 'Lender / Bank', oldValue: '—', newValue: String(incoming.lenderName || '—'), hasChanged: !!incoming.lenderName },
        { fieldName: 'category', label: 'Category', oldValue: '—', newValue: String(incoming.category || 'credit-card'), hasChanged: true },
        { fieldName: 'isBusiness', label: 'Account Type', oldValue: '—', newValue: incoming.isBusiness ? 'Business Debt' : 'Personal Debt', hasChanged: true }
      ];

      diffItems.push({
        id: `new-${idx}-${Date.now()}`,
        action: 'CREATE',
        selected: true,
        incomingAccount: incoming,
        changes
      });
    } else {
      // Existing Account found (UPDATE or UNCHANGED)
      const changes: DiffFieldChange[] = [];
      let anyFieldChanged = false;

      // 1. Balance
      const oldBal = formatCurrencyVal(existing.currentBalance);
      const newBal = formatCurrencyVal(incoming.currentBalance);
      const balChanged = parseNumberVal(oldBal) !== parseNumberVal(newBal);
      changes.push({ fieldName: 'currentBalance', label: 'Current Balance', oldValue: oldBal, newValue: newBal, hasChanged: balChanged });
      if (balChanged) anyFieldChanged = true;

      // 2. Credit Limit
      const oldLimit = existing.creditLimit ? formatCurrencyVal(existing.creditLimit) : '—';
      const newLimit = incoming.creditLimit ? formatCurrencyVal(incoming.creditLimit) : (existing.creditLimit || '—');
      const limitChanged = incoming.creditLimit ? (parseNumberVal(oldLimit) !== parseNumberVal(newLimit)) : false;
      changes.push({ fieldName: 'creditLimit', label: 'Credit Limit', oldValue: oldLimit, newValue: newLimit, hasChanged: limitChanged });
      if (limitChanged) anyFieldChanged = true;

      // 3. Lender Name
      const oldLender = existing.lenderName || '—';
      const newLender = incoming.lenderName || existing.lenderName || '—';
      const lenderChanged = !!incoming.lenderName && incoming.lenderName !== existing.lenderName;
      changes.push({ fieldName: 'lenderName', label: 'Lender / Bank', oldValue: oldLender, newValue: newLender, hasChanged: lenderChanged });
      if (lenderChanged) anyFieldChanged = true;

      // 4. Notes / APR
      const oldNotes = existing.notes || '—';
      const newNotes = incoming.notes || existing.notes || '—';
      const notesChanged = !!incoming.notes && incoming.notes !== existing.notes;
      changes.push({ fieldName: 'notes', label: 'Notes & APR', oldValue: oldNotes, newValue: newNotes, hasChanged: notesChanged });
      if (notesChanged) anyFieldChanged = true;

      diffItems.push({
        id: existing.id,
        action: anyFieldChanged ? 'UPDATE' : 'UNCHANGED',
        selected: anyFieldChanged, // auto-select changed items
        incomingAccount: incoming,
        existingRecord: existing,
        changes
      });
    }
  }

  return diffItems;
};

/**
 * Execute Sync and record Snapshot for Undo
 */
export const executeCreditWorthSync = async (
  diffItems: AccountDiffItem[],
  addRecord: (record: any) => Promise<void>,
  updateRecord: (id: string, record: any) => Promise<void>
): Promise<SyncSnapshot> => {
  const selectedItems = diffItems.filter(i => i.selected && i.action !== 'UNCHANGED');
  const createdRecordIds: string[] = [];
  const previousRecordStates: Record<string, Partial<DebtRecord>> = {};

  let createdCount = 0;
  let updatedCount = 0;

  for (const item of selectedItems) {
    if (item.action === 'CREATE') {
      const incoming = item.incomingAccount;
      const newRecordData = {
        name: incoming.name,
        type: 'debt' as const,
        category: (incoming.category as DebtCategory) || 'credit-card',
        lenderName: incoming.lenderName || incoming.name,
        currentBalance: String(incoming.currentBalance || '$0'),
        creditLimit: incoming.creditLimit ? String(incoming.creditLimit) : undefined,
        accountNumber: incoming.accountNumber,
        balanceAsOf: incoming.balanceAsOf || new Date().toISOString().split('T')[0],
        url: incoming.url,
        notes: incoming.notes,
        isBusiness: !!incoming.isBusiness
      };

      // Add to database
      await addRecord(newRecordData);
      createdCount++;
    } else if (item.action === 'UPDATE' && item.existingRecord) {
      const ex = item.existingRecord;
      const incoming = item.incomingAccount;

      // Save previous state for undo
      previousRecordStates[ex.id] = {
        name: ex.name,
        category: ex.category,
        lenderName: ex.lenderName,
        currentBalance: ex.currentBalance,
        creditLimit: ex.creditLimit,
        accountNumber: ex.accountNumber,
        balanceAsOf: ex.balanceAsOf,
        url: ex.url,
        notes: ex.notes,
        isBusiness: ex.isBusiness
      };

      const updatedFields: Partial<DebtRecord> = {
        currentBalance: String(incoming.currentBalance || ex.currentBalance || '$0'),
        balanceAsOf: incoming.balanceAsOf || new Date().toISOString().split('T')[0]
      };
      if (incoming.creditLimit) updatedFields.creditLimit = String(incoming.creditLimit);
      if (incoming.lenderName) updatedFields.lenderName = incoming.lenderName;
      if (incoming.notes) updatedFields.notes = incoming.notes;
      if (incoming.url) updatedFields.url = incoming.url;

      await updateRecord(ex.id, updatedFields);
      updatedCount++;
    }
  }

  const snapshot: SyncSnapshot = {
    id: `sync-${Date.now()}`,
    timestamp: Date.now(),
    sourceApp: "What's My Credit Worth",
    summaryText: `Synced ${selectedItems.length} accounts: ${createdCount} created, ${updatedCount} updated.`,
    createdRecordIds,
    previousRecordStates,
    isReverted: false
  };

  saveSyncSnapshot(snapshot);
  return snapshot;
};

/**
 * Snapshot Storage Management
 */
export const getSyncSnapshots = (): SyncSnapshot[] => {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

export const saveSyncSnapshot = (snapshot: SyncSnapshot) => {
  try {
    const snapshots = getSyncSnapshots();
    snapshots.unshift(snapshot);
    // Keep last 15 snapshots
    const trimmed = snapshots.slice(0, 15);
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save snapshot', e);
  }
};

export const getLatestActiveSnapshot = (): SyncSnapshot | null => {
  const snapshots = getSyncSnapshots();
  return snapshots.find(s => !s.isReverted) || null;
};

/**
 * Revert / Undo a Sync Snapshot
 */
export const undoSyncSnapshot = async (
  snapshotId: string,
  updateRecord: (id: string, record: any) => Promise<void>,
  deleteRecord: (id: string) => Promise<void>
): Promise<{ success: boolean; revertedUpdates: number; deletedCreated: number }> => {
  const snapshots = getSyncSnapshots();
  const snapshot = snapshots.find(s => s.id === snapshotId);
  if (!snapshot || snapshot.isReverted) {
    return { success: false, revertedUpdates: 0, deletedCreated: 0 };
  }

  let revertedUpdates = 0;
  let deletedCreated = 0;

  // Revert updated records
  for (const [id, prevState] of Object.entries(snapshot.previousRecordStates)) {
    try {
      await updateRecord(id, prevState);
      revertedUpdates++;
    } catch (err) {
      console.error(`Failed to revert record ${id}:`, err);
    }
  }

  // Delete created records (if tracked)
  for (const id of snapshot.createdRecordIds) {
    try {
      await deleteRecord(id);
      deletedCreated++;
    } catch (err) {
      console.error(`Failed to delete record ${id}:`, err);
    }
  }

  // Mark snapshot as reverted
  snapshot.isReverted = true;
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));

  return { success: true, revertedUpdates, deletedCreated };
};

/**
 * Generate 1-Click Export Payload specifically for What's My Credit Worth
 */
export const generateCreditWorthExportPayload = (
  records: FinancialRecord[],
  userEmail?: string
): CreditWorthPayload => {
  const debtRecords = records.filter((r): r is DebtRecord => r.type === 'debt');
  
  let totalBalance = 0;
  let totalLimit = 0;

  const accounts: CreditWorthAccount[] = debtRecords.map(d => {
    const balNum = parseNumberVal(d.currentBalance);
    const limitNum = parseNumberVal(d.creditLimit);
    totalBalance += balNum;
    totalLimit += limitNum;

    return {
      name: d.name,
      lenderName: d.lenderName || d.name,
      category: d.category,
      currentBalance: d.currentBalance || '$0',
      creditLimit: d.creditLimit || '',
      accountNumber: d.accountNumber || '',
      balanceAsOf: d.balanceAsOf || new Date().toISOString().split('T')[0],
      url: d.url || '',
      notes: d.notes || '',
      isBusiness: !!d.isBusiness,
      status: 'Active'
    };
  });

  const utilRate = totalLimit > 0 ? `${((totalBalance / totalLimit) * 100).toFixed(1)}%` : '0%';

  return {
    app: 'WhatsMyCreditWorth',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    userEmail: userEmail || 'user@example.com',
    summary: {
      totalBalance: formatCurrencyVal(totalBalance),
      totalCreditLimit: formatCurrencyVal(totalLimit),
      totalAccounts: accounts.length,
      utilizationRate: utilRate
    },
    accounts
  };
};

export const downloadCreditWorthJSON = (records: FinancialRecord[], userEmail?: string) => {
  const payload = generateCreditWorthExportPayload(records, userEmail);
  const dataStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const filename = `WhatsMyCreditWorth_Sync_Payload_${new Date().toISOString().split('T')[0]}.json`;
  saveAs(blob, filename);
};
