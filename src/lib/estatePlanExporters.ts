import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FinancialRecord, AssetRecord, StockRecord, DebtRecord, InsuranceRecord, TrustRecord, BusinessRecord } from '../types';

export type EstatePlatformId = 
  | 'standard'
  | 'fabric'
  | 'freewill'
  | 'goodtrust'
  | 'legalzoom'
  | 'rocketlawyer'
  | 'quicken_willmaker'
  | 'trust_and_will';

export interface EstatePlatformInfo {
  id: EstatePlatformId;
  name: string;
  provider: string;
  tagline: string;
  description: string;
  badge: string;
  accentColor: string;
  bgLight: string;
  documentTitle: string;
  sheets: string[];
  tips: string[];
}

export const ESTATE_PLATFORMS: Record<EstatePlatformId, EstatePlatformInfo> = {
  standard: {
    id: 'standard',
    name: 'Universal Standard Format',
    provider: 'Next Steps Financial',
    tagline: 'Complete raw backup of all your family financial records',
    description: 'Comprehensive export containing all raw fields, categories, personal & business tags, and associated identifiers.',
    badge: 'Universal Backup',
    accentColor: 'indigo',
    bgLight: 'bg-indigo-50',
    documentTitle: 'Next Steps - Universal Family Financial Inventory',
    sheets: ['All Records', 'Assets', 'Stocks & Holdings', 'Debts & Loans', 'Insurance Policies', 'Trusts & Wills', 'Business Entities'],
    tips: [
      'Contains all raw record metadata, custom fields, and timestamps.',
      'Can be re-imported into Next Steps at any time without data loss.'
    ]
  },
  fabric: {
    id: 'fabric',
    name: 'Fabric by Gerber Life',
    provider: 'Gerber Life Insurance Company',
    tagline: 'Optimized for Fabric digital wills, term life policies & family organizer',
    description: 'Formatted for Fabric by Gerber Life estate planning and family insurance portal. Categorizes life insurance coverage, policy numbers, bank accounts, digital assets, and primary debts.',
    badge: 'Fabric / Gerber Life',
    accentColor: 'blue',
    bgLight: 'bg-blue-50',
    documentTitle: 'Fabric by Gerber Life - Family Estate & Insurance Inventory',
    sheets: ['Life Insurance Policies', 'Financial Accounts & Cash', 'Real Estate & Property', 'Debts & Liabilities', 'Digital & Emergency Accounts'],
    tips: [
      'Matches Fabric’s family finance & life insurance checklist format.',
      'Use the Life Insurance sheet to enter policy details and designated beneficiaries into your Fabric digital vault.',
      'Includes emergency contact numbers and account numbers for easy reference during will creation.'
    ]
  },
  freewill: {
    id: 'freewill',
    name: 'FreeWill',
    provider: 'FreeWill Co.',
    tagline: 'Formatted for FreeWill self-guided wills, revocable trusts & beneficiary designations',
    description: 'Tailored for FreeWill’s step-by-step estate questionnaire. Formats non-probate financial assets, transfer-on-death (TOD) accounts, real estate, charitable bequests, and liabilities.',
    badge: 'FreeWill Format',
    accentColor: 'emerald',
    bgLight: 'bg-emerald-50',
    documentTitle: 'FreeWill Estate Planning Asset Worksheet & Beneficiary Map',
    sheets: ['Real Property', 'Bank & Brokerage Accounts', 'Stocks & Securities', 'Life Insurance Policies', 'Business Assets', 'Debts & Liabilities'],
    tips: [
      'Structured to match FreeWill’s online questionnaire sections (Real Estate, Financial Accounts, Business Assets).',
      'Highlights accounts with payable-on-death (POD) / transfer-on-death (TOD) designations for probate avoidance.',
      'Provides estimated valuations for accurate net estate calculations.'
    ]
  },
  goodtrust: {
    id: 'goodtrust',
    name: 'GoodTrust',
    provider: 'GoodTrust Inc.',
    tagline: 'Optimized for digital legacy, physical asset vaults & directives',
    description: 'Organized for GoodTrust’s digital executor and estate vault. Highlights website URLs, online account portals, financial institutions, insurance carriers, and digital asset instructions.',
    badge: 'GoodTrust Vault',
    accentColor: 'purple',
    bgLight: 'bg-purple-50',
    documentTitle: 'GoodTrust Digital & Physical Estate Asset Schedule',
    sheets: ['Digital Accounts & Online Portals', 'Financial Assets & Cash', 'Real Estate & Vehicles', 'Life Insurance Directives', 'Debts & Credit Lines', 'Family Trusts'],
    tips: [
      'Separates online login portals and URLs for quick addition to the GoodTrust Digital Vault.',
      'Includes vehicle VIN/AutoCheck references, deed links, and financial institution contact details.',
      'Formatted for both digital legacy planning and traditional estate distribution.'
    ]
  },
  legalzoom: {
    id: 'legalzoom',
    name: 'LegalZoom',
    provider: 'LegalZoom.com, Inc.',
    tagline: 'Standard Schedule of Assets (Schedule A) for Living Trusts & Wills',
    description: 'Formatted in the legal structure required by LegalZoom’s Living Trust Schedule of Assets (Schedule A) and Last Will & Testament asset inventory.',
    badge: 'LegalZoom Schedule A',
    accentColor: 'teal',
    bgLight: 'bg-teal-50',
    documentTitle: 'LegalZoom Estate Plan - Schedule of Assets & Trust Funding Inventory',
    sheets: ['Schedule A - Real Estate', 'Schedule A - Bank & Cash', 'Schedule A - Stocks & Investments', 'Schedule A - Life Insurance', 'Schedule A - Business Interests', 'Liabilities & Mortgages', 'Existing Trusts & Wills'],
    tips: [
      'Generates a compliant Schedule A (Assignment of Property) ready to attach to your LegalZoom Living Trust.',
      'Includes institution names, account numbers, property legal descriptions, and valuation totals.',
      'Can be handed directly to your LegalZoom network attorney or trust funding advisor.'
    ]
  },
  rocketlawyer: {
    id: 'rocketlawyer',
    name: 'Rocket Lawyer',
    provider: 'Rocket Lawyer Inc.',
    tagline: 'Living Trust Asset Assignment & Property Inventory Schedule',
    description: 'Formatted according to Rocket Lawyer’s estate planning templates for Living Trusts, Last Wills, Powers of Attorney, and Property Distribution Schedules.',
    badge: 'Rocket Lawyer Schedule',
    accentColor: 'red',
    bgLight: 'bg-red-50',
    documentTitle: 'Rocket Lawyer Estate Planning Inventory & Asset Assignment Schedule',
    sheets: ['Real Property Schedule', 'Bank & Brokerage Accounts', 'Stocks & Securities', 'Life Insurance & Annuities', 'Business Entity Ownership', 'Debts & Encumbrances'],
    tips: [
      'Organized in the standard Rocket Lawyer Property Schedule format.',
      'Differentiates secured debts (mortgages) from unsecured liabilities.',
      'Includes formal entity details (EIN, State) for transferring business interests to a living trust.'
    ]
  },
  quicken_willmaker: {
    id: 'quicken_willmaker',
    name: 'Quicken WillMaker & Trust (by Nolo)',
    provider: 'Nolo / Quicken',
    tagline: 'Property & Debt Inventory formatted for WillMaker & Trust software',
    description: 'Structured to match the interview questions and asset inventories in Quicken WillMaker & Trust (by Nolo), including specific property bequests, trust property, and debt schedules.',
    badge: 'WillMaker & Trust (Nolo)',
    accentColor: 'amber',
    bgLight: 'bg-amber-50',
    documentTitle: 'Quicken WillMaker & Trust (Nolo) - Property, Asset & Debt Inventory',
    sheets: ['Real Estate & Dwellings', 'Bank Accounts & CDs', 'Stocks & Mutual Funds', 'Life Insurance Policies', 'Business Assets & Ownership', 'Debts & Obligations', 'Existing Trusts & Wills'],
    tips: [
      'Directly corresponds to WillMaker’s "List of Property and Debts" interview chapters.',
      'Includes specific bequest notes and institution account references.',
      'Ideal for keeping a printed copy alongside your signed WillMaker documents in your safe deposit box.'
    ]
  },
  trust_and_will: {
    id: 'trust_and_will',
    name: 'Trust & Will',
    provider: 'Trust & Will (Trust & Will Inc.)',
    tagline: 'Schedule A - Assignment of Property & Trust Funding Worksheet',
    description: 'Engineered specifically for Trust & Will’s modern digital estate questionnaire and Living Trust funding guide. Formats Real Estate, Financial Accounts, Brokerage, Life Insurance, and Business Entities.',
    badge: 'Trust & Will Schedule A',
    accentColor: 'cyan',
    bgLight: 'bg-cyan-50',
    documentTitle: 'Trust & Will - Schedule of Assets & Trust Funding Worksheet',
    sheets: ['Schedule A - Real Property', 'Schedule A - Bank & Cash Accounts', 'Schedule A - Brokerage & Stocks', 'Schedule A - Life Insurance', 'Schedule A - Business Entities', 'Liabilities & Debts', 'Trusts & Directives'],
    tips: [
      'Follows Trust & Will’s exact Schedule of Assets hierarchy for seamless trust funding.',
      'Pre-populates financial institution names, account types, and estimated values for the online portal.',
      'Provides a clean printed Schedule A suitable for notarization and trust execution.'
    ]
  }
};

