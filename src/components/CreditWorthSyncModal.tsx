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
  ArrowRight, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  HelpCircle,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';
import { FinancialRecord, DebtRecord } from '../types';
import { 
  CreditWorthAccount, 
  AccountDiffItem, 
  SyncSnapshot,
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
  onSyncComplete
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'export' | 'history'>('sync');
  const [payloadText, setPayloadText] = useState('');
  const [parsedAccounts, setParsedAccounts] = useState<CreditWorthAccount[]>([]);
  const [diffItems, setDiffItems] = useState<AccountDiffItem[]>([]);
  const [step, setStep] = useState<'input' | 'diff' | 'success'>('input');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<SyncSnapshot[]>([]);
  const [latestSnapshot, setLatestSnapshot] = useState<SyncSnapshot | null>(null);
  const [undoStatus, setUndoStatus] = useState<string | null>(null);

  // Filter existing debts
  const existingDebts = records.filter((r): r is DebtRecord => r.type === 'debt');

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      setStep('input');
      setPayloadText('');
      setParsedAccounts([]);
      setDiffItems([]);
      setErrorMsg(null);
      setUndoStatus(null);
    }
  }, [isOpen]);

  const loadHistory = () => {
    const history = getSyncSnapshots();
    setSnapshots(history);
    const active = history.find(s => !s.isReverted) || null;
    setLatestSnapshot(active);
  };

  if (!isOpen) return null;

  // Handle parse from text / clipboard
  const handleParseInput = (rawText?: string) => {
    const textToUse = rawText !== undefined ? rawText : payloadText;
    setErrorMsg(null);

    if (!textToUse.trim()) {
      setErrorMsg('Please paste a sync payload, JSON, or CSV data from "What\'s My Credit Worth".');
      return;
    }

    try {
      const accounts = parseCreditWorthPayload(textToUse);
      if (accounts.length === 0) {
        setErrorMsg('Could not find valid debt or credit accounts in the provided data. Please verify the format.');
        return;
      }

      setParsedAccounts(accounts);
      const diff = generateSyncDiff(existingDebts, accounts);
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
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet);
          const accounts = parseCreditWorthPayload(rows);
          if (accounts.length === 0) {
            setErrorMsg('No valid account columns recognized in spreadsheet.');
            return;
          }
          setParsedAccounts(accounts);
          const diff = generateSyncDiff(existingDebts, accounts);
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
    setDiffItems(prev => prev.map(item => ({ ...item, selected: select })));
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
        setUndoStatus(`Successfully restored ${res.revertedUpdates} updated accounts.`);
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
    const payload = generateCreditWorthExportPayload(records, userEmail);
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const selectedCount = diffItems.filter(d => d.selected && d.action !== 'UNCHANGED').length;
  const createdCount = diffItems.filter(d => d.selected && d.action === 'CREATE').length;
  const updatedCount = diffItems.filter(d => d.selected && d.action === 'UPDATE').length;
  const unchangedCount = diffItems.filter(d => d.action === 'UNCHANGED').length;

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
                <h2 className="text-xl font-bold">"What's My Credit Worth" Integration</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                  1-Click Sync & Diff
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Seamlessly transfer credit cards, balances, limits, and loans between apps with instant Undo protection
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
                      <p className="font-semibold text-indigo-900">How 1-Click Transfer Works:</p>
                      <p className="text-slate-700 mt-1">
                        Export or copy your debt/credit accounts from <strong>"What's My Credit Worth"</strong> and paste them here or upload the file. Next Steps will compare balances and limits, show you a side-by-side comparison, and update your debts with a single click. 
                        <strong> If any numbers look incorrect, you can hit "Undo" at any time.</strong>
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
                          If you copied the JSON or account table from "What's My Credit Worth", click below to paste and review instantly.
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
                          <span>Option 2: Upload Export File</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">
                          Select the exported <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">.json</code>, <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">.csv</code>, or <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">.xlsx</code> from What's My Credit Worth.
                        </p>
                      </div>
                      <label className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg border border-slate-300 text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4 text-slate-600" />
                        <span>Browse Files...</span>
                        <input
                          type="file"
                          accept=".json,.csv,.xlsx,.xls,.txt"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Manual Paste Text Area */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Or Paste Raw Payload / Account Text Below:
                    </label>
                    <textarea
                      rows={5}
                      value={payloadText}
                      onChange={(e) => setPayloadText(e.target.value)}
                      placeholder='{"app": "WhatsMyCreditWorth", "accounts": [{"name": "Chase Sapphire", "currentBalance": "$3,850", "creditLimit": "$15,000"}]}'
                      className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
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
                        Sync Comparison ({diffItems.length} Accounts Found)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Review the incoming credit balances and limits before applying.
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

                  {/* Diff Table / Cards */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={diffItems.length > 0 && diffItems.every(d => d.selected)}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Account & Lender</span>
                      </div>
                      <div className="flex items-center gap-8">
                        <span className="w-48 text-right">Current Value ➔ New Value</span>
                        <span className="w-20 text-center">Action</span>
                      </div>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 bg-white">
                      {diffItems.map((item) => (
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
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 text-sm">
                                  {item.incomingAccount.name}
                                </span>
                                {item.incomingAccount.lenderName && item.incomingAccount.lenderName !== item.incomingAccount.name && (
                                  <span className="text-xs text-slate-500">
                                    ({item.incomingAccount.lenderName})
                                  </span>
                                )}
                                {item.incomingAccount.isBusiness && (
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
                                    Balance: {item.incomingAccount.currentBalance} (No changes detected)
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-8">
                            <div className="w-48 text-right text-xs">
                              <span className="font-bold text-slate-900">
                                {item.incomingAccount.currentBalance || '$0'}
                              </span>
                              {item.incomingAccount.creditLimit && (
                                <div className="text-slate-500 text-[11px]">
                                  Limit: {item.incomingAccount.creditLimit}
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
                      ))}
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
                          <span>Updating Records...</span>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>1-Click Apply ({selectedCount} Selected Updates)</span>
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
                      Debts & Balances Successfully Synchronized!
                    </h3>
                    <p className="text-sm text-slate-600 max-w-md mx-auto mt-2">
                      {latestSnapshot?.summaryText || 'Your debt balances and accounts have been updated.'}
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
                          You can instantly roll back all changes from this sync to their exact prior values.
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
                  <p className="font-semibold text-blue-900">Bi-directional Synchronization:</p>
                  <p className="text-slate-700 mt-1">
                    Export your Next Steps debts (credit cards, mortgages, auto loans, personal loans) to import or sync into <strong>"What's My Credit Worth"</strong> to keep both systems 100% aligned.
                  </p>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <div className="text-xs text-slate-500">Total Debt Accounts</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{existingDebts.length}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <div className="text-xs text-slate-500">Total Current Balance</div>
                  <div className="text-xl font-bold text-red-600 mt-1">
                    {formatCurrencyVal(existingDebts.reduce((sum, d) => sum + (parseFloat(String(d.currentBalance || '0').replace(/[^0-9.-]+/g, '')) || 0), 0))}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <div className="text-xs text-slate-500">Total Credit Limit</div>
                  <div className="text-xl font-bold text-emerald-600 mt-1">
                    {formatCurrencyVal(existingDebts.reduce((sum, d) => sum + (parseFloat(String(d.creditLimit || '0').replace(/[^0-9.-]+/g, '')) || 0), 0))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => downloadCreditWorthJSON(records, userEmail)}
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
                  <span>Payload Preview:</span>
                  <span className="text-slate-400">JSON Format (v2.0)</span>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(generateCreditWorthExportPayload(records, userEmail), null, 2)}
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

                    return (
                      <div key={snap.id} className="p-4 bg-white hover:bg-slate-50 flex items-center justify-between transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{snap.sourceApp}</span>
                            <span className="text-xs text-slate-400">• {date}</span>
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
