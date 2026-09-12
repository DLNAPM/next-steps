import { 
  FinancialRecord, 
  DebtRecord, 
  AssetRecord, 
  StockRecord, 
  DebtCategory, 
  AssetCategory, 
  RecordType 
} from '../types';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export type SyncItemType = 'debt' | 'asset' | 'stock';

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

export interface CreditWorthAsset {
  name: string;
  category?: AssetCategory | string;
  institutionName?: string;
  currentBalance?: string | number;
  assetValue?: string | number;
  currentValue?: string | number;
  purchasePrice?: string | number;
  accountNumber?: string;
  balanceAsOf?: string;
  url?: string;
  notes?: string;
  isBusiness?: boolean;
}

export interface CreditWorthStock {
  name: string;
  tickerSymbol: string;
  stockCompanyName?: string;
  brokerageCompany?: string;
  currentValue?: string | number;
  amountInvested?: string | number;
  gainLoss?: string | number;
  gainLossPercentage?: string | number;
  accountNumber?: string;
  url?: string;
  notes?: string;
  isBusiness?: boolean;
}

export interface CreditWorthPayload {
  app: 'WhatsMyCreditWorth' | 'NextSteps';
  version: string;
  exportedAt: string;
  userEmail?: string;
  summary?: {
    totalBalance?: number | string; // Total Debt
    totalCreditLimit?: number | string;
    totalAccounts?: number;
    totalAssetValue?: number | string;
    totalStockValue?: number | string;
    netWorth?: number | string;
    utilizationRate?: string;
  };
  accounts?: CreditWorthAccount[]; // debts for backwards compatibility
  debts?: CreditWorthAccount[];
  assets?: CreditWorthAsset[];
  stocks?: CreditWorthStock[];
  records?: any[];
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
  recordType: SyncItemType;
  action: 'CREATE' | 'UPDATE' | 'UNCHANGED';
  selected: boolean;
  incomingAccount: CreditWorthAccount; // kept for backwards compatibility
  incomingAsset?: CreditWorthAsset;
  incomingStock?: CreditWorthStock;
  existingRecord?: FinancialRecord;
  changes: DiffFieldChange[];
}

export interface SyncSnapshot {
  id: string;
  timestamp: number;
  sourceApp: string;
  summaryText: string;
  createdRecordIds: string[];
  previousRecordStates: Record<string, Partial<FinancialRecord>>;
  isReverted: boolean;
  typesAffected: SyncItemType[];
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
  if (c.includes('mortgage') || c.includes('home loan') || c.includes('heloc') || c.includes('equity')) return 'mortgage';
  if (c.includes('llc') || c.includes('business loan') || c.includes('commercial')) return 'llc';
  if (c.includes('loan') || c.includes('auto') || c.includes('student') || c.includes('personal') || c.includes('installment')) return 'loan';
  return 'other';
};

// Map raw categories into Next Steps AssetCategory
export const normalizeAssetCategory = (rawCat?: string): AssetCategory => {
  if (!rawCat) return 'bank';
  const c = rawCat.toLowerCase();
  if (c.includes('check') || c.includes('sav') || c.includes('bank') || c.includes('deposit') || c.includes('money market') || c.includes('cd') || c.includes('cash')) return 'bank';
  if (c.includes('real estate') || c.includes('home') || c.includes('house') || c.includes('condo') || c.includes('property') || c.includes('land')) return 'real-estate';
  if (c.includes('car') || c.includes('auto') || c.includes('boat') || c.includes('motorcycle') || c.includes('vehicle') || c.includes('truck') || c.includes('rv')) return 'car-boat-motorcycle';
  if (c.includes('pension') || c.includes('annuity')) return 'pension';
  if (c.includes('invest') || c.includes('401k') || c.includes('ira') || c.includes('roth') || c.includes('mutual fund') || c.includes('crypto')) return 'investment';
  return 'other';
};

export interface ParsedCreditWorthData {
  debts: CreditWorthAccount[];
  assets: CreditWorthAsset[];
  stocks: CreditWorthStock[];
}

/**
 * Universal Parser for What's My Credit Worth payloads (JSON, text, arrays, CSV data)
 * Extracts Debts, Assets, and Stocks
 */
