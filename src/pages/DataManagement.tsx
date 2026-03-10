import React, { useRef, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Download, Upload, FileJson, FileSpreadsheet, AlertCircle, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FinancialRecord } from '../types';

export default function DataManagement() {
  const { records, addRecord, updateRecord } = useData();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [duplicateResolution, setDuplicateResolution] = useState<{
    duplicates: { existing: FinancialRecord, new: any }[],
    newRecords: any[]
  } | null>(null);

  const handleDownloadJson = () => {
    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    saveAs(blob, `next-steps-data-${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(records);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Records");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `next-steps-data-${new Date().toISOString().split('T')[0]}.xlsx`);
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
          data = JSON.parse(jsonStr);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const binaryStr = event.target?.result;
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          data = XLSX.utils.sheet_to_json(sheet);
        } else {
          throw new Error('Unsupported file format. Please use .json or .xlsx');
        }

        if (!Array.isArray(data)) {
          throw new Error('Invalid data format. Expected an array of records.');
        }

        const duplicates: { existing: FinancialRecord, new: any }[] = [];
        const newRecords: any[] = [];

        for (const item of data) {
          // Basic validation
          if (!item.name || !item.type) {
            console.warn('Skipping invalid record:', item);
            continue;
          }
          
          // Sanitize and map fields if necessary
          // We assume the import matches our internal structure or close to it
          // We strip ID/userId/timestamps to let addRecord handle them as new entries
          const { id, userId, createdAt, updatedAt, ...cleanRecord } = item;
          
          const duplicate = records.find(r => r.name.toLowerCase() === cleanRecord.name.toLowerCase() && r.type === cleanRecord.type);
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Data Management</h2>
        <p className="text-slate-500 mt-1">Export your data for backup or import records from external files.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Export Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Export Data</h3>
          </div>
          <p className="text-slate-600 mb-6">
            Download a copy of your financial records. Keep this file secure as it contains sensitive information.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleDownloadExcel}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Download Excel
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors shadow-sm"
            >
              <FileJson className="w-5 h-5" />
              Download JSON
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Import Data</h3>
          </div>
          <p className="text-slate-600 mb-6">
            Upload records from a JSON or Excel file. 
          </p>
          
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
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 font-medium hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
            >
              <Upload className="w-5 h-5" />
              Select File to Import
            </button>

            {importStatus && (
              <div className={`p-4 rounded-lg flex items-start gap-3 ${importStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                {importStatus.type === 'success' ? <Check className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
                <p className="text-sm">{importStatus.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Instructions */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Import File Requirements</h3>
        <p className="text-slate-600 mb-4 text-sm">
          Your file must contain an array of records with the following columns/keys. 
          <span className="font-semibold"> 'name' and 'type' are mandatory.</span>
        </p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-100">
              <tr>
                <th className="px-4 py-2 rounded-l-lg">Field Name</th>
                <th className="px-4 py-2">Required?</th>
                <th className="px-4 py-2 rounded-r-lg">Description / Valid Values</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="px-4 py-2 font-mono text-indigo-600">type</td>
                <td className="px-4 py-2 font-semibold">Yes</td>
                <td className="px-4 py-2">'asset', 'debt', 'insurance'</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-indigo-600">name</td>
                <td className="px-4 py-2 font-semibold">Yes</td>
                <td className="px-4 py-2">Name of the account, property, or policy</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-indigo-600">category</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2">
                  Asset: 'bank', 'real-estate', 'investment', 'pension'<br/>
                  Debt: 'mortgage', 'credit-card', 'loan', 'llc'
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-indigo-600">currentBalance</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2">Current value or amount owed (e.g. "$5,000")</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-indigo-600">purchasePrice</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2">Purchase price (Real Estate only)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-indigo-600">currentValue</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2">Current value (Real Estate only)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-indigo-600">startBalance</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2">Original loan amount (Debts only)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-indigo-600">accountNumber</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2">Account or Policy Number</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-indigo-600">url</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2">Website link</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-indigo-600">notes</td>
                <td className="px-4 py-2">No</td>
                <td className="px-4 py-2">Any additional details</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          * Additional specific fields like <code>institutionName</code>, <code>lenderName</code>, <code>companyName</code>, <code>amount</code>, etc. are also supported.
        </p>
      </div>

      {duplicateResolution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Duplicate Records Found</h3>
            <p className="text-slate-600 mb-6">
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
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
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
                className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
              >
                Keep Current Records (Skip Duplicates)
              </button>
              <button
                onClick={() => {
                  setDuplicateResolution(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="w-full py-2.5 text-slate-500 font-medium hover:text-slate-700 mt-2"
              >
                Cancel Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
