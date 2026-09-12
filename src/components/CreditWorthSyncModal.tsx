import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  RotateCcw, 
  Upload, 
  Download, 
  Copy, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  CreditCard, 
  Building2, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  HelpCircle,
  FileCode,
  FileSpreadsheet,
  Layers,
  Wallet
} from 'lucide-react';
import { FinancialRecord, DebtRecord, AssetRecord, StockRecord, RecordType } from '../types';
import { 
  CreditWorthAccount, 
  CreditWorthAsset, 
  CreditWorthStock, 
  AccountDiffItem, 
  SyncSnapshot,
  SyncItemType,
  ParsedCreditWorthData,
  parseCreditWorthPayload, 
  generateSyncDiff, 
  executeCreditWorthSync, 
  getSyncSnapshots, 
  undoSyncSnapshot,
  generateCreditWorthExportPayload,
  downloadCreditWorthJSON,
  formatCurrencyVal
} from '../lib/creditWorthSync';
import * as XLSX from 'xlsx';

interface CreditWorthSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: FinancialRecord[];
  addRecord: (record: any) => Promise<void>;
  updateRecord: (id: string, record: any) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  userEmail?: string;
  targetType?: SyncItemType | 'all';
  onSyncComplete?: (snapshot: SyncSnapshot) => void;
}