export const parseCreditWorthPayload = (
  rawInput: any, 
  hintType?: SyncItemType
): ParsedCreditWorthData => {
  const result: ParsedCreditWorthData = {
    debts: [],
    assets: [],
    stocks: []
  };

  if (!rawInput) return result;

  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    // Try JSON
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseCreditWorthPayload(parsed, hintType);
      } catch (err) {
        // Fall through to CSV parsing
      }
    }

    // Attempt CSV/TSV parsing
    try {
      const workbook = XLSX.read(trimmed, { type: 'string' });
      return parseWorkbook(workbook, hintType);
    } catch (e) {
      // ignore
    }
  }

  if (Array.isArray(rawInput)) {
    for (const item of rawInput) {
      classifyAndAddItem(item, result, hintType);
    }
    return result;
  }

  if (typeof rawInput === 'object' && rawInput !== null) {
    // Specific sections in JSON
    if (Array.isArray(rawInput.debts)) {
      for (const d of rawInput.debts) {
        const norm = normalizeAccountObject(d);
        if (norm) result.debts.push(norm);
      }
    }
    if (Array.isArray(rawInput.accounts)) {
      for (const a of rawInput.accounts) {
        classifyAndAddItem(a, result, hintType || 'debt');
      }
    }
    if (Array.isArray(rawInput.assets)) {
      for (const a of rawInput.assets) {
        const norm = normalizeAssetObject(a);
        if (norm) result.assets.push(norm);
      }
    }
    if (Array.isArray(rawInput.stocks) || Array.isArray(rawInput.investments)) {
      const stockList = rawInput.stocks || rawInput.investments;
      for (const s of stockList) {
        const norm = normalizeStockObject(s);
        if (norm) result.stocks.push(norm);
      }
    }
    if (Array.isArray(rawInput.records)) {
      for (const r of rawInput.records) {
        classifyAndAddItem(r, result, hintType);
      }
    }
    if (Array.isArray(rawInput.rawRecords)) {
      for (const r of rawInput.rawRecords) {
        classifyAndAddItem(r, result, hintType);
      }
    }

    // If result is empty, test if rawInput itself is a single record
    if (result.debts.length === 0 && result.assets.length === 0 && result.stocks.length === 0) {
      classifyAndAddItem(rawInput, result, hintType);
    }
  }

  return result;
};

const parseWorkbook = (workbook: XLSX.WorkBook, hintType?: SyncItemType): ParsedCreditWorthData => {
  const result: ParsedCreditWorthData = {
    debts: [],
    assets: [],
    stocks: []
  };

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any>(sheet);
    const sNameLower = sheetName.toLowerCase();
    
    let sheetHint: SyncItemType | undefined = hintType;
    if (sNameLower.includes('debt') || sNameLower.includes('credit') || sNameLower.includes('card') || sNameLower.includes('loan')) {
      sheetHint = 'debt';
    } else if (sNameLower.includes('asset') || sNameLower.includes('real estate') || sNameLower.includes('bank') || sNameLower.includes('cash')) {
      sheetHint = 'asset';
    } else if (sNameLower.includes('stock') || sNameLower.includes('holding') || sNameLower.includes('portfolio') || sNameLower.includes('equity')) {
      sheetHint = 'stock';
    }

    for (const row of rows) {
      classifyAndAddItem(row, result, sheetHint);
    }
  }

  return result;
};

const classifyAndAddItem = (
  item: any, 
  result: ParsedCreditWorthData, 
  hintType?: SyncItemType
) => {
  if (!item || typeof item !== 'object') return;

  const type = String(item.type || '').toLowerCase();
  const category = String(item.category || item["Category"] || item["Account Type"] || '').toLowerCase();

  // Check if explicit stock / investment
  const hasTicker = !!(item.tickerSymbol || item.ticker || item.symbol || item["Ticker"] || item["Symbol"]);
  const hasCreditLimit = !!(item.creditLimit || item.limit || item["Credit Limit"] || item.apr || item["APR"]);
  const hasBrokerage = !!(item.brokerageCompany || item.brokerage || item.broker || item["Brokerage"]);

  if (type === 'stock' || hintType === 'stock' || hasTicker || hasBrokerage) {
    const stock = normalizeStockObject(item);
    if (stock) {
      result.stocks.push(stock);
      return;
    }
  }

  if (type === 'debt' || hintType === 'debt' || hasCreditLimit || 
      category.includes('credit') || category.includes('card') || category.includes('loan') || category.includes('mortgage')) {
    const debt = normalizeAccountObject(item);
    if (debt) {
      result.debts.push(debt);
      return;
    }
  }

  if (type === 'asset' || hintType === 'asset' || 
      item.institutionName || item.purchasePrice || item.assetValue ||
      category.includes('bank') || category.includes('checking') || category.includes('savings') || 
      category.includes('property') || category.includes('estate') || category.includes('vehicle')) {
    const asset = normalizeAssetObject(item);
    if (asset) {
      result.assets.push(asset);
      return;
    }
  }

  // Fallback based on hint or fields
  if (hintType === 'asset') {
    const asset = normalizeAssetObject(item);
    if (asset) { result.assets.push(asset); return; }
  } else if (hintType === 'stock') {
    const stock = normalizeStockObject(item);
    if (stock) { result.stocks.push(stock); return; }
  }

  // Final fallback: try debt normalization
  const fallbackDebt = normalizeAccountObject(item);
  if (fallbackDebt) {
    result.debts.push(fallbackDebt);
  }
};