// Utility to parse currency string into number
export const parseValue = (val?: string | number): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
  return isNaN(num) ? 0 : num;
};

export const formatCurrency = (val?: string | number): string => {
  const num = parseValue(val);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

// Map records to structured categories
export interface CategorizedRecords {
  assets: AssetRecord[];
  stocks: StockRecord[];
  debts: DebtRecord[];
  insurance: InsuranceRecord[];
  trusts: TrustRecord[];
  businesses: BusinessRecord[];
}

export const categorizeRecords = (records: FinancialRecord[]): CategorizedRecords => {
  return {
    assets: records.filter((r): r is AssetRecord => r.type === 'asset'),
    stocks: records.filter((r): r is StockRecord => r.type === 'stock'),
    debts: records.filter((r): r is DebtRecord => r.type === 'debt'),
    insurance: records.filter((r): r is InsuranceRecord => r.type === 'insurance'),
    trusts: records.filter((r): r is TrustRecord => r.type === 'trust'),
    businesses: records.filter((r): r is BusinessRecord => r.type === 'business'),
  };
};

/**
 * Generate Platform-Specific Excel (.xlsx) Workbook
 */
export const exportPlatformExcel = (
  platformId: EstatePlatformId,
  records: FinancialRecord[],
  userName?: string
) => {
  const platform = ESTATE_PLATFORMS[platformId];
  const categorized = categorizeRecords(records);
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().split('T')[0];

  if (platformId === 'standard') {
    // Universal raw export
    const rawData = records.map(r => ({
      ID: r.id,
      Type: r.type.toUpperCase(),
      Name: r.name,
      Category: (r as any).category || (r as any).trustType || '',
      CurrentValue_or_Balance: (r as any).currentValue || (r as any).currentBalance || (r as any).amount || (r as any).assetValue || '',
      Institution_or_Company: (r as any).institutionName || (r as any).companyName || (r as any).brokerageCompany || (r as any).lenderName || '',
      AccountNumber: (r as any).accountNumber || (r as any).ein || '',
      IsBusiness: r.isBusiness ? 'YES' : 'NO',
      WebsiteURL: (r as any).url || (r as any).websiteUrl || '',
      Notes: r.notes || '',
      UpdatedDate: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : ''
    }));
    const rawSheet = XLSX.utils.json_to_sheet(rawData);
    XLSX.utils.book_append_sheet(wb, rawSheet, "All Records");
  }

  // Real Estate / Property Sheet
  const realEstateData = categorized.assets
    .filter(a => a.category === 'real-estate')
    .map(a => {
      if (platformId === 'legalzoom' || platformId === 'trust_and_will') {
        return {
          "Property Description / Name": a.name,
          "Estimated Market Value": a.currentValue || a.assetValue || a.currentBalance || '$0',
          "Original Purchase Price": a.purchasePrice || '',
          "Deed / Recording Link": a.deedUrl || a.url || '',
          "County Clerk Portal": a.countyClerkUrl || '',
          "Ownership / Classification": a.isBusiness ? "Business Owned" : "Personal / Primary",
          "Notes / Legal Description": a.notes || ''
        };
      }
      if (platformId === 'fabric') {
        return {
          "Real Estate Property": a.name,
          "Current Estimated Value": a.currentValue || a.assetValue || a.currentBalance || '$0',
          "Purchase Price": a.purchasePrice || '',
          "Deed Reference / Link": a.deedUrl || a.url || '',
          "Notes": a.notes || ''
        };
      }
      return {
        "Property Name / Address": a.name,
        "Current Market Value": a.currentValue || a.assetValue || a.currentBalance || '$0',
        "Purchase Price": a.purchasePrice || '',
        "Deed / Document Link": a.deedUrl || a.url || '',
        "Property Type": a.isBusiness ? "Commercial / Business" : "Residential",
        "Notes": a.notes || ''
      };
    });

  if (realEstateData.length > 0) {
    const sheetName = platformId === 'legalzoom' || platformId === 'trust_and_will' 
      ? 'Schedule A - Real Estate' 
      : 'Real Property';
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(realEstateData), sheetName);
  }

  // Bank & Cash Accounts Sheet
  const bankData = categorized.assets
    .filter(a => a.category !== 'real-estate')
    .map(a => {
      const isBank = a.category === 'bank';
      return {
        "Account Name / Description": a.name,
        "Financial Institution": a.institutionName || 'Not Specified',
        "Account Type / Category": a.category ? a.category.toUpperCase() : 'CASH/INVESTMENT',
        "Account Number (Masked/Ref)": a.accountNumber || '',
        "Current Balance / Value": a.currentBalance || a.assetValue || '$0',
        "Balance As Of": a.balanceAsOf || '',
        "Online Login Portal": a.url || '',
        "Ownership": a.isBusiness ? "Business Account" : "Individual / Joint",
        "Notes": a.notes || ''
      };
    });

  if (bankData.length > 0) {
    const sheetName = platformId === 'legalzoom' || platformId === 'trust_and_will' 
      ? 'Schedule A - Bank & Cash' 
      : 'Bank & Cash Accounts';
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bankData), sheetName);
  }

  // Stocks & Securities Sheet
  const stockData = categorized.stocks.map(s => ({
    "Holding / Company Name": s.stockCompanyName || s.name,
    "Ticker Symbol": (s.tickerSymbol || '').toUpperCase(),
    "Brokerage / Custodian": s.brokerageCompany || 'Not Specified',
    "Account Number": s.accountNumber || '',
    "Current Market Value": s.currentValue || s.amountInvested || '$0',
    "Total Invested Amount": s.amountInvested || '',
    "Unrealized Gain/Loss": s.gainLoss || '',
    "Gain/Loss %": s.gainLossPercentage || '',
    "Brokerage Portal": s.url || s.websiteUrl || '',
    "Ownership": s.isBusiness ? "Business Owned" : "Personal Portfolio",
    "Notes": s.notes || ''
  }));

  if (stockData.length > 0) {
    const sheetName = platformId === 'legalzoom' || platformId === 'trust_and_will' 
      ? 'Schedule A - Stocks & Inv' 
      : 'Stocks & Securities';
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stockData), sheetName);
  }

  // Life Insurance Sheet
  const insuranceData = categorized.insurance.map(i => ({
    "Insurance Carrier / Company": i.companyName || i.name,
    "Policy Type": i.name,
    "Policy Number": i.accountNumber || '',
    "Death Benefit / Coverage": i.amount || '$0',
    "Representative / Agent": i.representativeName || '',
    "Agent Contact / Phone": i.representativeContact || '',
    "Carrier Portal Link": i.url || '',
    "Ownership": i.isBusiness ? "Key Person / Business" : "Individual",
    "Notes / Beneficiaries": i.notes || ''
  }));

  if (insuranceData.length > 0) {
    const sheetName = platformId === 'legalzoom' || platformId === 'trust_and_will' 
      ? 'Schedule A - Life Insurance' 
      : 'Life Insurance Policies';
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(insuranceData), sheetName);
  }

  // Business Entities Sheet
  const businessData = categorized.businesses.map(b => ({
    "Business Entity Name": b.name,
    "Entity Structure": (b.category || 'LLC').toUpperCase(),
    "EIN / Federal Tax ID": b.ein || b.taxId || '',
    "State of Formation": b.stateOfFormation || '',
    "Formation Date": b.formationDate || '',
    "Ownership Details / %": b.ownerDetails || '',
    "Corporate Portal / Secretary of State": b.url || '',
    "Notes / Operating Agreement": b.notes || ''
  }));

  if (businessData.length > 0) {
    const sheetName = platformId === 'legalzoom' || platformId === 'trust_and_will' 
      ? 'Schedule A - Business Int' 
      : 'Business Assets';
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(businessData), sheetName);
  }

  // Debts & Liabilities Sheet
  const debtData = categorized.debts.map(d => ({
    "Creditor / Lender Name": d.lenderName || d.name,
    "Debt Description / Type": (d.category || 'Loan').toUpperCase(),
    "Account / Loan Number": d.accountNumber || '',
    "Current Outstanding Balance": d.currentBalance || '$0',
    "Credit Limit": d.creditLimit || '',
    "Original Start Balance": d.startBalance || '',
    "Payment Portal Link": d.url || '',
    "Obligation Type": d.isBusiness ? "Business Debt" : "Personal Liability",
    "Notes": d.notes || ''
  }));

  if (debtData.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(debtData), "Debts & Liabilities");
  }

  // Existing Trusts & Estate Documents Sheet
  const trustData = categorized.trusts.map(t => ({
    "Trust or Estate Document Name": t.name,
    "Document Type": (t.trustType || 'Revocable').toUpperCase(),
    "Trustee / Executor Details": t.trusteeDetails || '',
    "Document Storage / URL Link": t.url || '',
    "Notes / Amendments": t.notes || ''
  }));

  if (trustData.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trustData), "Family Trusts & Wills");
  }

  // If no records in specific categories, create an overview sheet
  if (wb.SheetNames.length === 0) {
    const emptySheet = XLSX.utils.json_to_sheet([{ "Status": "No records entered yet." }]);
    XLSX.utils.book_append_sheet(wb, emptySheet, "Overview");
  }

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `${platform.name.replace(/[^a-zA-Z0-9]/g, '_')}_Estate_Export_${dateStr}.xlsx`;
  saveAs(blob, filename);
};