export const CreditWorthSyncModal: React.FC<CreditWorthSyncModalProps> = ({
  isOpen,
  onClose,
  records,
  addRecord,
  updateRecord,
  deleteRecord,
  userEmail,
  targetType = 'all',
  onSyncComplete
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'export' | 'history'>('sync');
  const [payloadText, setPayloadText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedCreditWorthData>({ debts: [], assets: [], stocks: [] });
  const [diffItems, setDiffItems] = useState<AccountDiffItem[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<SyncItemType | 'all'>('all');
  const [step, setStep] = useState<'input' | 'diff' | 'success'>('input');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<SyncSnapshot[]>([]);
  const [latestSnapshot, setLatestSnapshot] = useState<SyncSnapshot | null>(null);
  const [undoStatus, setUndoStatus] = useState<string | null>(null);
  const [exportScope, setExportScope] = useState<SyncItemType | 'all'>('all');

  const existingDebts = records.filter((r): r is DebtRecord => r.type === 'debt');
  const existingAssets = records.filter((r): r is AssetRecord => r.type === 'asset');
  const existingStocks = records.filter((r): r is StockRecord => r.type === 'stock');

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      setStep('input');
      setPayloadText('');
      setParsedData({ debts: [], assets: [], stocks: [] });
      setDiffItems([]);
      setSelectedCategoryFilter(targetType === 'all' ? 'all' : targetType);
      setExportScope(targetType === 'all' ? 'all' : targetType);
      setErrorMsg(null);
      setUndoStatus(null);
    }
  }, [isOpen, targetType]);

  const loadHistory = () => {
    const history = getSyncSnapshots();
    setSnapshots(history);
    const active = history.find(s => {
      if (s.isReverted) return false;
      if (targetType === 'all') return true;
      return s.typesAffected && s.typesAffected.includes(targetType);
    }) || null;
    setLatestSnapshot(active);
  };

  if (!isOpen) return null;

  // Header dynamic labels
  const getContextTitle = () => {
    if (targetType === 'asset') return 'Asset & Property Synchronization';
    if (targetType === 'stock') return 'Stock & Portfolio Synchronization';
    if (targetType === 'debt') return 'Debt & Credit Line Synchronization';
    return 'Universal Financial Synchronization';
  };

  const getContextDescription = () => {
    if (targetType === 'asset') {
      return 'Seamlessly transfer bank accounts, cash reserves, real estate, and vehicle values from "What\'s My Credit Worth" with 1-click comparison.';
    }
    if (targetType === 'stock') {
      return 'Sync ticker symbols, holdings, market values, and brokerages directly from "What\'s My Credit Worth" with instant undo protection.';
    }
    if (targetType === 'debt') {
      return 'Transfer credit cards, mortgages, auto loans, balances, and credit limits between apps with field-by-field diff review.';
    }
    return 'Synchronize debts, assets, and stocks from "What\'s My Credit Worth" with field-by-field smart comparison and instant 1-Click Undo.';
  };

  // Handle parse from text / clipboard
  const handleParseInput = (rawText?: string) => {
    const textToUse = rawText !== undefined ? rawText : payloadText;
    setErrorMsg(null);

    if (!textToUse.trim()) {
      setErrorMsg('Please paste a sync payload, JSON, or CSV data from "What\'s My Credit Worth".');
      return;
    }

    try {
      const parsed = parseCreditWorthPayload(textToUse, targetType === 'all' ? undefined : targetType);
      const totalCount = parsed.debts.length + parsed.assets.length + parsed.stocks.length;

      if (totalCount === 0) {
        setErrorMsg('Could not recognize any valid debt, asset, or stock records in the provided data. Please verify format.');
        return;
      }

      setParsedData(parsed);

      // Determine initial filter based on available parsed items
      const hasDebts = parsed.debts.length > 0;
      const hasAssets = parsed.assets.length > 0;
      const hasStocks = parsed.stocks.length > 0;

      let initialFilter: SyncItemType | 'all' = 'all';
      if (targetType !== 'all') {
        initialFilter = targetType;
      } else if (hasDebts && !hasAssets && !hasStocks) {
        initialFilter = 'debt';
      } else if (!hasDebts && hasAssets && !hasStocks) {
        initialFilter = 'asset';
      } else if (!hasDebts && !hasAssets && hasStocks) {
        initialFilter = 'stock';
      }
      setSelectedCategoryFilter(initialFilter);

      const diff = generateSyncDiff(records, parsed, targetType === 'all' ? 'all' : targetType);
      setDiffItems(diff);
      setStep('diff');
    } catch (err: any) {
      setErrorMsg(`Error parsing payload: ${err.message || 'Invalid format'}`);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const reader = new FileReader();

    if (file.name.endsWith('.json') || file.name.endsWith('.txt')) {
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setPayloadText(content);
        handleParseInput(content);
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const parsed = parseCreditWorthPayload(workbook, targetType === 'all' ? undefined : targetType);
          const totalCount = parsed.debts.length + parsed.assets.length + parsed.stocks.length;
          if (totalCount === 0) {
            setErrorMsg('No recognizable debt, asset, or stock records found in the spreadsheet.');
            return;
          }
          setParsedData(parsed);
          const diff = generateSyncDiff(records, parsed, targetType === 'all' ? 'all' : targetType);
          setDiffItems(diff);
          setStep('diff');
        } catch (err: any) {
          setErrorMsg(`Failed to parse spreadsheet: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Paste from clipboard helper
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPayloadText(text);
      handleParseInput(text);
    } catch (err) {
      setErrorMsg('Could not access clipboard. Please paste manually into the text area.');
    }
  };

  // Toggle selection in diff
  const handleToggleItem = (id: string) => {
    setDiffItems(prev => prev.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  const handleSelectAll = (select: boolean) => {
    setDiffItems(prev => prev.map(item => {
      if (selectedCategoryFilter !== 'all' && item.recordType !== selectedCategoryFilter) {
        return item;
      }
      return { ...item, selected: select };
    }));
  };

  // Execute sync
  const handleApplySync = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const snapshot = await executeCreditWorthSync(diffItems, addRecord, updateRecord);
      setLatestSnapshot(snapshot);
      loadHistory();
      setStep('success');
      if (onSyncComplete) {
        onSyncComplete(snapshot);
      }
    } catch (err: any) {
      setErrorMsg(`Failed to apply sync: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Undo Snapshot
  const handleUndo = async (snapshotId: string) => {
    setIsProcessing(true);
    setUndoStatus(null);
    try {
      const res = await undoSyncSnapshot(snapshotId, updateRecord, deleteRecord);
      if (res.success) {
        setUndoStatus(`Successfully restored ${res.revertedUpdates} modified records.`);
        loadHistory();
      } else {
        setUndoStatus('Could not revert this snapshot (it may already be reverted).');
      }
    } catch (err: any) {
      setUndoStatus(`Error undoing updates: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy export payload to clipboard
  const handleCopyExportPayload = () => {
    const payload = generateCreditWorthExportPayload(records, userEmail, exportScope);
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Filtered diff items based on category pill
  const visibleDiffItems = diffItems.filter(item => {
    if (selectedCategoryFilter === 'all') return true;
    return item.recordType === selectedCategoryFilter;
  });

  const selectedCount = diffItems.filter(d => d.selected && d.action !== 'UNCHANGED').length;
  const createdCount = diffItems.filter(d => d.selected && d.action === 'CREATE').length;
  const updatedCount = diffItems.filter(d => d.selected && d.action === 'UPDATE').length;
  const unchangedCount = diffItems.filter(d => d.action === 'UNCHANGED').length;

  const debtDiffCount = diffItems.filter(d => d.recordType === 'debt').length;
  const assetDiffCount = diffItems.filter(d => d.recordType === 'asset').length;
  const stockDiffCount = diffItems.filter(d => d.recordType === 'stock').length;

  // Export statistics
  const totalDebtBalance = existingDebts.reduce((sum, d) => sum + (parseFloat(String(d.currentBalance || '0').replace(/[^0-9.-]+/g, '')) || 0), 0);
  const totalAssetValue = existingAssets.reduce((sum, a) => sum + (parseFloat(String(a.currentBalance || a.assetValue || a.currentValue || '0').replace(/[^0-9.-]+/g, '')) || 0), 0);
  const totalStockValue = existingStocks.reduce((sum, s) => sum + (parseFloat(String(s.currentValue || '0').replace(/[^0-9.-]+/g, '')) || 0), 0);
  const netWorthCalculated = (totalAssetValue + totalStockValue) - totalDebtBalance;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-700 via-indigo-800 to-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <ArrowRightLeft className="w-6 h-6 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{getContextTitle()}</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                  What's My Credit Worth Sync
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                {getContextDescription()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => { setActiveTab('sync'); setStep('input'); }}
            className={`flex items-center gap-2 py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'sync'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>1-Click Import & Update</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export for "What's My Credit Worth"</span>
          </button>

          <button
            onClick={() => { setActiveTab('history'); loadHistory(); }}
            className={`flex items-center gap-2 py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Sync History & Undo</span>
            {snapshots.filter(s => !s.isReverted).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: 1-CLICK SYNC & DIFF */}
          {activeTab === 'sync' && (
            <div>
              {step === 'input' && (
                <div className="space-y-6">
                  {/* How it works banner */}
                  <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-indigo-950">
                      <p className="font-semibold text-indigo-900">How 1-Click Synchronization Works:</p>
                      <p className="text-slate-700 mt-1">
                        Export or copy your data from <strong>"What's My Credit Worth"</strong> (debts, assets, or stock portfolios) and paste below or upload the file. Next Steps automatically categorizes items, highlights field-by-field differences, and applies updates in 1 click.
                        <strong className="block mt-1 text-indigo-900">
                          ✓ Every transfer creates a snapshot point with instant 1-Click Undo protection.
                        </strong>
                      </p>
                    </div>
                  </div>

                  {/* Input Options Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Option A: 1-Click Clipboard Paste */}
                    <div className="border border-slate-200 rounded-xl p-5 hover:border-indigo-300 transition-colors bg-white flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-slate-900 font-semibold mb-1">
                          <Copy className="w-4 h-4 text-indigo-600" />
                          <span>Option 1: Paste from Clipboard</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">
                          If you copied JSON, account details, or export tables from "What's My Credit Worth", click below to paste and analyze instantly.
                        </p>
                      </div>
                      <button
                        onClick={handlePasteClipboard}
                        className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg border border-indigo-200 text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>Paste & Review Diff</span>
                      </button>
                    </div>

                    {/* Option B: Upload File */}
                    <div className="border border-slate-200 rounded-xl p-5 hover:border-indigo-300 transition-colors bg-white flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-slate-900 font-semibold mb-1">
                          <Upload className="w-4 h-4 text-indigo-600" />
                          <span>Option 2: Upload File (.json, .xlsx, .csv)</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">
                          Upload your exported JSON or spreadsheet from "What's My Credit Worth" for automated field mapping and diff comparison.
                        </p>
                      </div>
                      <label className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg border border-slate-200 text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>Select File</span>
                        <input
                          type="file"
                          accept=".json,.xlsx,.xls,.csv,.txt"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Manual Paste Text Area */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-slate-400" />
                        <span>Or Paste Raw Payload / JSON / CSV Text:</span>
                      </label>
                      <button
                        onClick={() => {
                          const demoPayload = {
                            app: "WhatsMyCreditWorth",
                            version: "2.0",
                            exportedAt: new Date().toISOString(),
                            debts: [
                              {
                                name: "Chase Sapphire Reserve",
                                lenderName: "Chase Bank",
                                category: "credit-card",
                                currentBalance: "$4,250.00",
                                creditLimit: "$18,000.00",
                                accountNumber: "4821",
                                apr: "21.4"
                              }
                            ],
                            assets: [
                              {
                                name: "Chase Premier Savings",
                                institutionName: "Chase Bank",
                                category: "bank",
                                currentBalance: "$34,500.00",
                                accountNumber: "9912",
                                balanceAsOf: new Date().toISOString().split('T')[0]
                              },
                              {
                                name: "Primary Residence",
                                category: "real-estate",
                                assetValue: "$580,000.00",
                                purchasePrice: "$420,000.00",
                                institutionName: "Direct Property Deed"
                              }
                            ],
                            stocks: [
                              {
                                tickerSymbol: "AAPL",
                                stockCompanyName: "Apple Inc.",
                                name: "Apple Inc. (AAPL)",
                                brokerageCompany: "Charles Schwab",
                                currentValue: "$18,450.00",
                                amountInvested: "$12,000.00",
                                gainLoss: "+$6,450.00",
                                gainLossPercentage: "+53.7%"
                              },
                              {
                                tickerSymbol: "VTI",
                                stockCompanyName: "Vanguard Total Stock Market ETF",
                                name: "Vanguard Total Stock ETF (VTI)",
                                brokerageCompany: "Vanguard",
                                currentValue: "$45,200.00",
                                amountInvested: "$35,000.00",
                                gainLoss: "+$10,200.00",
                                gainLossPercentage: "+29.1%"
                              }
                            ]
                          };
                          setPayloadText(JSON.stringify(demoPayload, null, 2));
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Load Sample Integration Payload
                      </button>
                    </div>

                    <textarea
                      value={payloadText}
                      onChange={(e) => setPayloadText(e.target.value)}
                      placeholder='Paste JSON payload (e.g. {"debts": [...], "assets": [...], "stocks": [...]}) or CSV text from "What&apos;s My Credit Worth"...'
                      rows={6}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Analyze Button */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleParseInput()}
                      disabled={!payloadText.trim()}
                      className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors flex items-center gap-2"
                    >
                      <span>Analyze & Compare Differences</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DIFF & PREVIEW */}
              {step === 'diff' && (
                <div className="space-y-5">
                  {/* Summary Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Sync Comparison ({diffItems.length} Records Found)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Review incoming updates and differences before applying them to your records.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        +{createdCount} New
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        ⚡ {updatedCount} Updates
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                        ✓ {unchangedCount} Unchanged
                      </span>
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <span className="text-xs font-medium text-slate-500 mr-1">Filter View:</span>
                    <button
                      onClick={() => setSelectedCategoryFilter('all')}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        selectedCategoryFilter === 'all'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All Records ({diffItems.length})
                    </button>

                    {debtDiffCount > 0 && (
                      <button
                        onClick={() => setSelectedCategoryFilter('debt')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                          selectedCategoryFilter === 'debt'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Debts ({debtDiffCount})</span>
                      </button>
                    )}

                    {assetDiffCount > 0 && (
                      <button
                        onClick={() => setSelectedCategoryFilter('asset')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                          selectedCategoryFilter === 'asset'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Assets ({assetDiffCount})</span>
                      </button>
                    )}

                    {stockDiffCount > 0 && (
                      <button
                        onClick={() => setSelectedCategoryFilter('stock')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                          selectedCategoryFilter === 'stock'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Stocks ({stockDiffCount})</span>
                      </button>
                    )}
                  </div>

                  {/* Diff Table / Cards */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={visibleDiffItems.length > 0 && visibleDiffItems.every(d => d.selected)}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Record & Details</span>
                      </div>
                      <div className="flex items-center gap-8">
                        <span className="w-48 text-right">Current Value ➔ New Value</span>
                        <span className="w-20 text-center">Action</span>
                      </div>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 bg-white">
                      {visibleDiffItems.map((item) => {
                        const itemName = item.recordType === 'debt' 
                          ? item.incomingAccount.name
                          : item.recordType === 'asset'
                            ? (item.incomingAsset?.name || item.incomingAccount.name)
                            : (item.incomingStock?.name || item.incomingAccount.name);

                        const itemSubtitle = item.recordType === 'debt'
                          ? item.incomingAccount.lenderName
                          : item.recordType === 'asset'
                            ? (item.incomingAsset?.institutionName || item.incomingAsset?.category)
                            : (item.incomingStock?.brokerageCompany || item.incomingStock?.tickerSymbol);

                        const mainValue = item.recordType === 'debt'
                          ? (item.incomingAccount.currentBalance || '$0')
                          : item.recordType === 'asset'
                            ? (item.incomingAsset?.currentBalance || item.incomingAsset?.assetValue || '$0')
                            : (item.incomingStock?.currentValue || '$0');

                        const secondaryDetail = item.recordType === 'debt'
                          ? (item.incomingAccount.creditLimit ? `Limit: ${item.incomingAccount.creditLimit}` : undefined)
                          : item.recordType === 'asset'
                            ? (item.incomingAsset?.category ? `Type: ${item.incomingAsset.category}` : undefined)
                            : (item.incomingStock?.amountInvested ? `Cost: ${item.incomingStock.amountInvested}` : undefined);

                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors ${
                              item.selected ? 'bg-indigo-50/30' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => handleToggleItem(item.id)}
                                className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Type Badge */}
                                  {item.recordType === 'debt' && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-100 text-indigo-700 flex items-center gap-1">
                                      <CreditCard className="w-3 h-3" /> Debt
                                    </span>
                                  )}
                                  {item.recordType === 'asset' && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                      <Building2 className="w-3 h-3" /> Asset
                                    </span>
                                  )}
                                  {item.recordType === 'stock' && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-700 flex items-center gap-1">
                                      <TrendingUp className="w-3 h-3" /> Stock
                                    </span>
                                  )}

                                  <span className="font-semibold text-slate-900 text-sm">
                                    {itemName}
                                  </span>

                                  {itemSubtitle && itemSubtitle !== itemName && (
                                    <span className="text-xs text-slate-500">
                                      ({itemSubtitle})
                                    </span>
                                  )}

                                  {item.recordType === 'stock' && item.incomingStock?.tickerSymbol && (
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200">
                                      {item.incomingStock.tickerSymbol}
                                    </span>
                                  )}

                                  {item.incomingAccount?.isBusiness && (
                                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                      Business
                                    </span>
                                  )}
                                </div>

                                {/* Details & Field Changes */}
                                <div className="mt-1 space-y-0.5">
                                  {item.changes.filter(c => c.hasChanged).map((change, cIdx) => (
                                    <div key={cIdx} className="text-xs flex items-center gap-1.5">
                                      <span className="text-slate-500">{change.label}:</span>
                                      <span className="text-slate-400 line-through">{change.oldValue}</span>
                                      <ArrowRight className="w-3 h-3 text-indigo-500 inline" />
                                      <span className="font-semibold text-indigo-700 bg-indigo-50 px-1 rounded">
                                        {change.newValue}
                                      </span>
                                    </div>
                                  ))}

                                  {item.action === 'UNCHANGED' && (
                                    <div className="text-xs text-slate-400">
                                      Value: {mainValue} (Already in sync)
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-8">
                              <div className="w-48 text-right text-xs">
                                <span className="font-bold text-slate-900">
                                  {mainValue}
                                </span>
                                {secondaryDetail && (
                                  <div className="text-slate-500 text-[11px]">
                                    {secondaryDetail}
                                  </div>
                                )}
                              </div>

                              <div className="w-20 text-center">
                                {item.action === 'CREATE' && (
                                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-700">
                                    + NEW
                                  </span>
                                )}
                                {item.action === 'UPDATE' && (
                                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800">
                                    UPDATE
                                  </span>
                                )}
                                {item.action === 'UNCHANGED' && (
                                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 text-slate-600">
                                    SAME
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setStep('input')}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      ← Back to Input
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleApplySync}
                        disabled={selectedCount === 0 || isProcessing}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center gap-2"
                      >
                        {isProcessing ? (
                          <span>Applying Updates...</span>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>1-Click Apply ({selectedCount} Updates)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: SUCCESS WITH INSTANT UNDO BUTTON */}
              {step === 'success' && (
                <div className="py-8 px-4 text-center space-y-6">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Synchronization Completed Successfully!
                    </h3>
                    <p className="text-sm text-slate-600 max-w-md mx-auto mt-2">
                      {latestSnapshot?.summaryText || 'Your records have been synchronized and updated.'}
                    </p>
                  </div>

                  {/* Instant Undo Card */}
                  <div className="max-w-md mx-auto bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                    <div className="flex items-start gap-3">
                      <RotateCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-amber-900">
                          Did something look inaccurate?
                        </h4>
                        <p className="text-xs text-amber-700 mt-0.5">
                          You can instantly roll back all updates from this sync to their exact prior values.
                        </p>
                        {latestSnapshot && !latestSnapshot.isReverted && (
                          <button
                            onClick={() => handleUndo(latestSnapshot.id)}
                            disabled={isProcessing}
                            className="mt-3 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Undo This Update Now</span>
                          </button>
                        )}
                        {latestSnapshot?.isReverted && (
                          <span className="mt-2 inline-block px-2.5 py-1 bg-amber-200 text-amber-900 rounded text-xs font-semibold">
                            ✓ Updates have been undone and restored
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {undoStatus && (
                    <div className="max-w-md mx-auto p-3 bg-slate-100 rounded-xl text-xs font-medium text-slate-700">
                      {undoStatus}
                    </div>
                  )}

                  <div className="pt-4 flex justify-center gap-3">
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
                    >
                      Done & Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXPORT FOR WHAT'S MY CREDIT WORTH */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-950">
                  <p className="font-semibold text-blue-900">Universal Bi-directional Synchronization:</p>
                  <p className="text-slate-700 mt-1">
                    Export your debts, assets, real estate, and stock holdings formatted specifically for <strong>"What's My Credit Worth"</strong> to keep both systems 100% aligned with complete financial accuracy.
                  </p>
                </div>
              </div>

              {/* Export Scope Selector */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <span className="text-xs font-medium text-slate-500 mr-2">Export Scope:</span>
                <button
                  onClick={() => setExportScope('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    exportScope === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Categories ({existingDebts.length + existingAssets.length + existingStocks.length})
                </button>
                <button
                  onClick={() => setExportScope('debt')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    exportScope === 'debt'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Debts ({existingDebts.length})
                </button>
                <button
                  onClick={() => setExportScope('asset')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    exportScope === 'asset'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Assets ({existingAssets.length})
                </button>
                <button
                  onClick={() => setExportScope('stock')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    exportScope === 'stock'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Stocks ({existingStocks.length})
                </button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <div className="text-xs text-slate-500">Total Debt Balance</div>
                  <div className="text-lg font-bold text-red-600 mt-0.5">
                    {formatCurrencyVal(totalDebtBalance)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{existingDebts.length} accounts</div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <div className="text-xs text-slate-500">Total Asset Value</div>
                  <div className="text-lg font-bold text-emerald-600 mt-0.5">
                    {formatCurrencyVal(totalAssetValue)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{existingAssets.length} assets</div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <div className="text-xs text-slate-500">Total Stock Portfolio</div>
                  <div className="text-lg font-bold text-purple-600 mt-0.5">
                    {formatCurrencyVal(totalStockValue)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{existingStocks.length} holdings</div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <div className="text-xs text-slate-500">Estimated Net Worth</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {formatCurrencyVal(netWorthCalculated)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Assets + Stocks - Debt</div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => downloadCreditWorthJSON(records, userEmail, exportScope)}
                  className="p-5 border-2 border-indigo-100 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 rounded-2xl flex items-center gap-4 transition-all text-left group"
                >
                  <div className="p-3 bg-indigo-600 text-white rounded-xl group-hover:scale-105 transition-transform">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-base">Download Sync Payload (.json)</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Formatted for 1-click import into "What's My Credit Worth"
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleCopyExportPayload}
                  className="p-5 border-2 border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 rounded-2xl flex items-center gap-4 transition-all text-left group"
                >
                  <div className="p-3 bg-slate-800 text-white rounded-xl group-hover:scale-105 transition-transform">
                    {copied ? <Check className="w-6 h-6 text-emerald-400" /> : <Copy className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-base">
                      {copied ? 'Copied to Clipboard!' : 'Copy Payload to Clipboard'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Paste directly into What's My Credit Worth
                    </div>
                  </div>
                </button>
              </div>

              {/* Code Preview */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Payload Preview ({exportScope.toUpperCase()}):</span>
                  <span className="text-slate-400">JSON Format (v2.0)</span>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(generateCreditWorthExportPayload(records, userEmail, exportScope), null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: SYNC HISTORY & AUDIT LOG */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Sync Restore Points & Undo Log</h3>
                  <p className="text-xs text-slate-500">
                    Every transfer creates a backup point so you can revert updates with 1 click at any time.
                  </p>
                </div>
              </div>

              {undoStatus && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium text-amber-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>{undoStatus}</span>
                </div>
              )}

              {snapshots.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">No sync history recorded yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sync history will appear here once you transfer records from "What's My Credit Worth".
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {snapshots.map((snap) => {
                    const date = new Date(snap.timestamp).toLocaleString();
                    const updatedCount = Object.keys(snap.previousRecordStates).length;
                    const createdCount = snap.createdRecordIds.length;
                    const typesLabel = snap.typesAffected?.map(t => t.toUpperCase()).join(', ') || 'RECORDS';

                    return (
                      <div key={snap.id} className="p-4 bg-white hover:bg-slate-50 flex items-center justify-between transition-colors">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{snap.sourceApp}</span>
                            <span className="text-xs text-slate-400">• {date}</span>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {typesLabel}
                            </span>
                            {snap.isReverted ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-200 text-slate-600">
                                REVERTED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            {snap.summaryText} ({updatedCount} modified, {createdCount} added)
                          </p>
                        </div>

                        <div>
                          {!snap.isReverted ? (
                            <button
                              onClick={() => handleUndo(snap.id)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                              <span>Undo / Restore</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">
                              Restored to previous state
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