export const normalizeAccountObject = (item: any): CreditWorthAccount | null => {
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

export const normalizeAssetObject = (item: any): CreditWorthAsset | null => {
  if (!item || typeof item !== 'object') return null;

  const name = 
    item.name || 
    item.assetName || 
    item.accountName || 
    item["Asset Name"] || 
    item["Account Name"] || 
    item["Item Name"] || 
    item["Property Name"] || 
    item.institutionName;

  if (!name) return null;

  const institutionName = 
    item.institutionName || 
    item.bank || 
    item.financialInstitution || 
    item.lender || 
    item["Financial Institution"] || 
    item["Bank / Institution"] || 
    '';

  const currentBalance = 
    item.currentBalance || 
    item.balance || 
    item["Current Balance"] || 
    item["Balance"] || 
    item["Cash Balance"] || 
    '';

  const assetValue = 
    item.assetValue || 
    item.currentValue || 
    item.value || 
    item["Asset Value"] || 
    item["Current Value"] || 
    item["Estimated Value"] || 
    item["Market Value"] || 
    currentBalance || 
    '$0';

  const purchasePrice = 
    item.purchasePrice || 
    item.costBasis || 
    item["Purchase Price"] || 
    item["Cost"] || 
    '';

  const accountNumber = 
    item.accountNumber || 
    item.last4 || 
    item.acctNumber || 
    item["Account Number"] || 
    item["Account #"] || 
    '';

  const category = normalizeAssetCategory(
    item.category || 
    item.assetType || 
    item.type || 
    item["Category"] || 
    item["Asset Type"]
  );

  const isBusiness = 
    item.isBusiness === true || 
    item.isBusiness === 'YES' || 
    item.isBusiness === 'true' || 
    String(item.category || '').toLowerCase().includes('business') ||
    String(item.classification || '').toLowerCase().includes('business');

  const notes = item.notes || item["Notes"] || item["Notes & Instructions"] || undefined;

  return {
    name: String(name).trim(),
    category,
    institutionName: institutionName ? String(institutionName).trim() : undefined,
    currentBalance: currentBalance ? formatCurrencyVal(currentBalance) : undefined,
    assetValue: formatCurrencyVal(assetValue),
    currentValue: item.currentValue ? formatCurrencyVal(item.currentValue) : formatCurrencyVal(assetValue),
    purchasePrice: purchasePrice ? formatCurrencyVal(purchasePrice) : undefined,
    accountNumber: accountNumber ? String(accountNumber).trim() : undefined,
    balanceAsOf: item.balanceAsOf || new Date().toISOString().split('T')[0],
    url: item.url || item.onlineLink || item.websiteUrl || item["Online Link"] || undefined,
    notes,
    isBusiness
  };
};

export const normalizeStockObject = (item: any): CreditWorthStock | null => {
  if (!item || typeof item !== 'object') return null;

  const tickerSymbol = 
    item.tickerSymbol || 
    item.ticker || 
    item.symbol || 
    item["Ticker"] || 
    item["Symbol"] || 
    item["Ticker Symbol"] || 
    '';

  const stockCompanyName = 
    item.stockCompanyName || 
    item.companyName || 
    item.company || 
    item["Company Name"] || 
    item["Stock Name"] || 
    item.name || 
    tickerSymbol;

  const name = 
    item.name || 
    (tickerSymbol ? `${stockCompanyName} (${tickerSymbol})` : stockCompanyName);

  if (!name && !tickerSymbol) return null;

  const brokerageCompany = 
    item.brokerageCompany || 
    item.brokerage || 
    item.broker || 
    item.institutionName || 
    item["Brokerage"] || 
    item["Brokerage Firm"] || 
    '';

  const currentValue = 
    item.currentValue || 
    item.marketValue || 
    item.value || 
    item["Current Value"] || 
    item["Market Value"] || 
    item.amount || 
    '$0';

  const amountInvested = 
    item.amountInvested || 
    item.costBasis || 
    item.invested || 
    item["Amount Invested"] || 
    item["Cost Basis"] || 
    '';

  const gainLoss = 
    item.gainLoss || 
    item["Gain / Loss"] || 
    item["Gain/Loss"] || 
    '';

  const gainLossPercentage = 
    item.gainLossPercentage || 
    item["Gain / Loss %"] || 
    item["Gain %"] || 
    '';

  const accountNumber = 
    item.accountNumber || 
    item.last4 || 
    item.acctNumber || 
    item["Account Number"] || 
    item["Account #"] || 
    '';

  const isBusiness = 
    item.isBusiness === true || 
    item.isBusiness === 'YES' || 
    item.isBusiness === 'true' || 
    String(item.category || '').toLowerCase().includes('business');

  const notes = item.notes || item["Notes"] || item["Notes & Instructions"] || undefined;

  return {
    name: String(name).trim(),
    tickerSymbol: String(tickerSymbol).toUpperCase().trim(),
    stockCompanyName: stockCompanyName ? String(stockCompanyName).trim() : undefined,
    brokerageCompany: brokerageCompany ? String(brokerageCompany).trim() : undefined,
    currentValue: formatCurrencyVal(currentValue),
    amountInvested: amountInvested ? formatCurrencyVal(amountInvested) : undefined,
    gainLoss: gainLoss ? formatCurrencyVal(gainLoss) : undefined,
    gainLossPercentage: gainLossPercentage ? String(gainLossPercentage).trim() : undefined,
    accountNumber: accountNumber ? String(accountNumber).trim() : undefined,
    url: item.url || item.websiteUrl || item["Website"] || undefined,
    notes,
    isBusiness
  };
};

/**
 * Generate Smart Comparison Diff across Debts, Assets, and Stocks
 */
export const generateSyncDiff = (
  existingRecords: FinancialRecord[],
  incomingData: ParsedCreditWorthData | CreditWorthAccount[],
  filterType?: SyncItemType | 'all'
): AccountDiffItem[] => {
  const diffItems: AccountDiffItem[] = [];

  // Normalize incomingData if legacy array was passed
  const parsedData: ParsedCreditWorthData = Array.isArray(incomingData)
    ? { debts: incomingData, assets: [], stocks: [] }
    : incomingData;

  const existingDebts = existingRecords.filter((r): r is DebtRecord => r.type === 'debt');
  const existingAssets = existingRecords.filter((r): r is AssetRecord => r.type === 'asset');
  const existingStocks = existingRecords.filter((r): r is StockRecord => r.type === 'stock');

  // ==========================================
  // 1. PROCESS DEBTS
  // ==========================================
  if (!filterType || filterType === 'all' || filterType === 'debt') {
    for (let idx = 0; idx < parsedData.debts.length; idx++) {
      const incoming = parsedData.debts[idx];

      const existing = existingDebts.find(e => {
        if (incoming.accountNumber && e.accountNumber && incoming.accountNumber.length >= 3 && e.accountNumber.length >= 3) {
          if (incoming.accountNumber === e.accountNumber) return true;
          const incLast4 = incoming.accountNumber.replace(/[^0-9]/g, '').slice(-4);
          const exLast4 = e.accountNumber.replace(/[^0-9]/g, '').slice(-4);
          if (incLast4 && exLast4 && incLast4 === exLast4) return true;
        }

        const eNameNorm = e.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const incNameNorm = incoming.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (eNameNorm === incNameNorm) return true;

        if (incoming.lenderName && e.lenderName && 
            incoming.lenderName.toLowerCase() === e.lenderName.toLowerCase() &&
            (eNameNorm.includes(incNameNorm) || incNameNorm.includes(eNameNorm))) {
          return true;
        }

        return false;
      });

      if (!existing) {
        const changes: DiffFieldChange[] = [
          { fieldName: 'name', label: 'Debt / Card Name', oldValue: '—', newValue: incoming.name, hasChanged: true },
          { fieldName: 'currentBalance', label: 'Current Balance', oldValue: '$0', newValue: String(incoming.currentBalance || '$0'), hasChanged: true },
          { fieldName: 'creditLimit', label: 'Credit Limit', oldValue: '—', newValue: String(incoming.creditLimit || '—'), hasChanged: !!incoming.creditLimit },
          { fieldName: 'lenderName', label: 'Lender / Bank', oldValue: '—', newValue: String(incoming.lenderName || '—'), hasChanged: !!incoming.lenderName },
          { fieldName: 'category', label: 'Category', oldValue: '—', newValue: String(incoming.category || 'credit-card'), hasChanged: true },
          { fieldName: 'isBusiness', label: 'Account Type', oldValue: '—', newValue: incoming.isBusiness ? 'Business Debt' : 'Personal Debt', hasChanged: true }
        ];

        diffItems.push({
          id: `new-debt-${idx}-${Date.now()}`,
          recordType: 'debt',
          action: 'CREATE',
          selected: true,
          incomingAccount: incoming,
          changes
        });
      } else {
        const changes: DiffFieldChange[] = [];
        let anyFieldChanged = false;

        const oldBal = formatCurrencyVal(existing.currentBalance);
        const newBal = formatCurrencyVal(incoming.currentBalance);
        const balChanged = parseNumberVal(oldBal) !== parseNumberVal(newBal);
        changes.push({ fieldName: 'currentBalance', label: 'Current Balance', oldValue: oldBal, newValue: newBal, hasChanged: balChanged });
        if (balChanged) anyFieldChanged = true;

        const oldLimit = existing.creditLimit ? formatCurrencyVal(existing.creditLimit) : '—';
        const newLimit = incoming.creditLimit ? formatCurrencyVal(incoming.creditLimit) : (existing.creditLimit || '—');
        const limitChanged = incoming.creditLimit ? (parseNumberVal(oldLimit) !== parseNumberVal(newLimit)) : false;
        changes.push({ fieldName: 'creditLimit', label: 'Credit Limit', oldValue: oldLimit, newValue: newLimit, hasChanged: limitChanged });
        if (limitChanged) anyFieldChanged = true;

        const oldLender = existing.lenderName || '—';
        const newLender = incoming.lenderName || existing.lenderName || '—';
        const lenderChanged = !!incoming.lenderName && incoming.lenderName !== existing.lenderName;
        changes.push({ fieldName: 'lenderName', label: 'Lender / Bank', oldValue: oldLender, newValue: newLender, hasChanged: lenderChanged });
        if (lenderChanged) anyFieldChanged = true;

        const oldNotes = existing.notes || '—';
        const newNotes = incoming.notes || existing.notes || '—';
        const notesChanged = !!incoming.notes && incoming.notes !== existing.notes;
        changes.push({ fieldName: 'notes', label: 'Notes & APR', oldValue: oldNotes, newValue: newNotes, hasChanged: notesChanged });
        if (notesChanged) anyFieldChanged = true;

        diffItems.push({
          id: existing.id,
          recordType: 'debt',
          action: anyFieldChanged ? 'UPDATE' : 'UNCHANGED',
          selected: anyFieldChanged,
          incomingAccount: incoming,
          existingRecord: existing,
          changes
        });
      }
    }
  }

  // ==========================================
  // 2. PROCESS ASSETS
  // ==========================================
  if (!filterType || filterType === 'all' || filterType === 'asset') {
    for (let idx = 0; idx < parsedData.assets.length; idx++) {
      const incoming = parsedData.assets[idx];

      const existing = existingAssets.find(e => {
        if (incoming.accountNumber && e.accountNumber && incoming.accountNumber.length >= 3 && e.accountNumber.length >= 3) {
          if (incoming.accountNumber === e.accountNumber) return true;
          const incLast4 = incoming.accountNumber.replace(/[^0-9]/g, '').slice(-4);
          const exLast4 = e.accountNumber.replace(/[^0-9]/g, '').slice(-4);
          if (incLast4 && exLast4 && incLast4 === exLast4) return true;
        }

        const eNameNorm = e.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const incNameNorm = incoming.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (eNameNorm === incNameNorm) return true;

        if (incoming.institutionName && e.institutionName &&
            incoming.institutionName.toLowerCase() === e.institutionName.toLowerCase() &&
            (eNameNorm.includes(incNameNorm) || incNameNorm.includes(eNameNorm))) {
          return true;
        }

        return false;
      });

      // Synthetic incoming account object for backwards compatibility
      const dummyAccount: CreditWorthAccount = {
        name: incoming.name,
        lenderName: incoming.institutionName || incoming.name,
        currentBalance: incoming.currentBalance || incoming.assetValue || '$0',
        accountNumber: incoming.accountNumber,
        category: incoming.category,
        notes: incoming.notes,
        isBusiness: incoming.isBusiness
      };

      if (!existing) {
        const changes: DiffFieldChange[] = [
          { fieldName: 'name', label: 'Asset Name', oldValue: '—', newValue: incoming.name, hasChanged: true },
          { fieldName: 'assetValue', label: 'Estimated Value / Balance', oldValue: '$0', newValue: String(incoming.assetValue || incoming.currentBalance || '$0'), hasChanged: true },
          { fieldName: 'institutionName', label: 'Institution / Bank', oldValue: '—', newValue: String(incoming.institutionName || '—'), hasChanged: !!incoming.institutionName },
          { fieldName: 'category', label: 'Category', oldValue: '—', newValue: String(incoming.category || 'bank'), hasChanged: true },
          { fieldName: 'isBusiness', label: 'Ownership', oldValue: '—', newValue: incoming.isBusiness ? 'Business Asset' : 'Personal Asset', hasChanged: true }
        ];

        diffItems.push({
          id: `new-asset-${idx}-${Date.now()}`,
          recordType: 'asset',
          action: 'CREATE',
          selected: true,
          incomingAccount: dummyAccount,
          incomingAsset: incoming,
          changes
        });
      } else {
        const changes: DiffFieldChange[] = [];
        let anyFieldChanged = false;

        // Balance or Value check
        const oldVal = formatCurrencyVal(existing.currentBalance || existing.assetValue || existing.currentValue || '$0');
        const newVal = formatCurrencyVal(incoming.currentBalance || incoming.assetValue || incoming.currentValue || '$0');
        const valChanged = parseNumberVal(oldVal) !== parseNumberVal(newVal);
        changes.push({ fieldName: 'assetValue', label: 'Balance / Value', oldValue: oldVal, newValue: newVal, hasChanged: valChanged });
        if (valChanged) anyFieldChanged = true;

        // Institution check
        const oldInst = existing.institutionName || '—';
        const newInst = incoming.institutionName || existing.institutionName || '—';
        const instChanged = !!incoming.institutionName && incoming.institutionName !== existing.institutionName;
        changes.push({ fieldName: 'institutionName', label: 'Institution', oldValue: oldInst, newValue: newInst, hasChanged: instChanged });
        if (instChanged) anyFieldChanged = true;

        // Notes check
        const oldNotes = existing.notes || '—';
        const newNotes = incoming.notes || existing.notes || '—';
        const notesChanged = !!incoming.notes && incoming.notes !== existing.notes;
        changes.push({ fieldName: 'notes', label: 'Notes', oldValue: oldNotes, newValue: newNotes, hasChanged: notesChanged });
        if (notesChanged) anyFieldChanged = true;

        diffItems.push({
          id: existing.id,
          recordType: 'asset',
          action: anyFieldChanged ? 'UPDATE' : 'UNCHANGED',
          selected: anyFieldChanged,
          incomingAccount: dummyAccount,
          incomingAsset: incoming,
          existingRecord: existing,
          changes
        });
      }
    }
  }

  // ==========================================
  // 3. PROCESS STOCKS
  // ==========================================
  if (!filterType || filterType === 'all' || filterType === 'stock') {
    for (let idx = 0; idx < parsedData.stocks.length; idx++) {
      const incoming = parsedData.stocks[idx];

      const existing = existingStocks.find(e => {
        if (incoming.tickerSymbol && e.tickerSymbol) {
          if (incoming.tickerSymbol.toUpperCase() === e.tickerSymbol.toUpperCase()) return true;
        }

        const eNameNorm = e.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const incNameNorm = incoming.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (eNameNorm === incNameNorm) return true;

        return false;
      });

      const dummyAccount: CreditWorthAccount = {
        name: incoming.name,
        lenderName: incoming.brokerageCompany || incoming.name,
        currentBalance: incoming.currentValue || '$0',
        accountNumber: incoming.accountNumber,
        category: 'stock',
        notes: incoming.notes,
        isBusiness: incoming.isBusiness
      };

      if (!existing) {
        const changes: DiffFieldChange[] = [
          { fieldName: 'tickerSymbol', label: 'Ticker Symbol', oldValue: '—', newValue: incoming.tickerSymbol || '—', hasChanged: true },
          { fieldName: 'name', label: 'Holding / Company', oldValue: '—', newValue: incoming.name, hasChanged: true },
          { fieldName: 'currentValue', label: 'Current Market Value', oldValue: '$0', newValue: String(incoming.currentValue || '$0'), hasChanged: true },
          { fieldName: 'amountInvested', label: 'Amount Invested', oldValue: '—', newValue: String(incoming.amountInvested || '—'), hasChanged: !!incoming.amountInvested },
          { fieldName: 'brokerageCompany', label: 'Brokerage', oldValue: '—', newValue: String(incoming.brokerageCompany || '—'), hasChanged: !!incoming.brokerageCompany }
        ];

        diffItems.push({
          id: `new-stock-${idx}-${Date.now()}`,
          recordType: 'stock',
          action: 'CREATE',
          selected: true,
          incomingAccount: dummyAccount,
          incomingStock: incoming,
          changes
        });
      } else {
        const changes: DiffFieldChange[] = [];
        let anyFieldChanged = false;

        const oldVal = formatCurrencyVal(existing.currentValue || '$0');
        const newVal = formatCurrencyVal(incoming.currentValue || '$0');
        const valChanged = parseNumberVal(oldVal) !== parseNumberVal(newVal);
        changes.push({ fieldName: 'currentValue', label: 'Current Value', oldValue: oldVal, newValue: newVal, hasChanged: valChanged });
        if (valChanged) anyFieldChanged = true;

        const oldInv = existing.amountInvested ? formatCurrencyVal(existing.amountInvested) : '—';
        const newInv = incoming.amountInvested ? formatCurrencyVal(incoming.amountInvested) : (existing.amountInvested || '—');
        const invChanged = incoming.amountInvested ? (parseNumberVal(oldInv) !== parseNumberVal(newInv)) : false;
        changes.push({ fieldName: 'amountInvested', label: 'Amount Invested', oldValue: oldInv, newValue: newInv, hasChanged: invChanged });
        if (invChanged) anyFieldChanged = true;

        const oldBroker = existing.brokerageCompany || '—';
        const newBroker = incoming.brokerageCompany || existing.brokerageCompany || '—';
        const brokerChanged = !!incoming.brokerageCompany && incoming.brokerageCompany !== existing.brokerageCompany;
        changes.push({ fieldName: 'brokerageCompany', label: 'Brokerage Firm', oldValue: oldBroker, newValue: newBroker, hasChanged: brokerChanged });
        if (brokerChanged) anyFieldChanged = true;

        diffItems.push({
          id: existing.id,
          recordType: 'stock',
          action: anyFieldChanged ? 'UPDATE' : 'UNCHANGED',
          selected: anyFieldChanged,
          incomingAccount: dummyAccount,
          incomingStock: incoming,
          existingRecord: existing,
          changes
        });
      }
    }
  }

  return diffItems;
};

/**
 * Execute Sync and record Snapshot for Undo across Debts, Assets, and Stocks
 */
export const executeCreditWorthSync = async (
  diffItems: AccountDiffItem[],
  addRecord: (record: any) => Promise<void>,
  updateRecord: (id: string, record: any) => Promise<void>
): Promise<SyncSnapshot> => {
  const selectedItems = diffItems.filter(i => i.selected && i.action !== 'UNCHANGED');
  const createdRecordIds: string[] = [];
  const previousRecordStates: Record<string, Partial<FinancialRecord>> = {};
  const typesAffectedSet = new Set<SyncItemType>();

  let createdCount = 0;
  let updatedCount = 0;

  for (const item of selectedItems) {
    typesAffectedSet.add(item.recordType);

    if (item.action === 'CREATE') {
      if (item.recordType === 'debt') {
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
        await addRecord(newRecordData);
        createdCount++;
      } else if (item.recordType === 'asset' && item.incomingAsset) {
        const inc = item.incomingAsset;
        const newRecordData = {
          name: inc.name,
          type: 'asset' as const,
          category: (inc.category as AssetCategory) || 'bank',
          institutionName: inc.institutionName || '',
          accountNumber: inc.accountNumber || '',
          currentBalance: inc.currentBalance ? String(inc.currentBalance) : undefined,
          assetValue: inc.assetValue ? String(inc.assetValue) : (inc.currentValue ? String(inc.currentValue) : undefined),
          currentValue: inc.currentValue ? String(inc.currentValue) : undefined,
          purchasePrice: inc.purchasePrice ? String(inc.purchasePrice) : undefined,
          balanceAsOf: inc.balanceAsOf || new Date().toISOString().split('T')[0],
          url: inc.url,
          notes: inc.notes,
          isBusiness: !!inc.isBusiness
        };
        await addRecord(newRecordData);
        createdCount++;
      } else if (item.recordType === 'stock' && item.incomingStock) {
        const inc = item.incomingStock;
        const newRecordData = {
          name: inc.name,
          type: 'stock' as const,
          tickerSymbol: inc.tickerSymbol || '',
          stockCompanyName: inc.stockCompanyName || inc.name,
          brokerageCompany: inc.brokerageCompany || '',
          accountNumber: inc.accountNumber || '',
          amountInvested: inc.amountInvested ? String(inc.amountInvested) : undefined,
          currentValue: inc.currentValue ? String(inc.currentValue) : undefined,
          gainLoss: inc.gainLoss ? String(inc.gainLoss) : undefined,
          gainLossPercentage: inc.gainLossPercentage ? String(inc.gainLossPercentage) : undefined,
          url: inc.url,
          notes: inc.notes,
          isBusiness: !!inc.isBusiness
        };
        await addRecord(newRecordData);
        createdCount++;
      }
    } else if (item.action === 'UPDATE' && item.existingRecord) {
      const ex = item.existingRecord;
      // Save exact previous state for undo
      previousRecordStates[ex.id] = { ...ex };

      if (item.recordType === 'debt') {
        const incoming = item.incomingAccount;
        const updatedFields: Partial<DebtRecord> = {
          currentBalance: String(incoming.currentBalance || (ex as DebtRecord).currentBalance || '$0'),
          balanceAsOf: incoming.balanceAsOf || new Date().toISOString().split('T')[0]
        };
        if (incoming.creditLimit) updatedFields.creditLimit = String(incoming.creditLimit);
        if (incoming.lenderName) updatedFields.lenderName = incoming.lenderName;
        if (incoming.notes) updatedFields.notes = incoming.notes;
        if (incoming.url) updatedFields.url = incoming.url;
        await updateRecord(ex.id, updatedFields);
        updatedCount++;
      } else if (item.recordType === 'asset' && item.incomingAsset) {
        const inc = item.incomingAsset;
        const updatedFields: Partial<AssetRecord> = {};
        if (inc.currentBalance) updatedFields.currentBalance = String(inc.currentBalance);
        if (inc.assetValue) updatedFields.assetValue = String(inc.assetValue);
        if (inc.currentValue) updatedFields.currentValue = String(inc.currentValue);
        if (inc.purchasePrice) updatedFields.purchasePrice = String(inc.purchasePrice);
        if (inc.institutionName) updatedFields.institutionName = inc.institutionName;
        if (inc.accountNumber) updatedFields.accountNumber = inc.accountNumber;
        if (inc.notes) updatedFields.notes = inc.notes;
        if (inc.url) updatedFields.url = inc.url;
        if (inc.balanceAsOf) updatedFields.balanceAsOf = inc.balanceAsOf;
        await updateRecord(ex.id, updatedFields);
        updatedCount++;
      } else if (item.recordType === 'stock' && item.incomingStock) {
        const inc = item.incomingStock;
        const updatedFields: Partial<StockRecord> = {};
        if (inc.currentValue) updatedFields.currentValue = String(inc.currentValue);
        if (inc.amountInvested) updatedFields.amountInvested = String(inc.amountInvested);
        if (inc.gainLoss) updatedFields.gainLoss = String(inc.gainLoss);
        if (inc.gainLossPercentage) updatedFields.gainLossPercentage = String(inc.gainLossPercentage);
        if (inc.brokerageCompany) updatedFields.brokerageCompany = inc.brokerageCompany;
        if (inc.stockCompanyName) updatedFields.stockCompanyName = inc.stockCompanyName;
        if (inc.notes) updatedFields.notes = inc.notes;
        if (inc.url) updatedFields.url = inc.url;
        await updateRecord(ex.id, updatedFields);
        updatedCount++;
      }
    }
  }

  const typesAffected = Array.from(typesAffectedSet);
  const typeLabels = typesAffected.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');

  const snapshot: SyncSnapshot = {
    id: `sync-${Date.now()}`,
    timestamp: Date.now(),
    sourceApp: "What's My Credit Worth",
    summaryText: `Synced ${selectedItems.length} records (${typeLabels || 'Financial'}): ${createdCount} created, ${updatedCount} updated.`,
    createdRecordIds,
    previousRecordStates,
    isReverted: false,
    typesAffected
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
    const trimmed = snapshots.slice(0, 20);
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save snapshot', e);
  }
};

export const getLatestActiveSnapshot = (targetType?: SyncItemType | RecordType): SyncSnapshot | null => {
  const snapshots = getSyncSnapshots();
  return snapshots.find(s => {
    if (s.isReverted) return false;
    if (!targetType) return true;
    if (!s.typesAffected || s.typesAffected.length === 0) return true;
    return s.typesAffected.includes(targetType as SyncItemType);
  }) || null;
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
 * Generate Universal Export Payload for What's My Credit Worth
 * Includes Debts, Assets, and Stocks
 */
export const generateCreditWorthExportPayload = (
  records: FinancialRecord[],
  userEmail?: string,
  exportType?: SyncItemType | 'all'
): CreditWorthPayload => {
  const debtRecords = records.filter((r): r is DebtRecord => r.type === 'debt');
  const assetRecords = records.filter((r): r is AssetRecord => r.type === 'asset');
  const stockRecords = records.filter((r): r is StockRecord => r.type === 'stock');
  
  let totalDebt = 0;
  let totalLimit = 0;
  let totalAssetVal = 0;
  let totalStockVal = 0;

  const accounts: CreditWorthAccount[] = debtRecords.map(d => {
    const balNum = parseNumberVal(d.currentBalance);
    const limitNum = parseNumberVal(d.creditLimit);
    totalDebt += balNum;
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

  const assets: CreditWorthAsset[] = assetRecords.map(a => {
    const val = parseNumberVal(a.currentBalance || a.assetValue || a.currentValue || 0);
    totalAssetVal += val;

    return {
      name: a.name,
      category: a.category,
      institutionName: a.institutionName || '',
      currentBalance: a.currentBalance || '',
      assetValue: a.assetValue || a.currentBalance || '$0',
      currentValue: a.currentValue || '',
      purchasePrice: a.purchasePrice || '',
      accountNumber: a.accountNumber || '',
      balanceAsOf: a.balanceAsOf || new Date().toISOString().split('T')[0],
      url: a.url || '',
      notes: a.notes || '',
      isBusiness: !!a.isBusiness
    };
  });

  const stocks: CreditWorthStock[] = stockRecords.map(s => {
    const val = parseNumberVal(s.currentValue || 0);
    totalStockVal += val;

    return {
      name: s.name,
      tickerSymbol: s.tickerSymbol || '',
      stockCompanyName: s.stockCompanyName || '',
      brokerageCompany: s.brokerageCompany || '',
      currentValue: s.currentValue || '$0',
      amountInvested: s.amountInvested || '',
      gainLoss: s.gainLoss || '',
      gainLossPercentage: s.gainLossPercentage || '',
      accountNumber: s.accountNumber || '',
      url: s.url || '',
      notes: s.notes || '',
      isBusiness: !!s.isBusiness
    };
  });

  const netWorth = (totalAssetVal + totalStockVal) - totalDebt;
  const utilRate = totalLimit > 0 ? `${((totalDebt / totalLimit) * 100).toFixed(1)}%` : '0%';

  return {
    app: 'WhatsMyCreditWorth',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    userEmail: userEmail || 'user@example.com',
    summary: {
      totalBalance: formatCurrencyVal(totalDebt),
      totalCreditLimit: formatCurrencyVal(totalLimit),
      totalAssetValue: formatCurrencyVal(totalAssetVal),
      totalStockValue: formatCurrencyVal(totalStockVal),
      netWorth: formatCurrencyVal(netWorth),
      totalAccounts: accounts.length + assets.length + stocks.length,
      utilizationRate: utilRate
    },
    accounts, // Debts
    debts: accounts,
    assets,
    stocks
  };
};

export const downloadCreditWorthJSON = (
  records: FinancialRecord[], 
  userEmail?: string, 
  exportType: SyncItemType | 'all' = 'all'
) => {
  const payload = generateCreditWorthExportPayload(records, userEmail, exportType);
  const dataStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const filename = `WhatsMyCreditWorth_${exportType.toUpperCase()}_Sync_${new Date().toISOString().split('T')[0]}.json`;
  saveAs(blob, filename);
};
