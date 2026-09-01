import React, { useRef, useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { 
  Download, 
  Upload, 
  FileJson, 
  FileSpreadsheet, 
  FileText, 
  FileCode, 
  AlertCircle, 
  Check, 
  Lock, 
  Sparkles, 
  ChevronDown, 
  Building2, 
  Shield, 
  ScrollText, 
  HelpCircle, 
  Eye, 
  ExternalLink,
  Layers,
  ArrowRight,
  ArrowRightLeft,
  RotateCcw,
  CreditCard
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { FinancialRecord } from '../types';
import PremiumModal from '../components/PremiumModal';
import { 
  ESTATE_PLATFORMS, 
  EstatePlatformId, 
  exportPlatformExcel, 
  exportPlatformCSV, 
  exportPlatformWordDocument, 
  exportPlatformJSON,
  categorizeRecords,
  formatCurrency,
  parseValue
} from '../lib/estatePlanExporters';
import { CreditWorthSyncModal } from '../components/CreditWorthSyncModal';
import { 
  downloadCreditWorthJSON, 
  getLatestActiveSnapshot, 
  undoSyncSnapshot, 
  SyncSnapshot 
} from '../lib/creditWorthSync';

export default function DataManagement() {
  const { records, addRecord, updateRecord, deleteRecord } = useData();
  const { user } = useAuth();
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedPlatform, setSelectedPlatform] = useState<EstatePlatformId>('trust_and_will');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCreditWorthModal, setShowCreditWorthModal] = useState(false);
  const [activeSnapshot, setActiveSnapshot] = useState<SyncSnapshot | null>(null);
  const [undoFeedback, setUndoFeedback] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'all' | 'real_estate' | 'bank' | 'stocks' | 'insurance' | 'business' | 'debts'>('all');

  useEffect(() => {
    const snap = getLatestActiveSnapshot();
    setActiveSnapshot(snap);
  }, [records]);

  const handleQuickUndo = async () => {
    if (!activeSnapshot) return;
    try {
      const res = await undoSyncSnapshot(activeSnapshot.id, updateRecord, deleteRecord);
      if (res.success) {
        setUndoFeedback(`Successfully reverted ${res.revertedUpdates} updated debts.`);
        setActiveSnapshot(null);
        setTimeout(() => setUndoFeedback(null), 5000);
      }
    } catch (e: any) {
      setUndoFeedback(`Failed to undo: ${e.message}`);
    }
  };
  
  const [duplicateResolution, setDuplicateResolution] = useState<{
    duplicates: { existing: FinancialRecord, new: any }[],
    newRecords: any[]
  } | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(true);

  const currentPlatformInfo = ESTATE_PLATFORMS[selectedPlatform];
  const categorized = categorizeRecords(records);

  // Financial Totals
  let totalAssetsVal = 0;
  let totalStocksVal = 0;
  let totalInsuranceVal = 0;
  let totalDebtsVal = 0;

  categorized.assets.forEach(a => {
    totalAssetsVal += parseValue(a.currentBalance || a.currentValue || a.assetValue);
  });
  categorized.stocks.forEach(s => {
    totalStocksVal += parseValue(s.currentValue || s.amountInvested);
  });
  categorized.insurance.forEach(i => {
    totalInsuranceVal += parseValue(i.amount);
  });
  categorized.debts.forEach(d => {
    totalDebtsVal += parseValue(d.currentBalance);
  });

  const netEstateVal = (totalAssetsVal + totalStocksVal) - totalDebtsVal;

  const handleExportExcel = () => {
    if (!user?.isPremium) {
      setShowPremiumModal(true);
      return;
    }
    try {
      setExportError(null);
      exportPlatformExcel(selectedPlatform, records, user?.displayName || undefined);
      setExportSuccess(`Successfully generated ${currentPlatformInfo.name} Excel workbook!`);
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err) {
      console.error('Export error:', err);
      setExportError('Failed to export Excel file. Please try again.');
    }
  };

  const handleExportWord = () => {
    if (!user?.isPremium) {
      setShowPremiumModal(true);
      return;
    }
    try {
      setExportError(null);
      const logoUrl = settings.logoUrl || '/Copilot_NextSteps(EPS).jpg';
      exportPlatformWordDocument(selectedPlatform, records, user?.displayName || undefined, logoUrl);
      setExportSuccess(`Successfully generated ${currentPlatformInfo.name} Schedule of Assets (.doc)!`);
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err) {
      console.error('Export error:', err);
      setExportError('Failed to export Word Document. Please try again.');
    }
  };

  const handleExportCSV = () => {
    if (!user?.isPremium) {
      setShowPremiumModal(true);
      return;
    }
    try {
      setExportError(null);
      exportPlatformCSV(selectedPlatform, records);
      setExportSuccess(`Successfully generated ${currentPlatformInfo.name} CSV file!`);
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err) {
      console.error('Export error:', err);
      setExportError('Failed to export CSV file. Please try again.');
    }
  };

  const handleExportJson = () => {
    if (!user?.isPremium) {
      setShowPremiumModal(true);
      return;
    }
    try {
      setExportError(null);
      exportPlatformJSON(selectedPlatform, records, user?.displayName || undefined);
      setExportSuccess(`Successfully generated ${currentPlatformInfo.name} JSON payload!`);
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err) {
      console.error('Export error:', err);
      setExportError('Failed to export JSON file. Please try again.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        let data: any[] = [];
        
        if (file.name.endsWith('.json')) {
          const jsonStr = event.target?.result as string;
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) {
            data = parsed;
          } else if (parsed.rawRecords && Array.isArray(parsed.rawRecords)) {
            data = parsed.rawRecords;
          } else if (parsed.scheduleOfAssets) {
            // Flatten schedule of assets
            data = [
              ...(parsed.scheduleOfAssets.realEstate || []),
              ...(parsed.scheduleOfAssets.bankAccounts || []),
              ...(parsed.scheduleOfAssets.stocksAndSecurities || []),
              ...(parsed.scheduleOfAssets.lifeInsurancePolicies || []),
              ...(parsed.scheduleOfAssets.businessEntities || []),
              ...(parsed.scheduleOfAssets.debtsAndLiabilities || []),
              ...(parsed.scheduleOfAssets.trustsAndWills || []),
            ];
          } else {
            throw new Error('Invalid JSON structure. Expected an array or Next Steps export format.');
          }
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const binaryStr = event.target?.result;
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          data = XLSX.utils.sheet_to_json(sheet);
        } else {
          throw new Error('Unsupported file format. Please use .json, .xlsx, or .xls');
        }

        if (!Array.isArray(data)) {
          throw new Error('Invalid data format. Expected an array of records.');
        }

        const duplicates: { existing: FinancialRecord, new: any }[] = [];
        const newRecords: any[] = [];

        for (const item of data) {
          if (!item.name || !item.type) {
            // Check if mapped column exists (e.g. from Excel)
            const resolvedName = item.name || item["Item Name"] || item["Property Description / Name"] || item["Account Name / Description"] || item["Holding / Company Name"] || item["Policy Description"] || item["Business Entity Name"];
            const resolvedType = item.type || (item["Record Type"] ? (item["Record Type"].toLowerCase().includes('asset') ? 'asset' : item["Record Type"].toLowerCase().includes('stock') ? 'stock' : item["Record Type"].toLowerCase().includes('debt') ? 'debt' : item["Record Type"].toLowerCase().includes('insurance') ? 'insurance' : item["Record Type"].toLowerCase().includes('trust') ? 'trust' : item["Record Type"].toLowerCase().includes('business') ? 'business' : null) : null);
            
            if (!resolvedName || !resolvedType) {
              console.warn('Skipping unmappable record:', item);
              continue;
            }
            item.name = resolvedName;
            item.type = resolvedType;
          }
          
          const { id, userId, createdAt, updatedAt, ...rest } = item;
          
          const cleanRecord = Object.fromEntries(
            Object.entries(rest).filter(([_, v]) => v !== undefined)
          );
          
          const duplicate = records.find(r => 
            r.name.toLowerCase() === (cleanRecord as any).name.toLowerCase() && 
            r.type === (cleanRecord as any).type
          );
          
          if (duplicate) {
            duplicates.push({ existing: duplicate, new: cleanRecord });
          } else {
            newRecords.push(cleanRecord);
          }
        }

        if (duplicates.length > 0) {
          setDuplicateResolution({ duplicates, newRecords });
        } else {
          let successCount = 0;
          for (const rec of newRecords) {
            await addRecord(rec);
            successCount++;
          }
          setImportStatus({ type: 'success', message: `Successfully imported ${successCount} records.` });
          if (fileInputRef.current) fileInputRef.current.value = '';
        }

      } catch (error) {
        console.error('Import error:', error);
        setImportStatus({ type: 'error', message: `Import failed: ${(error as Error).message}` });
      }
    };

    if (file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  if (!user?.isPremium) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <PremiumModal 
          isOpen={showPremiumModal} 
          onClose={() => setShowPremiumModal(false)} 
          featureName="Data Import/Export & Estate Planning Integrations"
        />
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Premium Feature</h2>
          <p className="text-lg text-slate-600 max-w-lg mb-8">
            Data Import and Export formats for leading Online Estate Planning Applications (LegalZoom, Trust & Will, Quicken WillMaker, FreeWill, GoodTrust, Fabric, Rocket Lawyer) are available exclusively to Premium members.
          </p>
          <button 
            onClick={() => setShowPremiumModal(true)}
            className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="w-5 h-5" />
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Data Import & Export</h2>
          <p className="text-slate-500 mt-1">
            Export your family records formatted specifically for major Online Estate Planning applications, sync with "What's My Credit Worth", or backup your data.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-sm"
          >
            <Eye className="w-4 h-4 text-indigo-600" />
            Preview Export Data ({records.length} Records)
          </button>
        </div>
      </div>

      {/* "What's My Credit Worth" Cross-App Integration Hub */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/60 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Cross-App Integration
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-500/30">
                1-Click Transfer & Undo
              </span>
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white">
              Connect with "What's My Credit Worth"
            </h3>
            <p className="text-sm text-indigo-200 leading-relaxed">
              Instantly synchronize credit cards, mortgages, installment loans, balances, and credit limits between apps. Review field-by-field differences before applying, and easily roll back with <strong>1-Click Undo</strong> if numbers need adjustment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCreditWorthModal(true)}
              className="px-5 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-indigo-100" />
              <span>1-Click Sync & Diff</span>
            </button>

            <button
              onClick={() => downloadCreditWorthJSON(records, user?.email || undefined)}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-indigo-300" />
              <span>Export Payload (.json)</span>
            </button>
          </div>
        </div>

        {/* Undo Banner inside Integration Hub if recent sync exists */}
        {activeSnapshot && !activeSnapshot.isReverted && (
          <div className="mt-6 pt-4 border-t border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-indigo-950/60 p-3.5 rounded-xl border border-indigo-700/50">
            <div className="flex items-center gap-2.5 text-indigo-200">
              <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Active restore point available: <strong>{activeSnapshot.summaryText}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleQuickUndo}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo Updates</span>
              </button>
            </div>
          </div>
        )}

        {undoFeedback && (
          <div className="mt-4 p-3 bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{undoFeedback}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Export & Import */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Estate Planning Application Export Section (8 cols on lg) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Export for Online Estate Planning</h3>
                <p className="text-xs text-slate-500">Choose your target estate planning service from the dropdown below</p>
              </div>
            </div>
            <span className="self-start sm:self-auto text-xs font-semibold bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
              {records.length} Records Loaded
            </span>
          </div>

          {/* Platform Selector Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Select Online Estate Planning Application / Export Format:
            </label>
            <div className="relative">
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value as EstatePlatformId)}
                className="w-full appearance-none bg-slate-50 border-2 border-indigo-100 hover:border-indigo-300 focus:border-indigo-600 focus:bg-white text-slate-900 font-medium text-base rounded-xl px-4 py-3.5 pr-10 transition-all outline-none cursor-pointer shadow-sm"
              >
                <optgroup label="🌟 Online Estate Planning Applications">
                  <option value="fabric">Fabric by Gerber Life</option>
                  <option value="freewill">FreeWill</option>
                  <option value="goodtrust">GoodTrust</option>
                  <option value="legalzoom">LegalZoom (Schedule A & Living Trust Funding)</option>
                  <option value="rocketlawyer">Rocket Lawyer</option>
                  <option value="quicken_willmaker">Quicken WillMaker & Trust (by Nolo)</option>
                  <option value="trust_and_will">Trust & Will (Schedule of Assets)</option>
                </optgroup>
                <optgroup label="📦 General & Backup Formats">
                  <option value="standard">Next Steps Universal Standard (All Fields & Raw Data)</option>
                </optgroup>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-indigo-600">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Selected Platform Details Card */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-slate-900">{currentPlatformInfo.name}</h4>
                  <span className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-md shadow-2xs">
                    {currentPlatformInfo.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Provider: {currentPlatformInfo.provider}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">
              {currentPlatformInfo.description}
            </p>

            {/* Formatted Sheets / Structure preview */}
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Included Schedules & Categories in this Export:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {currentPlatformInfo.sheets.map((sheet, idx) => (
                  <span key={idx} className="text-xs bg-white text-slate-700 font-medium px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    {sheet}
                  </span>
                ))}
              </div>
            </div>

            {/* Platform tips */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1 text-amber-950">
                <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                Workflow Guidance for {currentPlatformInfo.name}:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-900/90 pl-1">
                {currentPlatformInfo.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">
              Download {currentPlatformInfo.name} Formatted Files:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Excel */}
              <button
                onClick={handleExportExcel}
                className="flex items-center justify-between p-4 bg-emerald-50/80 border border-emerald-200 hover:bg-emerald-100/80 text-emerald-950 rounded-xl font-medium transition-all group shadow-sm text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-lg group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Download Excel Workbook</div>
                    <div className="text-xs text-emerald-700">Multi-sheet .xlsx formatted for {currentPlatformInfo.name}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Word Document Schedule of Assets */}
              <button
                onClick={handleExportWord}
                className="flex items-center justify-between p-4 bg-indigo-50/80 border border-indigo-200 hover:bg-indigo-100/80 text-indigo-950 rounded-xl font-medium transition-all group shadow-sm text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-lg group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Schedule of Assets (.doc)</div>
                    <div className="text-xs text-indigo-700">Printable, signable legal schedule for your estate plan</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* CSV */}
              <button
                onClick={handleExportCSV}
                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-900 rounded-xl font-medium transition-all group shadow-sm text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-700 text-white rounded-lg group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Download CSV Table</div>
                    <div className="text-xs text-slate-500">Spreadsheet-compatible .csv summary</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* JSON */}
              <button
                onClick={handleExportJson}
                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-900 rounded-xl font-medium transition-all group shadow-sm text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 text-white rounded-lg group-hover:scale-105 transition-transform">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Download Structured JSON</div>
                    <div className="text-xs text-slate-500">Developer & digital schema payload</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Feedback messages */}
          {exportSuccess && (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl flex items-center gap-2 text-sm border border-emerald-200 animate-in fade-in duration-200">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              {exportSuccess}
            </div>
          )}

          {exportError && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              {exportError}
            </div>
          )}
        </div>

        {/* Import Section (4 cols on lg) */}
        <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Import Data</h3>
                <p className="text-xs text-slate-500">Restore or add records in bulk</p>
              </div>
            </div>
            
            <p className="text-slate-600 text-sm leading-relaxed">
              Upload records from a previously exported Next Steps file or spreadsheet (.json, .xlsx, .xls).
            </p>

            <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1.5">
              <div className="font-semibold text-blue-950 flex items-center gap-1">
                <Check className="w-4 h-4 text-blue-600" />
                Smart Import Protection
              </div>
              <p>Automatic duplicate detection protects existing entries. You can choose whether to overwrite or keep existing records.</p>
            </div>
          </div>

          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-indigo-300 rounded-2xl text-indigo-700 font-semibold bg-indigo-50/50 hover:border-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-all shadow-2xs cursor-pointer"
            >
              <Upload className="w-5 h-5" />
              Select File to Import (.xlsx, .json)
            </button>

            {importStatus && (
              <div className={`p-4 rounded-xl flex items-start gap-3 text-sm ${importStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {importStatus.type === 'success' ? <Check className="w-5 h-5 mt-0.5 shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-600" />}
                <p>{importStatus.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estate Planning Platform Quick Comparison Section */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Supported Online Estate Planning Platforms</h3>
        <p className="text-slate-600 text-sm mb-6">
          Next Steps automatically maps and structures your financial accounts, properties, insurance policies, and business assets to match the specific format of these leading estate planning applications:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(Object.keys(ESTATE_PLATFORMS) as EstatePlatformId[])
            .filter(id => id !== 'standard')
            .map((id) => {
              const p = ESTATE_PLATFORMS[id];
              const isSelected = selectedPlatform === id;
              return (
                <div
                  key={id}
                  onClick={() => setSelectedPlatform(id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected 
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-sm' 
                      : 'border-slate-200 bg-slate-50/40 hover:bg-slate-100/60 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                      {isSelected && (
                        <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded">Active</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{p.tagline}</p>
                  </div>
                  <div className="text-[11px] text-indigo-700 font-medium flex items-center gap-1 mt-2 pt-2 border-t border-slate-200/60">
                    <span>Select format</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Import File Requirements Table */}
      <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Import File Specification</h3>
        <p className="text-slate-600 mb-4 text-sm">
          If importing a custom spreadsheet or JSON array, ensure these required fields are present:
        </p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-100">
              <tr>
                <th className="px-4 py-2.5 rounded-l-lg">Field / Column Name</th>
                <th className="px-4 py-2.5">Required?</th>
                <th className="px-4 py-2.5">Type / Values</th>
                <th className="px-4 py-2.5 rounded-r-lg">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              <tr>
                <td className="px-4 py-2 font-mono text-indigo-600 font-medium">name</td>
                <td className="px-4 py-2 font-semibold text-emerald-600">Yes</td>
                <td className="px-4 py-2">String</td>
                <td className="px-4 py-2">Name of property, account, policy, or holding</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-indigo-600 font-medium">type</td>
                <td className="px-4 py-2 font-semibold text-emerald-600">Yes</td>
                <td className="px-4 py-2">'asset', 'stock', 'debt', 'insurance', 'trust', 'business'</td>
                <td className="px-4 py-2">Category type of the record</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-indigo-600 font-medium">currentBalance / currentValue / amount</td>
                <td className="px-4 py-2 font-medium text-slate-500">No</td>
                <td className="px-4 py-2">Currency (e.g. "$25,000")</td>
                <td className="px-4 py-2">Estimated valuation, account balance, or face coverage</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-indigo-600 font-medium">institutionName / companyName / brokerageCompany</td>
                <td className="px-4 py-2 font-medium text-slate-500">No</td>
                <td className="px-4 py-2">String</td>
                <td className="px-4 py-2">Bank, custodian, insurer, or lender name</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-indigo-600 font-medium">accountNumber</td>
                <td className="px-4 py-2 font-medium text-slate-500">No</td>
                <td className="px-4 py-2">String</td>
                <td className="px-4 py-2">Masked account, policy, or registration number</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-indigo-600 font-medium">isBusiness</td>
                <td className="px-4 py-2 font-medium text-slate-500">No</td>
                <td className="px-4 py-2">Boolean (true / false)</td>
                <td className="px-4 py-2">Indicates if this is a formal business asset or debt</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-indigo-600" />
                  Export Data Preview: {currentPlatformInfo.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reviewing {records.length} records mapped for {currentPlatformInfo.provider}
                </p>
              </div>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Financial Quick Totals in Modal */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-indigo-50/50 border-b border-indigo-100 text-xs">
              <div className="bg-white p-3 rounded-xl border border-indigo-100">
                <span className="text-slate-500 block">Total Assets & Real Estate</span>
                <span className="text-sm font-bold text-slate-900">{formatCurrency(totalAssetsVal)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-indigo-100">
                <span className="text-slate-500 block">Stocks & Portfolios</span>
                <span className="text-sm font-bold text-indigo-700">{formatCurrency(totalStocksVal)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-indigo-100">
                <span className="text-slate-500 block">Life Insurance Coverage</span>
                <span className="text-sm font-bold text-blue-700">{formatCurrency(totalInsuranceVal)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-indigo-100">
                <span className="text-slate-500 block">Total Debts / Loans</span>
                <span className="text-sm font-bold text-rose-700">{formatCurrency(totalDebtsVal)}</span>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setPreviewTab('all')}
                className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap ${previewTab === 'all' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                All Records ({records.length})
              </button>
              <button
                onClick={() => setPreviewTab('real_estate')}
                className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap ${previewTab === 'real_estate' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Real Estate ({categorized.assets.filter(a => a.category === 'real-estate').length})
              </button>
              <button
                onClick={() => setPreviewTab('bank')}
                className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap ${previewTab === 'bank' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Bank & Cash ({categorized.assets.filter(a => a.category !== 'real-estate').length})
              </button>
              <button
                onClick={() => setPreviewTab('stocks')}
                className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap ${previewTab === 'stocks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Stocks ({categorized.stocks.length})
              </button>
              <button
                onClick={() => setPreviewTab('insurance')}
                className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap ${previewTab === 'insurance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Insurance ({categorized.insurance.length})
              </button>
              <button
                onClick={() => setPreviewTab('business')}
                className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap ${previewTab === 'business' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Business ({categorized.businesses.length})
              </button>
              <button
                onClick={() => setPreviewTab('debts')}
                className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap ${previewTab === 'debts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Debts ({categorized.debts.length})
              </button>
            </div>

            {/* Modal Table Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {records.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No records in database. Add assets, stocks, insurance, or debts first.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Type</th>
                        <th className="p-3">Item / Asset Name</th>
                        <th className="p-3">Institution / Carrier</th>
                        <th className="p-3">Account / Ref</th>
                        <th className="p-3">Value / Coverage</th>
                        <th className="p-3">Classification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records
                        .filter(r => {
                          if (previewTab === 'all') return true;
                          if (previewTab === 'real_estate') return r.type === 'asset' && (r as any).category === 'real-estate';
                          if (previewTab === 'bank') return r.type === 'asset' && (r as any).category !== 'real-estate';
                          if (previewTab === 'stocks') return r.type === 'stock';
                          if (previewTab === 'insurance') return r.type === 'insurance';
                          if (previewTab === 'business') return r.type === 'business';
                          if (previewTab === 'debts') return r.type === 'debt';
                          return true;
                        })
                        .map((r, i) => (
                          <tr key={r.id || i} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-semibold uppercase text-indigo-700">{r.type}</td>
                            <td className="p-3 font-medium text-slate-900">{r.name}</td>
                            <td className="p-3 text-slate-600">{(r as any).institutionName || (r as any).companyName || (r as any).brokerageCompany || (r as any).lenderName || '—'}</td>
                            <td className="p-3 text-slate-600">{(r as any).accountNumber || (r as any).tickerSymbol || (r as any).ein || '—'}</td>
                            <td className="p-3 font-bold text-slate-900">
                              {(r as any).currentValue || (r as any).currentBalance || (r as any).amount || (r as any).assetValue || '$0'}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${r.isBusiness ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                                {r.isBusiness ? 'Business' : 'Personal'}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors text-sm"
              >
                Close Preview
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportExcel}
                  className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors text-sm flex items-center gap-1.5 shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Excel
                </button>
                <button
                  onClick={handleExportWord}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors text-sm flex items-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  Download Word Schedule (.doc)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Resolution Modal */}
      {duplicateResolution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Duplicate Records Found</h3>
            <p className="text-slate-600 mb-6 text-sm">
              We found {duplicateResolution.duplicates.length} record(s) with the same name as existing ones. Would you like to update the existing records with the imported data, or keep your current records?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  let successCount = 0;
                  for (const rec of duplicateResolution.newRecords) {
                    await addRecord(rec);
                    successCount++;
                  }
                  for (const dup of duplicateResolution.duplicates) {
                    await updateRecord(dup.existing.id, dup.new);
                    successCount++;
                  }
                  setImportStatus({ type: 'success', message: `Successfully imported and updated ${successCount} records.` });
                  setDuplicateResolution(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 text-sm shadow-sm"
              >
                Update Existing Records
              </button>
              <button
                onClick={async () => {
                  let successCount = 0;
                  for (const rec of duplicateResolution.newRecords) {
                    await addRecord(rec);
                    successCount++;
                  }
                  setImportStatus({ type: 'success', message: `Successfully imported ${successCount} new records. Skipped duplicates.` });
                  setDuplicateResolution(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 text-sm"
              >
                Keep Current Records (Skip Duplicates)
              </button>
              <button
                onClick={() => {
                  setDuplicateResolution(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="w-full py-2.5 text-slate-500 font-medium hover:text-slate-700 mt-2 text-sm"
              >
                Cancel Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* What's My Credit Worth Sync & Undo Modal */}
      <CreditWorthSyncModal
        isOpen={showCreditWorthModal}
        onClose={() => setShowCreditWorthModal(false)}
        records={records}
        addRecord={addRecord}
        updateRecord={updateRecord}
        deleteRecord={deleteRecord}
        userEmail={user?.email || undefined}
        onSyncComplete={(snap) => {
          setActiveSnapshot(snap);
        }}
      />
    </div>
  );
}