/**
 * Generate Platform-Tailored CSV File
 */
export const exportPlatformCSV = (
  platformId: EstatePlatformId,
  records: FinancialRecord[]
) => {
  const platform = ESTATE_PLATFORMS[platformId];
  const dateStr = new Date().toISOString().split('T')[0];

  const rows: any[] = records.map(r => {
    let specificType: string = r.type;
    let valuation = '';
    let institution = '';
    let acct = '';

    switch (r.type) {
      case 'asset':
        const a = r as AssetRecord;
        specificType = `Asset (${a.category})`;
        valuation = a.currentBalance || a.currentValue || a.assetValue || '$0';
        institution = a.institutionName || '';
        acct = a.accountNumber || '';
        break;
      case 'stock':
        const s = r as StockRecord;
        specificType = 'Stock/Security';
        valuation = s.currentValue || s.amountInvested || '$0';
        institution = s.brokerageCompany || '';
        acct = s.accountNumber || s.tickerSymbol || '';
        break;
      case 'debt':
        const d = r as DebtRecord;
        specificType = `Debt (${d.category})`;
        valuation = d.currentBalance || '$0';
        institution = d.lenderName || '';
        acct = d.accountNumber || '';
        break;
      case 'insurance':
        const i = r as InsuranceRecord;
        specificType = 'Life Insurance';
        valuation = i.amount || '$0';
        institution = i.companyName || '';
        acct = i.accountNumber || '';
        break;
      case 'trust':
        const t = r as TrustRecord;
        specificType = `Trust/Will (${t.trustType || 'Estate'})`;
        valuation = 'N/A';
        institution = t.trusteeDetails || '';
        break;
      case 'business':
        const b = r as BusinessRecord;
        specificType = `Business (${b.category || 'LLC'})`;
        valuation = 'Equity Interest';
        institution = b.stateOfFormation ? `Formed in ${b.stateOfFormation}` : '';
        acct = b.ein || b.taxId || '';
        break;
    }

    return {
      "Platform Target": platform.name,
      "Record Type": specificType,
      "Item Name": r.name,
      "Institution / Carrier / Trustee": institution,
      "Account / Policy / EIN Number": acct,
      "Current Value / Amount": valuation,
      "Classification": r.isBusiness ? "Business" : "Personal",
      "Notes & Instructions": r.notes || '',
      "Online Link": (r as any).url || (r as any).websiteUrl || ''
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const csvOutput = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(['\ufeff', csvOutput], { type: 'text/csv;charset=utf-8;' });
  const filename = `${platform.name.replace(/[^a-zA-Z0-9]/g, '_')}_Schedule_${dateStr}.csv`;
  saveAs(blob, filename);
};

/**
 * Generate Platform-Tailored Word Document (.doc) / Printable Schedule of Assets
 */
export const exportPlatformWordDocument = (
  platformId: EstatePlatformId,
  records: FinancialRecord[],
  userName?: string,
  logoUrl?: string
) => {
  const platform = ESTATE_PLATFORMS[platformId];
  const categorized = categorizeRecords(records);
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const safeUserName = userName || 'Valued Client';

  // Calculate totals
  let totalAssets = 0;
  let totalStocks = 0;
  let totalInsurance = 0;
  let totalDebts = 0;

  categorized.assets.forEach(a => {
    totalAssets += parseValue(a.currentBalance || a.currentValue || a.assetValue);
  });
  categorized.stocks.forEach(s => {
    totalStocks += parseValue(s.currentValue || s.amountInvested);
  });
  categorized.insurance.forEach(i => {
    totalInsurance += parseValue(i.amount);
  });
  categorized.debts.forEach(d => {
    totalDebts += parseValue(d.currentBalance);
  });

  const netEstateValue = (totalAssets + totalStocks) - totalDebts;

  let html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${platform.documentTitle}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.5; padding: 20px; }
        h1 { color: #0f172a; font-size: 24pt; margin-bottom: 4pt; border-bottom: 2pt solid #4f46e5; padding-bottom: 6pt; }
        h2 { color: #1e1b4b; font-size: 14pt; margin-top: 18pt; margin-bottom: 6pt; border-bottom: 1pt solid #cbd5e1; padding-bottom: 3pt; }
        h3 { color: #4338ca; font-size: 11pt; margin-top: 10pt; margin-bottom: 4pt; }
        p { margin: 0 0 8pt 0; font-size: 10pt; }
        .meta-box { background-color: #f8fafc; border: 1pt solid #e2e8f0; padding: 10pt; margin-bottom: 15pt; border-radius: 4pt; }
        .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 15pt; }
        .summary-table th { background-color: #4f46e5; color: white; text-align: left; padding: 6pt 8pt; font-size: 9pt; }
        .summary-table td { border-bottom: 1pt solid #e2e8f0; padding: 6pt 8pt; font-size: 9pt; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
        .data-table th { background-color: #f1f5f9; color: #334155; text-align: left; padding: 5pt 7pt; font-size: 8.5pt; font-weight: bold; border-top: 1pt solid #cbd5e1; border-bottom: 1.5pt solid #94a3b8; }
        .data-table td { border-bottom: 1pt solid #f1f5f9; padding: 5pt 7pt; font-size: 8.5pt; }
        .total-row td { font-weight: bold; background-color: #f8fafc; border-top: 1pt solid #cbd5e1; }
        .badge { background-color: #e0e7ff; color: #3730a3; padding: 2pt 5pt; border-radius: 3pt; font-size: 7.5pt; font-weight: bold; }
        .instructions { background-color: #fefce8; border: 1pt solid #fef08a; padding: 8pt; font-size: 8.5pt; color: #854d0e; margin-bottom: 15pt; }
        .sig-block { margin-top: 30pt; page-break-inside: avoid; }
      </style>
    </head>
    <body>
  `;

  if (logoUrl) {
    html += `<img src="${logoUrl}" height="50" style="margin-bottom: 10px;" /><br/>`;
  }

  html += `
    <h1>${platform.documentTitle}</h1>
    <p style="font-size: 11pt; color: #475569; font-weight: 500;">
      Prepared for <strong>${safeUserName}</strong> • Formatted for <strong>${platform.name} (${platform.provider})</strong>
    </p>

    <div class="meta-box">
      <table style="width: 100%;">
        <tr>
          <td style="width: 50%; font-size: 9.5pt;">
            <strong>Document Date:</strong> ${dateStr}<br/>
            <strong>Target Estate Application:</strong> ${platform.name}<br/>
            <strong>Purpose:</strong> Living Trust Funding / Schedule of Assets / Estate Inventory
          </td>
          <td style="width: 50%; font-size: 9.5pt; text-align: right;">
            <strong>Estimated Net Estate Value:</strong> <span style="font-size: 12pt; color: #047857; font-weight: bold;">${formatCurrency(netEstateValue)}</span><br/>
            <strong>Total Life Insurance Protection:</strong> <span style="font-size: 10pt; color: #1d4ed8; font-weight: bold;">${formatCurrency(totalInsurance)}</span>
          </td>
        </tr>
      </table>
    </div>

    <div class="instructions">
      <strong>Platform Usage Instructions:</strong> ${platform.description} Refer to this schedule when completing your <strong>${platform.name}</strong> questionnaires or funding your estate documents.
    </div>

    <h2>Executive Financial Summary</h2>
    <table class="summary-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Total Item Count</th>
          <th>Total Valuation / Benefit</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Real Estate & Bank Assets</strong></td>
          <td>${categorized.assets.length} items</td>
          <td>${formatCurrency(totalAssets)}</td>
        </tr>
        <tr>
          <td><strong>Stocks & Investment Portfolios</strong></td>
          <td>${categorized.stocks.length} holdings</td>
          <td>${formatCurrency(totalStocks)}</td>
        </tr>
        <tr>
          <td><strong>Life Insurance Coverage</strong></td>
          <td>${categorized.insurance.length} policies</td>
          <td>${formatCurrency(totalInsurance)}</td>
        </tr>
        <tr>
          <td><strong>Debts, Mortgages & Liabilities</strong></td>
          <td>${categorized.debts.length} liabilities</td>
          <td style="color: #be123c;">(${formatCurrency(totalDebts)})</td>
        </tr>
        <tr>
          <td><strong>Business Entities & Formal Holdings</strong></td>
          <td>${categorized.businesses.length} registered entities</td>
          <td>Documented in Schedule</td>
        </tr>
        <tr>
          <td><strong>Existing Trusts & Wills</strong></td>
          <td>${categorized.trusts.length} documents</td>
          <td>Documented in Schedule</td>
        </tr>
        <tr class="total-row">
          <td><strong>NET ESTATE VALUATION (Assets - Debts)</strong></td>
          <td><strong>${records.length} Total Records</strong></td>
          <td style="color: #047857; font-size: 10.5pt;"><strong>${formatCurrency(netEstateValue)}</strong></td>
        </tr>
      </tbody>
    </table>
  `;

  // Real Estate Section
  const realEstateAssets = categorized.assets.filter(a => a.category === 'real-estate');
  if (realEstateAssets.length > 0) {
    html += `
      <h2>1. Real Property & Real Estate Assets</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Property Name / Address</th>
            <th>Market Value</th>
            <th>Purchase Price</th>
            <th>Deed / Clerk Portal Link</th>
            <th>Ownership</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
    `;
    realEstateAssets.forEach(a => {
      html += `
        <tr>
          <td><strong>${a.name}</strong></td>
          <td>${a.currentValue || a.assetValue || a.currentBalance || 'Not Specified'}</td>
          <td>${a.purchasePrice || '—'}</td>
          <td>${a.deedUrl ? `<a href="${a.deedUrl}">View Deed</a>` : (a.url ? `<a href="${a.url}">Link</a>` : '—')}</td>
          <td>${a.isBusiness ? '<span class="badge">Business</span>' : 'Personal'}</td>
          <td>${a.notes || '—'}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
  }

  // Bank & Cash Accounts
  const cashAssets = categorized.assets.filter(a => a.category !== 'real-estate');
  if (cashAssets.length > 0) {
    html += `
      <h2>2. Bank Accounts, Cash & Liquid Funds</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Account Name</th>
            <th>Financial Institution</th>
            <th>Account Type</th>
            <th>Account #</th>
            <th>Current Balance</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
    `;
    cashAssets.forEach(a => {
      html += `
        <tr>
          <td><strong>${a.name}</strong></td>
          <td>${a.institutionName || '—'}</td>
          <td>${(a.category || 'Cash').toUpperCase()}</td>
          <td>${a.accountNumber || '—'}</td>
          <td><strong>${a.currentBalance || a.assetValue || '$0'}</strong></td>
          <td>${a.notes || '—'}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
  }

  // Stocks & Securities
  if (categorized.stocks.length > 0) {
    html += `
      <h2>3. Stocks, Securities & Investment Holdings</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Holding / Company</th>
            <th>Ticker</th>
            <th>Brokerage / Custodian</th>
            <th>Account #</th>
            <th>Current Value</th>
            <th>Invested</th>
            <th>Gain / Loss</th>
          </tr>
        </thead>
        <tbody>
    `;
    categorized.stocks.forEach(s => {
      html += `
        <tr>
          <td><strong>${s.stockCompanyName || s.name}</strong></td>
          <td><strong>${(s.tickerSymbol || '').toUpperCase()}</strong></td>
          <td>${s.brokerageCompany || '—'}</td>
          <td>${s.accountNumber || '—'}</td>
          <td><strong>${s.currentValue || s.amountInvested || '$0'}</strong></td>
          <td>${s.amountInvested || '—'}</td>
          <td>${s.gainLoss ? `${s.gainLoss} (${s.gainLossPercentage || ''})` : '—'}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
  }

  // Life Insurance
  if (categorized.insurance.length > 0) {
    html += `
      <h2>4. Life Insurance Policies & Death Benefit Directives</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Policy Description</th>
            <th>Insurance Carrier</th>
            <th>Policy Number</th>
            <th>Death Benefit Coverage</th>
            <th>Agent / Representative</th>
            <th>Notes / Beneficiary</th>
          </tr>
        </thead>
        <tbody>
    `;
    categorized.insurance.forEach(i => {
      html += `
        <tr>
          <td><strong>${i.name}</strong></td>
          <td>${i.companyName || '—'}</td>
          <td>${i.accountNumber || '—'}</td>
          <td style="color: #1d4ed8;"><strong>${i.amount || '$0'}</strong></td>
          <td>${i.representativeName ? `${i.representativeName} (${i.representativeContact || ''})` : '—'}</td>
          <td>${i.notes || '—'}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
  }

  // Business Entities
  if (categorized.businesses.length > 0) {
    html += `
      <h2>5. Formal Business Entities & Ownership Interests</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Business Entity Name</th>
            <th>Structure</th>
            <th>EIN / Tax ID</th>
            <th>State of Formation</th>
            <th>Ownership % / Details</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
    `;
    categorized.businesses.forEach(b => {
      html += `
        <tr>
          <td><strong>${b.name}</strong></td>
          <td>${(b.category || 'LLC').toUpperCase()}</td>
          <td>${b.ein || b.taxId || '—'}</td>
          <td>${b.stateOfFormation || '—'}</td>
          <td>${b.ownerDetails || '—'}</td>
          <td>${b.notes || '—'}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
  }

  // Debts & Liabilities
  if (categorized.debts.length > 0) {
    html += `
      <h2>6. Debts, Mortgages & Encumbrances</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Debt Description</th>
            <th>Lender / Creditor</th>
            <th>Debt Type</th>
            <th>Account #</th>
            <th>Outstanding Balance</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
    `;
    categorized.debts.forEach(d => {
      html += `
        <tr>
          <td><strong>${d.name}</strong></td>
          <td>${d.lenderName || '—'}</td>
          <td>${(d.category || 'Debt').toUpperCase()}</td>
          <td>${d.accountNumber || '—'}</td>
          <td style="color: #be123c;"><strong>${d.currentBalance || '$0'}</strong></td>
          <td>${d.notes || '—'}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
  }

  // Existing Trusts & Wills
  if (categorized.trusts.length > 0) {
    html += `
      <h2>7. Existing Family Trusts & Estate Directives</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Trust / Will Title</th>
            <th>Type</th>
            <th>Trustee / Executor Details</th>
            <th>Document Link</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
    `;
    categorized.trusts.forEach(t => {
      html += `
        <tr>
          <td><strong>${t.name}</strong></td>
          <td>${(t.trustType || 'Revocable').toUpperCase()}</td>
          <td>${t.trusteeDetails || '—'}</td>
          <td>${t.url ? `<a href="${t.url}">View Storage</a>` : '—'}</td>
          <td>${t.notes || '—'}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
  }

  // Signature Block
  html += `
    <div class="sig-block">
      <hr style="border: 0; border-top: 1pt solid #cbd5e1; margin: 25pt 0 15pt 0;" />
      <p style="font-size: 9pt; color: #64748b;">
        <strong>Affirmation of Assets & Schedule of Assignment:</strong><br/>
        I hereby affirm that the schedule of properties, accounts, and policies detailed above represents a true and accurate summary of my family assets and liabilities for integration with <strong>${platform.name}</strong>.
      </p>
      <br/><br/>
      <table style="width: 100%;">
        <tr>
          <td style="width: 45%; border-top: 1pt solid #0f172a; padding-top: 4pt; font-size: 9.5pt;">
            <strong>${safeUserName}</strong><br/>
            Grantor / Policyholder Signature
          </td>
          <td style="width: 10%;"></td>
          <td style="width: 45%; border-top: 1pt solid #0f172a; padding-top: 4pt; font-size: 9.5pt;">
            <strong>Date</strong>
          </td>
        </tr>
      </table>
    </div>

    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const filename = `${platform.name.replace(/[^a-zA-Z0-9]/g, '_')}_Schedule_of_Assets_${new Date().toISOString().split('T')[0]}.doc`;
  saveAs(blob, filename);
};

/**
 * Generate Platform-Tailored JSON File
 */
export const exportPlatformJSON = (
  platformId: EstatePlatformId,
  records: FinancialRecord[],
  userName?: string
) => {
  const platform = ESTATE_PLATFORMS[platformId];
  const categorized = categorizeRecords(records);
  const dateStr = new Date().toISOString();

  const exportPayload = {
    metadata: {
      platform: platform.name,
      platformId: platform.id,
      provider: platform.provider,
      exportedAt: dateStr,
      generatedFor: userName || 'User',
      documentTitle: platform.documentTitle,
      version: "2.0"
    },
    summary: {
      totalRecords: records.length,
      assetCount: categorized.assets.length,
      stockCount: categorized.stocks.length,
      debtCount: categorized.debts.length,
      insuranceCount: categorized.insurance.length,
      trustCount: categorized.trusts.length,
      businessCount: categorized.businesses.length,
    },
    scheduleOfAssets: {
      realEstate: categorized.assets.filter(a => a.category === 'real-estate'),
      bankAccounts: categorized.assets.filter(a => a.category !== 'real-estate'),
      stocksAndSecurities: categorized.stocks,
      lifeInsurancePolicies: categorized.insurance,
      businessEntities: categorized.businesses,
      debtsAndLiabilities: categorized.debts,
      trustsAndWills: categorized.trusts
    },
    rawRecords: records
  };

  const dataStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const filename = `${platform.name.replace(/[^a-zA-Z0-9]/g, '_')}_data_${new Date().toISOString().split('T')[0]}.json`;
  saveAs(blob, filename);
};
