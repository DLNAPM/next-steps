import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Printer, FileText, PieChart as PieChartIcon, Lock, AlertCircle, Upload, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import PremiumModal from '../components/PremiumModal';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const parseValue = (val?: string | number) => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const num = parseFloat(String(val).replace(/[^0-9.-]+/g,""));
  return isNaN(num) ? 0 : num;
};

const getAssetValue = (record: any) => {
  if (record.assetValue) return parseValue(record.assetValue);
  if (record.category === 'real-estate' && record.currentValue) return parseValue(record.currentValue);
  if (record.currentBalance) return parseValue(record.currentBalance);
  return 0; 
};

const getDebtValue = (record: any) => {
  if (record.currentBalance) return parseValue(record.currentBalance);
  return 0;
};

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold pointer-events-none">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Reports() {
  const { records } = useData();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'standard' | 'accounts'>('standard');
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const handlePrint = () => {
    if (!user?.isPremium) {
      setShowPremiumModal(true);
      return;
    }
    window.print();
  };

  const assets = records.filter(r => r.type === 'asset');
  const debts = records.filter(r => r.type === 'debt');
  const insurance = records.filter(r => r.type === 'insurance');
  const trusts = records.filter(r => r.type === 'trust');

  const allAccounts = [...assets, ...debts, ...insurance, ...trusts];

  const assetCategories = assets.reduce((acc, curr) => {
    const cat = (curr as any).category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const debtCategories = debts.reduce((acc, curr) => {
    const cat = (curr as any).category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const assetPieData = Object.entries(assets.reduce((acc, curr) => {
    const cat = (curr as any).category || 'other';
    acc[cat] = (acc[cat] || 0) + getAssetValue(curr);
    return acc;
  }, {} as Record<string, number>))
  .map(([name, value]) => ({ 
    name: String(name).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value 
  })).filter(d => d.value > 0);

  const useCountsForAssets = assetPieData.length === 0;
  // Fallback to count if values aren't inputted
  const finalAssetPieData = !useCountsForAssets ? assetPieData : Object.entries(assetCategories).map(([name, count]) => ({
    name: String(name).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count
  }));

  const debtPieData = Object.entries(debts.reduce((acc, curr) => {
    const cat = (curr as any).category || 'other';
    acc[cat] = (acc[cat] || 0) + getDebtValue(curr);
    return acc;
  }, {} as Record<string, number>))
  .map(([name, value]) => ({ 
    name: String(name).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value 
  })).filter(d => d.value > 0);

  const useCountsForDebts = debtPieData.length === 0;
  const finalDebtPieData = !useCountsForDebts ? debtPieData : Object.entries(debtCategories).map(([name, count]) => ({
    name: String(name).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: count
  }));

  const ASSET_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];
  const DEBT_COLORS = ['#f43f5e', '#f97316', '#eab308', '#d946ef', '#8b5cf6', '#06b6d4'];

  const logoUrl = settings.logoUrl || "/Copilot_NextSteps(EPS).jpg";

  return (
    <div className="space-y-8 print:space-y-4">
      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)} 
        featureName="Print Reports"
      />
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Financial Report</h2>
          <p className="text-slate-500 mt-1">Summary of all recorded assets, debts, and policies.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setReportType('standard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${reportType === 'standard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Standard Report
            </button>
            <button
              onClick={() => setReportType('accounts')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${reportType === 'accounts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Accounts Access
            </button>
          </div>
          <button
            onClick={handlePrint}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors shadow-sm ${user?.isPremium ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {user?.isPremium ? <Printer className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            Print Report
            {!user?.isPremium && <span className="ml-1 text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold tracking-wider">PRO</span>}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm print:hidden">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Print Header */}
      <div className="hidden print:block mb-8 border-b border-slate-200 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900">
            {reportType === 'standard' ? 'Next Steps - Family Financial Record' : 'Next Steps - Accounts Access Spreadsheet'}
          </h1>
          <img 
            src={logoUrl || "/Copilot_NextSteps(EPS).jpg"} 
            alt="Next Steps Logo" 
            className="h-[60px] w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <p className="text-slate-500">Generated for {user?.displayName} on {new Date().toLocaleDateString()}</p>
        {reportType === 'accounts' && (
          <p className="text-xs text-slate-400 mt-2 italic">
            Note: This document contains sensitive information. Store it in a secure physical location.
          </p>
        )}
      </div>

      {reportType === 'standard' ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:border print:shadow-none">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Total Assets</h3>
              <p className="text-3xl font-bold text-emerald-600">{assets.length}</p>
              <div className="mt-4 space-y-1">
                {Object.entries(assetCategories).map(([cat, count]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="capitalize text-slate-600">{cat.replace(/-/g, ' ')}</span>
                    <span className="font-medium text-slate-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:border print:shadow-none">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Total Debts</h3>
              <p className="text-3xl font-bold text-rose-600">{debts.length}</p>
              <div className="mt-4 space-y-1">
                {Object.entries(debtCategories).map(([cat, count]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="capitalize text-slate-600">{cat.replace(/-/g, ' ')}</span>
                    <span className="font-medium text-slate-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:border print:shadow-none">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Insurance Policies</h3>
              <p className="text-3xl font-bold text-blue-600">{insurance.length}</p>
              <div className="mt-4 text-sm text-slate-600">
                <p>Ensure beneficiaries are up to date on all policies.</p>
              </div>
            </div>
          </div>

          {/* Detailed Lists */}
          <div className="space-y-8 print:space-y-6">
            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Assets Detail
              </h3>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden print:border-slate-300">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 print:bg-slate-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {assets.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-4 text-center text-slate-500">No assets recorded.</td></tr>
                    ) : (
                      assets.map((record) => (
                        <tr key={record.id} className="break-inside-avoid">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{record.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">{typeof (record as any).category === 'string' ? (record as any).category.replace(/-/g, ' ') : String((record as any).category || 'other').replace(/-/g, ' ')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {(record as any).category === 'real-estate' ? (record as any).currentValue || '-' : (record as any).currentBalance || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {(record as any).institutionName && <div className="font-medium">{(record as any).institutionName}</div>}
                            {(record as any).accountNumber && <div>Acct: {(record as any).accountNumber}</div>}
                            {(record as any).url && <a href={(record as any).url} className="text-indigo-600 hover:underline print:text-slate-900 print:no-underline">{(record as any).url}</a>}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate print:whitespace-normal">{record.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-600" />
                Debts Detail
              </h3>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden print:border-slate-300">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 print:bg-slate-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {debts.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-4 text-center text-slate-500">No debts recorded.</td></tr>
                    ) : (
                      debts.map((record) => (
                        <tr key={record.id} className="break-inside-avoid">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{record.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">{typeof (record as any).category === 'string' ? (record as any).category.replace(/-/g, ' ') : String((record as any).category || 'other').replace(/-/g, ' ')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            <div>{(record as any).currentBalance || '-'}</div>
                            {(record as any).startBalance && <div className="text-xs text-slate-400">Start: {(record as any).startBalance}</div>}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {(record as any).lenderName && <div className="font-medium">{(record as any).lenderName}</div>}
                            {(record as any).accountNumber && <div>Acct: {(record as any).accountNumber}</div>}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate print:whitespace-normal">{record.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Insurance Detail
              </h3>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden print:border-slate-300">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50 print:bg-slate-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Policy Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Coverage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {insurance.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-4 text-center text-slate-500">No policies recorded.</td></tr>
                    ) : (
                      insurance.map((record) => (
                        <tr key={record.id} className="break-inside-avoid">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{record.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{(record as any).companyName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{(record as any).amount}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {(record as any).representativeName && <div className="font-medium">{(record as any).representativeName}</div>}
                            {(record as any).representativeContact && <div>{(record as any).representativeContact}</div>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Pie Charts Section */}
            <section className="pt-8 print:pt-4 break-inside-avoid">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-indigo-600" />
                Portfolio Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
                {/* Assets pie chart */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center">
                  <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Assets</h4>
                  {finalAssetPieData.length > 0 ? (
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={finalAssetPieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                          >
                            {finalAssetPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={ASSET_COLORS[index % ASSET_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => useCountsForAssets 
                              ? [value, 'Count'] 
                              : [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value as number), 'Value']
                            } 
                          />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-slate-500 my-auto">No asset data available.</p>
                  )}
                </div>

                {/* Debts pie chart */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center">
                  <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Liabilities & Equity</h4>
                  {finalDebtPieData.length > 0 ? (
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={finalDebtPieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                          >
                            {finalDebtPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={DEBT_COLORS[index % DEBT_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => useCountsForDebts 
                              ? [value, 'Count'] 
                              : [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value as number), 'Value']
                            } 
                          />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-slate-500 my-auto">No debt data available.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </>
      ) : (
        <section className="animate-fade-in">
          <div className="mb-6 print:hidden flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" />
                Accounts Access Spreadsheet
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                This spreadsheet is designed to be printed and filled out manually to help your loved ones access your accounts in an emergency. 
                <span className="block mt-1 font-semibold text-rose-600">Never store passwords digitally in this app for security reasons.</span>
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end gap-2">
                <Link 
                  to="/settings"
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {settings.logoUrl ? 'Change Logo' : 'Upload Logo'}
                </Link>
              </div>
              <img 
                src={logoUrl} 
                alt="Next Steps Logo" 
                className="h-20 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden print:border-slate-300">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 print:bg-slate-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Account Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Account Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">UserName</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Password</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {allAccounts.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-4 text-center text-slate-500">No accounts recorded.</td></tr>
                ) : (
                  allAccounts.map((record) => {
                    const typeDisplay = record.type === 'trust' ? 'Trust / Will' : record.type;
                    const acctDisplay = (record as any).accountNumber || '-';
                    const rowLength = (record.name?.length || 0) + typeDisplay.length + acctDisplay.length;
                    const wrapClass = rowLength > 60 ? 'whitespace-normal break-words' : 'whitespace-nowrap';

                    return (
                    <tr key={record.id} className="break-inside-avoid">
                      <td className={`px-6 py-4 font-medium text-slate-900 ${wrapClass} min-w-[150px]`}>{record.name}</td>
                      <td className={`px-6 py-4 text-sm text-slate-500 capitalize ${wrapClass} min-w-[100px]`}>{typeDisplay}</td>
                      <td className={`px-6 py-4 text-sm text-slate-500 ${wrapClass} min-w-[150px]`}>{acctDisplay}</td>
                      <td className="px-6 py-4 whitespace-nowrap border-l border-slate-100 min-w-[150px]"></td>
                      <td className="px-6 py-4 whitespace-nowrap border-l border-slate-100 min-w-[150px]"></td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 print:hidden">
            <h4 className="font-bold text-indigo-900 mb-2">Instructions:</h4>
            <ul className="text-sm text-indigo-800 space-y-2 list-disc pl-5">
              <li>Print this page using the button above.</li>
              <li>Hand-write your usernames and passwords in the blank columns.</li>
              <li>Store this physical document in a fireproof safe or with your attorney.</li>
              <li>Inform your successor trustee or spouse where this document is located.</li>
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
