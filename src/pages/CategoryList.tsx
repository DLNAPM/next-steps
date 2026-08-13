import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useForm } from 'react-hook-form';
import { FinancialRecord, AssetRecord, StockRecord, DebtRecord, InsuranceRecord, TrustRecord, RecordType } from '../types';
import { Plus, Trash2, ExternalLink, Edit2, X, ChevronDown, ChevronUp, Briefcase, HelpCircle, ArrowRightLeft, CreditCard, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const parseCurrency = (val: string | undefined): number => {
  if (!val) return 0;
  return parseFloat(val.replace(/[$,]/g, '')) || 0;
};

export const generateMarketWatchUrl = (ticker?: string): string => {
  if (!ticker) return '';
  const clean = ticker.trim();
  if (!clean) return '';
  return `https://www.marketwatch.com/investing/stock/${encodeURIComponent(clean.toLowerCase())}`;
};

export const calculateGainLoss = (investedStr?: string, currentStr?: string) => {
  const invested = parseCurrency(investedStr);
  const current = parseCurrency(currentStr);
  if (invested === 0 && current === 0) {
    return { diff: 0, percent: 0, formatted: '$0.00', formattedPercent: '0.00%', isGain: true };
  }
  const diff = current - invested;
  const percent = invested > 0 ? (diff / invested) * 100 : 0;
  const sign = diff > 0 ? '+' : diff < 0 ? '-' : '';
  const formatted = `${sign}$${Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedPercent = `${sign}${Math.abs(percent).toFixed(2)}%`;
  return {
    diff,
    percent,
    formatted,
    formattedPercent,
    isGain: diff >= 0
  };
};

const getTooltipContent = (tab: 'personal' | 'business', type: RecordType) => {
  if (type === 'business') {
    return tab === 'personal' 
      ? "Personal Business (Sole Proprietorship/DBA): Business activities handled individually under your personal SSN without formal legal entity registration. Owner and business are legally the same."
      : "Formal Business Entity: Registered legal entities such as LLCs, Corporations, or Partnerships with separate EINs. These offer liability protection and are distinct legal 'persons'.";
  }
  if (type === 'stock') {
    return tab === 'personal'
      ? "Personal Stock Portfolio: Stocks, equities, and brokerage positions held directly in your individual or joint name."
      : "Business Stock Portfolio: Corporate stock holdings or investments owned by your registered legal business entity.";
  }
  
  return tab === 'personal'
    ? `Personal ${type.charAt(0).toUpperCase() + type.slice(1)}s: Items held in your individual name for personal or household use (e.g., personal bank accounts, primary residence).`
    : `Business ${type.charAt(0).toUpperCase() + type.slice(1)}s: Items held by a legal business entity or used exclusively for commercial operations (e.g., company equipment, business credit cards).`;
};

interface CategoryListProps {
  type: RecordType;
  title: string;
  description: string;
}

export default function CategoryList({ type, title, description }: CategoryListProps) {
  const { records, addRecord, updateRecord, deleteRecord } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [duplicateResolution, setDuplicateResolution] = useState<{
    existing: FinancialRecord,
    newData: any,
    editingRecordId?: string
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'business'>('personal');
  const [showTooltip, setShowTooltip] = useState<'personal' | 'business' | null>(null);

  const filteredRecords = records.filter(r => r.type === type && (activeTab === 'business' ? r.isBusiness : !r.isBusiness));

  const openAddModal = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const openEditModal = (record: FinancialRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      await deleteRecord(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
          <p className="text-slate-500 mt-1">{description}</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add {type === 'asset' ? 'Asset' : type === 'stock' ? 'Stock' : type === 'debt' ? 'Debt' : type === 'insurance' ? 'Policy' : type === 'business' ? 'Entity' : 'Trust/Will'}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-1.5 mb-1 px-1">
          <div className="relative">
            <button 
              onMouseEnter={() => setShowTooltip('personal')}
              onMouseLeave={() => setShowTooltip(null)}
              onClick={() => setShowTooltip(showTooltip === 'personal' ? null : 'personal')}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-500 transition-colors"
            >
              <HelpCircle className="w-3 h-3" /> Personal Info
            </button>
            {showTooltip === 'personal' && (
              <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-50 pointer-events-none">
                <div className="font-bold text-indigo-400 mb-1">Personal</div>
                {getTooltipContent('personal', type)}
                <div className="absolute bottom-[-4px] left-4 w-2 h-2 bg-slate-900 rotate-45" />
              </div>
            )}
          </div>
          <div className="w-px h-3 bg-slate-200 mt-0.5 mx-2" />
          <div className="relative">
            <button 
              onMouseEnter={() => setShowTooltip('business')}
              onMouseLeave={() => setShowTooltip(null)}
              onClick={() => setShowTooltip(showTooltip === 'business' ? null : 'business')}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-orange-500 transition-colors"
            >
              <HelpCircle className="w-3 h-3" /> Business Info
            </button>
            {showTooltip === 'business' && (
              <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl z-50 pointer-events-none">
                <div className="font-bold text-orange-400 mb-1">Business</div>
                {getTooltipContent('business', type)}
                <div className="absolute bottom-[-4px] left-4 w-2 h-2 bg-slate-900 rotate-45" />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('personal')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-semibold transition-all",
              activeTab === 'personal' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 font-medium"
            )}
          >
            Personal
          </button>
          <button
            onClick={() => setActiveTab('business')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-semibold transition-all",
              activeTab === 'business' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 font-medium"
            )}
          >
            Business
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="mx-auto h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <Plus className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No records found</h3>
            <p className="text-slate-500 mb-4">Start by adding your first {type === 'trust' ? 'trust or will' : type}.</p>
            <button
              onClick={openAddModal}
              className="text-indigo-600 font-medium hover:underline"
            >
              Add New Record
            </button>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <RecordCard 
              key={record.id} 
              record={record} 
              onEdit={() => openEditModal(record)} 
              onDelete={() => handleDelete(record.id)} 
            />
          ))
        )}
      </div>

      {type === 'debt' && filteredRecords.length > 0 && (
        <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="border-t border-slate-200 pt-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-indigo-600" />
              {activeTab === 'personal' ? 'Personal' : 'Business'} Debt Analysis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {(() => {
                const totalDebt = filteredRecords.reduce((sum, r) => sum + parseCurrency((r as DebtRecord).currentBalance), 0);
                const totalLimit = filteredRecords.reduce((sum, r) => sum + parseCurrency((r as DebtRecord).creditLimit), 0);
                const utilization = totalLimit > 0 ? (totalDebt / totalLimit) * 100 : 0;
                
                const chartData = [
                  { name: 'Used', value: totalDebt, color: '#e11d48' }, // rose-600
                  { name: 'Available', value: Math.max(0, totalLimit - totalDebt), color: '#10b981' } // emerald-500
                ].filter(d => d.value > 0);

                const barData = [
                  { name: 'Debt', value: totalDebt },
                  { name: 'Limit', value: totalLimit }
                ];

                return (
                  <>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Debt</p>
                      <p className="text-3xl font-black text-rose-600">
                        ${totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Credit Limit</p>
                      <p className="text-3xl font-black text-slate-900">
                        ${totalLimit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Credit Utilization</p>
                      <div className="flex items-end gap-2">
                        <p className={cn(
                          "text-3xl font-black",
                          utilization > 75 ? "text-rose-600" : utilization > 30 ? "text-amber-500" : "text-emerald-600"
                        )}>
                          {utilization.toFixed(1)}%
                        </p>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full mb-1.5 overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-1000",
                              utilization > 75 ? "bg-rose-600" : utilization > 30 ? "bg-amber-500" : "bg-emerald-600"
                            )}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Debt vs. Credit Limit</p>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500, fill: '#64748b' }} />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fill: '#94a3b8' }}
                              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip 
                              cursor={{ fill: '#f8fafc' }}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']}
                            />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                              {barData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#e11d48' : '#6366f1'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6 self-start">Limit Utilization</p>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex gap-4 mt-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-rose-600" />
                          <span className="text-xs font-medium text-slate-600 text-nowrap">Debt</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          <span className="text-xs font-medium text-slate-600 text-nowrap">Available</span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {type === 'stock' && filteredRecords.length > 0 && (
        <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="border-t border-slate-200 pt-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              {activeTab === 'personal' ? 'Personal' : 'Business'} Stock Portfolio Performance
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {(() => {
                const totalInvested = filteredRecords.reduce((sum, r) => sum + parseCurrency((r as StockRecord).amountInvested), 0);
                const totalCurrent = filteredRecords.reduce((sum, r) => sum + parseCurrency((r as StockRecord).currentValue), 0);
                const performance = calculateGainLoss(String(totalInvested), String(totalCurrent));

                const barData = filteredRecords.map(r => ({
                  name: (r as StockRecord).tickerSymbol || r.name,
                  invested: parseCurrency((r as StockRecord).amountInvested),
                  current: parseCurrency((r as StockRecord).currentValue),
                }));

                const pieData = filteredRecords
                  .map(r => ({
                    name: (r as StockRecord).tickerSymbol || r.name,
                    value: parseCurrency((r as StockRecord).currentValue) || parseCurrency((r as StockRecord).amountInvested),
                  }))
                  .filter(d => d.value > 0);

                const STOCK_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6'];

                return (
                  <>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Amount Invested</p>
                      <p className="text-3xl font-black text-slate-900">
                        ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Current Value</p>
                      <p className="text-3xl font-black text-indigo-600">
                        ${totalCurrent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Net Gain / Loss</p>
                      <div className="flex items-baseline gap-2">
                        <p className={cn(
                          "text-3xl font-black",
                          performance.diff > 0 ? "text-emerald-600" : performance.diff < 0 ? "text-rose-600" : "text-slate-600"
                        )}>
                          {performance.formatted}
                        </p>
                        <span className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded-full",
                          performance.diff > 0 ? "bg-emerald-100 text-emerald-700" : performance.diff < 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"
                        )}>
                          {performance.formattedPercent}
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">Invested vs. Current Value by Holding</p>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500, fill: '#64748b' }} />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fill: '#94a3b8' }}
                              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip 
                              cursor={{ fill: '#f8fafc' }}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              formatter={(value: any, name: string) => [
                                `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                name === 'invested' ? 'Amount Invested' : 'Current Value'
                              ]}
                            />
                            <Bar dataKey="invested" fill="#94a3b8" name="Amount Invested" radius={[6, 6, 0, 0]} barSize={28} />
                            <Bar dataKey="current" fill="#6366f1" name="Current Value" radius={[6, 6, 0, 0]} barSize={28} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex gap-6 justify-center mt-4 text-xs font-medium text-slate-600">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-slate-400" />
                          <span>Amount Invested</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-indigo-600" />
                          <span>Current Value</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6 self-start">Portfolio Allocation</p>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey="value"
                              nameKey="name"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={STOCK_COLORS[index % STOCK_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              formatter={(value: any) => [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Current Value']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center mt-2 max-h-16 overflow-y-auto">
                        {pieData.map((entry, index) => (
                          <div key={entry.name} className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STOCK_COLORS[index % STOCK_COLORS.length] }} />
                            <span>{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <RecordFormModal
          type={type}
          initialData={editingRecord}
          defaultIsBusiness={activeTab === 'business'}
          onClose={() => setIsModalOpen(false)}
          onSubmit={async (data) => {
            // Remove undefined fields to prevent Firebase errors
            const cleanData = Object.fromEntries(
              Object.entries(data).filter(([_, v]) => v !== undefined)
            );

            if (editingRecord) {
              const duplicate = records.find(r => r.name.toLowerCase() === (cleanData as any).name.toLowerCase() && r.type === type && r.id !== editingRecord.id);
              if (duplicate) {
                setDuplicateResolution({ existing: duplicate, newData: cleanData, editingRecordId: editingRecord.id });
                setIsModalOpen(false);
              } else {
                await updateRecord(editingRecord.id, cleanData);
                setIsModalOpen(false);
              }
            } else {
              const duplicate = records.find(r => r.name.toLowerCase() === (cleanData as any).name.toLowerCase() && r.type === type);
              if (duplicate) {
                setDuplicateResolution({ existing: duplicate, newData: cleanData });
                setIsModalOpen(false);
              } else {
                await addRecord({ ...cleanData, type } as any);
                setIsModalOpen(false);
              }
            }
          }}
        />
      )}

      {duplicateResolution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Duplicate Record Found</h3>
            <p className="text-slate-600 mb-6">
              A record named "{duplicateResolution.newData.name}" already exists. Would you like to update the existing record with this new information, or keep your current record and discard these changes?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  await updateRecord(duplicateResolution.existing.id, duplicateResolution.newData);
                  if (duplicateResolution.editingRecordId) {
                    await deleteRecord(duplicateResolution.editingRecordId);
                  }
                  setDuplicateResolution(null);
                }}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
              >
                Update Existing Record
              </button>
              <button
                onClick={() => {
                  setDuplicateResolution(null);
                }}
                className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50"
              >
                Keep Current Record (Discard New)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const RecordCard: React.FC<{ record: FinancialRecord; onEdit: () => void; onDelete: () => void }> = ({ record, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const { isSharedRecord, records, updateRecord } = useData();
  const isShared = isSharedRecord(record);

  const associatedBusiness = record.associatedBusinessId 
    ? records.find(r => r.id === record.associatedBusinessId)
    : null;

  return (
    <div className={cn(
      "bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md",
      isShared ? "border-amber-200 bg-amber-50/30" : "border-slate-200"
    )}>
      <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm",
            record.type === 'asset' ? "bg-emerald-100 text-emerald-700" :
            record.type === 'stock' ? "bg-indigo-100 text-indigo-700" :
            record.type === 'debt' ? "bg-rose-100 text-rose-700" :
            record.type === 'trust' ? "bg-purple-100 text-purple-700" :
            record.type === 'business' ? "bg-orange-100 text-orange-700" :
            "bg-blue-100 text-blue-700"
          )}>
            {record.type === 'stock' && (record as StockRecord).tickerSymbol 
              ? (record as StockRecord).tickerSymbol.slice(0, 4).toUpperCase() 
              : record.name[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900">
                {record.type === 'stock' && (record as StockRecord).tickerSymbol
                  ? `${(record as StockRecord).tickerSymbol.toUpperCase()} - ${(record as StockRecord).stockCompanyName || record.name}`
                  : record.name}
              </h3>
              {isShared && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Shared</span>}
              {record.isBusiness && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Business</span>}
            </div>
            <p className="text-sm text-slate-500">
              {/* Show a key detail based on type */}
              {associatedBusiness && <span className="text-indigo-600 font-semibold mr-1">{associatedBusiness.name} •</span>}
              {record.type === 'stock' ? (
                <>
                  {(record as StockRecord).brokerageCompany && <span>{(record as StockRecord).brokerageCompany} • </span>}
                  <span>Invested: {(record as StockRecord).amountInvested || '$0.00'}</span>
                  <span className="mx-1">•</span>
                  <span>Value: {(record as StockRecord).currentValue || '$0.00'}</span>
                  {(() => {
                    const gl = calculateGainLoss((record as StockRecord).amountInvested, (record as StockRecord).currentValue);
                    return (
                      <span className={cn("ml-1.5 font-bold", gl.diff > 0 ? "text-emerald-600" : gl.diff < 0 ? "text-rose-600" : "text-slate-600")}>
                        ({gl.formatted} • {gl.formattedPercent})
                      </span>
                    );
                  })()}
                </>
              ) : (
                <>
                  {record.type === 'trust' ? ((record as TrustRecord).trustType ? `Type: ${String((record as TrustRecord).trustType).charAt(0).toUpperCase() + String((record as TrustRecord).trustType).slice(1)}` : 'Trust / Will') :
                  record.type === 'business' ? `Business: ${String((record as any).category).toUpperCase()}` :
                  (record as any).accountNumber ? `Acct: ••••${(record as any).accountNumber.slice(-4)}` : 'No Account #'}
                  {record.type === 'insurance' && (record as InsuranceRecord).amount && ` • ${(record as InsuranceRecord).amount}`}
                  {(record as any).currentBalance && ` • ${(record as any).currentBalance}`}
                  {record.type === 'asset' && (record as AssetRecord).category === 'real-estate' && (record as AssetRecord).currentValue && ` • ${(record as AssetRecord).currentValue}`}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (confirm(`Move this record to ${record.isBusiness ? 'Personal' : 'Business'}?`)) {
                updateRecord(record.id, { isBusiness: !record.isBusiness });
              }
            }} 
            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
            title={record.isBusiness ? "Move to Personal" : "Move to Business"}
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
            <Trash2 className="w-4 h-4" />
          </button>
          <button className="p-2 text-slate-400">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
            {/* Common Fields */}
            {record.notes && (
              <div className="col-span-full">
                <span className="font-semibold text-slate-700 block mb-1">Notes</span>
                <p className="text-slate-600 bg-white p-3 rounded-lg border border-slate-200">{record.notes}</p>
              </div>
            )}
            
            {record.type !== 'stock' && (record as any).currentBalance && record.type !== 'asset' && (record as any).category !== 'real-estate' && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Current Balance</span>
                {(record as any).balanceAsOf && (
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">As of {(record as any).balanceAsOf}</div>
                )}
                <span className="text-slate-600">{(record as any).currentBalance}</span>
              </div>
            )}

            {record.type === 'debt' && (record as DebtRecord).creditLimit && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Total Credit Limit</span>
                <span className="text-slate-600">{(record as DebtRecord).creditLimit}</span>
              </div>
            )}

            {record.type === 'asset' && (record as any).category !== 'real-estate' && (record as any).currentBalance && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Current Balance</span>
                {(record as any).balanceAsOf && (
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">As of {(record as any).balanceAsOf}</div>
                )}
                <span className="text-slate-600">{(record as any).currentBalance}</span>
              </div>
            )}

            {record.type !== 'stock' && (record as any).startBalance && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Start Balance</span>
                <span className="text-slate-600">{(record as any).startBalance}</span>
              </div>
            )}
            
            {record.type !== 'stock' && (record as any).url && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Website</span>
                <a href={(record as any).url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                  Visit Link <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Stock Specific Fields */}
            {record.type === 'stock' && (
              <>
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Ticker Symbol</span>
                  <span className="text-indigo-600 font-bold px-2.5 py-1 bg-indigo-50 rounded border border-indigo-100 uppercase tracking-wider text-sm inline-block">
                    {(record as StockRecord).tickerSymbol || '-'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Stock Company Name</span>
                  <span className="text-slate-800 font-medium">{(record as StockRecord).stockCompanyName || record.name}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Amount Invested</span>
                  <span className="text-slate-700 font-semibold">{(record as StockRecord).amountInvested || '$0.00'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Current Value</span>
                  <span className="text-slate-900 font-bold">{(record as StockRecord).currentValue || '$0.00'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Gain / Loss (Auto-Calculated)</span>
                  {(() => {
                    const gl = calculateGainLoss((record as StockRecord).amountInvested, (record as StockRecord).currentValue);
                    return (
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-black text-sm px-2.5 py-1 rounded-lg border",
                          gl.diff > 0 
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
                            : gl.diff < 0 
                            ? "text-rose-700 bg-rose-50 border-rose-200" 
                            : "text-slate-700 bg-slate-50 border-slate-200"
                        )}>
                          {gl.formatted} ({gl.formattedPercent})
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Stock / Ticker Website</span>
                  {(() => {
                    const mwUrl = (record as StockRecord).websiteUrl || generateMarketWatchUrl((record as StockRecord).tickerSymbol);
                    return mwUrl ? (
                      <a 
                        href={mwUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 font-medium"
                      >
                        MarketWatch: {((record as StockRecord).tickerSymbol || 'Stock').toUpperCase()} <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    );
                  })()}
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Brokerage Company</span>
                  <span className="text-slate-700 font-medium">{(record as StockRecord).brokerageCompany || '-'}</span>
                </div>
                {(record as StockRecord).accountNumber && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Account Number</span>
                    <span className="text-slate-700">{(record as StockRecord).accountNumber}</span>
                  </div>
                )}
              </>
            )}

            {/* Type Specific Fields */}
            {record.type === 'asset' && (
              <>
                {(record as AssetRecord).assetValue && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">
                      Asset Value <span className="text-xs font-normal text-slate-400 normal-case ml-1">(value as of {new Date(record.updatedAt || record.createdAt).toLocaleDateString()})</span>
                    </span>
                    <span className="text-slate-600">{(record as AssetRecord).assetValue}</span>
                  </div>
                )}
                {(record as AssetRecord).category === 'real-estate' && (
                  <>
                    {(record as AssetRecord).purchasePrice && (
                      <div>
                        <span className="font-semibold text-slate-700 block mb-1">Purchase Price</span>
                        <span className="text-slate-600">{(record as AssetRecord).purchasePrice}</span>
                      </div>
                    )}
                    {(record as AssetRecord).currentValue && (
                      <div>
                        <span className="font-semibold text-slate-700 block mb-1">Current Value</span>
                        <span className="text-slate-600">{(record as AssetRecord).currentValue}</span>
                      </div>
                    )}
                  </>
                )}
                {(record as AssetRecord).category === 'car-boat-motorcycle' && (record as AssetRecord).autoCheckUrl && (
                  <div>
                     <span className="font-semibold text-slate-700 block mb-1">AutoCheck URL</span>
                     <a href={(record as AssetRecord).autoCheckUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">View AutoCheck <ExternalLink className="w-3 h-3" /></a>
                  </div>
                )}
                {(record as AssetRecord).institutionName && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Institution</span>
                    <span className="text-slate-600">{(record as AssetRecord).institutionName}</span>
                  </div>
                )}
                {(record as AssetRecord).deedUrl && (
                  <div>
                     <span className="font-semibold text-slate-700 block mb-1">Deed Document</span>
                     <a href={(record as AssetRecord).deedUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">View Deed <ExternalLink className="w-3 h-3" /></a>
                  </div>
                )}
              </>
            )}

            {record.type === 'insurance' && (
              <>
                {(record as InsuranceRecord).companyName && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Company</span>
                    <span className="text-slate-600">{(record as InsuranceRecord).companyName}</span>
                  </div>
                )}
                {(record as InsuranceRecord).representativeName && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Representative</span>
                    <span className="text-slate-600">{(record as InsuranceRecord).representativeName}</span>
                  </div>
                )}
                {(record as InsuranceRecord).representativeContact && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Contact Info</span>
                    <span className="text-slate-600">{(record as InsuranceRecord).representativeContact}</span>
                  </div>
                )}
              </>
            )}

            {record.type === 'trust' && (
              <>
                {(record as TrustRecord).trustType && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Type</span>
                    <span className="text-slate-600 capitalize">{(record as TrustRecord).trustType}</span>
                  </div>
                )}
                {(record as TrustRecord).trusteeDetails && (
                  <div className="col-span-full">
                    <span className="font-semibold text-slate-700 block mb-1">Trustee / Executor Details</span>
                    <p className="text-slate-600 bg-white p-3 rounded-lg border border-slate-200">{(record as TrustRecord).trusteeDetails}</p>
                  </div>
                )}
              </>
            )}

            {record.type === 'business' && (
              <>
                {(record as any).ein && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">EIN</span>
                    <span className="text-slate-600">{(record as any).ein}</span>
                  </div>
                )}
                {(record as any).taxId && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Tax ID</span>
                    <span className="text-slate-600">{(record as any).taxId}</span>
                  </div>
                )}
                {(record as any).stateOfFormation && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">State of Formation</span>
                    <span className="text-slate-600">{(record as any).stateOfFormation}</span>
                  </div>
                )}
                {(record as any).formationDate && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Formation Date</span>
                    <span className="text-slate-600">{(record as any).formationDate}</span>
                  </div>
                )}
                {(record as any).ownerDetails && (
                  <div className="col-span-full">
                    <span className="font-semibold text-slate-700 block mb-1">Owner / Officer Details</span>
                    <p className="text-slate-600 bg-white p-3 rounded-lg border border-slate-200">{(record as any).ownerDetails}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type FormData = {
  name: string;
  notes?: string;
  category?: string;
  accountNumber?: string;
  url?: string;
  currentBalance?: string;
  balanceAsOf?: string;
  creditLimit?: string;
  startBalance?: string;
  assetValue?: string;
  // Stock specific
  tickerSymbol?: string;
  stockCompanyName?: string;
  amountInvested?: string;
  gainLoss?: string;
  gainLossPercentage?: string;
  websiteUrl?: string;
  brokerageCompany?: string;
  // Asset specific
  institutionName?: string;
  purchasePrice?: string;
  currentValue?: string;
  deedUrl?: string;
  countyClerkUrl?: string;
  autoCheckUrl?: string;
  // Debt specific
  controlNumber?: string;
  stateUrl?: string;
  // Insurance specific
  companyName?: string;
  amount?: string;
  representativeName?: string;
  representativeContact?: string;
  // Trust specific
  trustType?: string;
  trusteeDetails?: string;
  isBusiness?: boolean;
  associatedBusinessId?: string;
  // Business specific
  ein?: string;
  taxId?: string;
  formationDate?: string;
  stateOfFormation?: string;
  ownerDetails?: string;
};

function RecordFormModal({ type, initialData, onClose, onSubmit, defaultIsBusiness = false }: { 
  type: RecordType; 
  initialData: FinancialRecord | null; 
  onClose: () => void; 
  onSubmit: (data: any) => void;
  defaultIsBusiness?: boolean;
}) {
  const { records } = useData();
  const businessEntities = records
    .filter(r => r.type === 'business')
    .sort((a, b) => a.name.localeCompare(b.name));

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: (initialData as any) || {
      name: '',
      notes: '',
      accountNumber: '',
      url: '',
      currentBalance: '',
      balanceAsOf: '',
      creditLimit: '',
      startBalance: '',
      purchasePrice: '',
      currentValue: '',
      tickerSymbol: '',
      stockCompanyName: '',
      amountInvested: '',
      brokerageCompany: '',
      isBusiness: defaultIsBusiness,
      associatedBusinessId: '',
      category: type === 'asset' ? 'bank' : type === 'debt' ? 'mortgage' : type === 'business' ? 'llc' : undefined,
      trustType: type === 'trust' ? 'revocable' : undefined,
    }
  });

  const category = watch('category');
  const isBusiness = watch('isBusiness');
  const tickerSymbol = watch('tickerSymbol');
  const amountInvested = watch('amountInvested');
  const currentValue = watch('currentValue');
  const stockCompanyName = watch('stockCompanyName');

  const liveGainLoss = calculateGainLoss(amountInvested, currentValue);
  const liveMarketWatchUrl = generateMarketWatchUrl(tickerSymbol);

  const handleFormSubmit = (data: FormData) => {
    if (type === 'stock') {
      const ticker = (data.tickerSymbol || '').trim().toUpperCase();
      const company = (data.stockCompanyName || '').trim();
      const name = data.name.trim() || (ticker ? `${ticker}${company ? ` - ${company}` : ''}` : company || 'Stock Holding');
      const websiteUrl = generateMarketWatchUrl(ticker);
      const gl = calculateGainLoss(data.amountInvested, data.currentValue);

      onSubmit({
        ...data,
        name,
        tickerSymbol: ticker,
        stockCompanyName: company,
        websiteUrl,
        gainLoss: gl.formatted,
        gainLossPercentage: gl.formattedPercent,
      });
    } else {
      onSubmit(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-slate-900">
            {initialData ? 'Edit' : 'Add'} {type === 'asset' ? 'Asset' : type === 'stock' ? 'Stock Holding' : type === 'debt' ? 'Debt' : type === 'insurance' ? 'Insurance Policy' : type === 'business' ? 'Business Entity' : 'Family Trust & Will'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input 
                type="checkbox" 
                id="isBusiness" 
                {...register('isBusiness')} 
                className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="isBusiness" className="text-sm font-semibold text-slate-700 flex items-center gap-2 cursor-pointer">
                <Briefcase className="w-4 h-4" /> This is a Business Entity / Record
              </label>
            </div>

            {isBusiness && type !== 'business' && (
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-semibold text-indigo-900 mb-1.5">Associated Business Entity *</label>
                <select 
                  {...register('associatedBusinessId', { required: isBusiness })} 
                  className={cn(
                    "w-full px-4 py-2 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                    errors.associatedBusinessId ? "border-red-300 ring-red-100" : "border-slate-300"
                  )}
                >
                  <option value="">Select a Business Entity...</option>
                  {businessEntities.map(biz => (
                    <option key={biz.id} value={biz.id}>{biz.name}</option>
                  ))}
                </select>
                {errors.associatedBusinessId && (
                  <p className="text-xs text-red-600 mt-1 font-medium">Please select a business entity for this record.</p>
                )}
                <p className="text-[10px] text-slate-500 mt-2">
                  Don't see your business? Add it in the <Link to="/business" className="text-indigo-600 hover:underline font-bold">Business Section</Link> first.
                </p>
              </div>
            )}
          </div>

          {/* Stock Specific Form Layout */}
          {type === 'stock' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ticker Symbol *
                  </label>
                  <div className="relative">
                    <input 
                      {...register('tickerSymbol', { 
                        required: true,
                        onChange: (e) => {
                          const val = e.target.value.toUpperCase();
                          setValue('tickerSymbol', val);
                          if (!watch('name') || watch('name').includes('-')) {
                            const comp = watch('stockCompanyName');
                            setValue('name', val ? `${val}${comp ? ` - ${comp}` : ''}` : comp || '');
                          }
                        }
                      })} 
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none uppercase font-bold text-indigo-900 tracking-wider transition-all" 
                      placeholder="e.g. AAPL, MSFT, NVDA" 
                    />
                  </div>
                  {errors.tickerSymbol && (
                    <p className="text-xs text-red-600 mt-1 font-medium">Ticker Symbol is required.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Stock Company Name *
                  </label>
                  <input 
                    {...register('stockCompanyName', { 
                      required: true,
                      onChange: (e) => {
                        const val = e.target.value;
                        const ticker = watch('tickerSymbol');
                        if (ticker) {
                          setValue('name', `${ticker} - ${val}`);
                        } else {
                          setValue('name', val);
                        }
                      }
                    })} 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
                    placeholder="e.g. Apple Inc., Microsoft Corporation" 
                  />
                  {errors.stockCompanyName && (
                    <p className="text-xs text-red-600 mt-1 font-medium">Company Name is required.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Amount Invested *
                  </label>
                  <input 
                    {...register('amountInvested', { required: true })} 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800" 
                    placeholder="$0.00" 
                  />
                  {errors.amountInvested && (
                    <p className="text-xs text-red-600 mt-1 font-medium">Amount Invested is required.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Current Value *
                  </label>
                  <input 
                    {...register('currentValue', { required: true })} 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800" 
                    placeholder="$0.00" 
                  />
                  {errors.currentValue && (
                    <p className="text-xs text-red-600 mt-1 font-medium">Current Value is required.</p>
                  )}
                </div>
              </div>

              {/* Automatically Calculated Gain / Loss Live Preview */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    Gain / Loss (Automatically Calculated)
                  </span>
                  <p className="text-xs text-slate-500">
                    Calculated in real-time from Amount Invested & Current Value
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "px-3 py-1.5 rounded-lg border font-black text-base flex items-center gap-1.5",
                    liveGainLoss.diff > 0 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : liveGainLoss.diff < 0 
                      ? "bg-rose-50 text-rose-700 border-rose-200" 
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  )}>
                    {liveGainLoss.diff > 0 ? <TrendingUp className="w-4 h-4" /> : liveGainLoss.diff < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                    <span>{liveGainLoss.formatted}</span>
                    <span className="text-xs font-bold opacity-85">({liveGainLoss.formattedPercent})</span>
                  </div>
                </div>
              </div>

              {/* Automatically Created Stock/Ticker Website using MarketWatch */}
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    Stock / Ticker Website (Automatically Generated via MarketWatch)
                  </label>
                  {liveMarketWatchUrl && (
                    <a 
                      href={liveMarketWatchUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline"
                    >
                      Open Link <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="text-sm font-mono text-slate-600 bg-white p-2.5 rounded-lg border border-indigo-200/60 truncate">
                  {liveMarketWatchUrl || 'https://www.marketwatch.com/investing/stock/(ticker)'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Brokerage Company
                  </label>
                  <input 
                    {...register('brokerageCompany')} 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" 
                    placeholder="e.g. Charles Schwab, Fidelity, Robinhood, Vanguard" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Account Number (Optional)
                  </label>
                  <input 
                    {...register('accountNumber')} 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" 
                    placeholder="XXXX-XXXX" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Custom Display Name (Optional)</label>
                <input 
                  {...register('name')} 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600 text-sm" 
                  placeholder="Auto-generated as 'TICKER - Company Name'" 
                />
              </div>
            </div>
          ) : (
            /* Common Fields for Other Categories */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name / Title *</label>
                <input {...register('name', { required: true })} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="e.g. Chase Checking, Home Mortgage" />
              </div>

              {type !== 'insurance' && type !== 'trust' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select {...register('category')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none">
                    {type === 'asset' ? (
                      <>
                        <option value="bank">Bank Account</option>
                        <option value="real-estate">Real Estate</option>
                        <option value="investment">Investment (401k, IRA, Stocks)</option>
                        <option value="pension">Pension</option>
                        <option value="car-boat-motorcycle">Car\Boat\Motorcycle</option>
                        <option value="other">Other</option>
                      </>
                    ) : type === 'debt' ? (
                      <>
                        <option value="mortgage">Mortgage</option>
                        <option value="credit-card">Credit Card</option>
                        <option value="loan">Personal/Business Loan</option>
                        <option value="llc">LLC / Business Entity</option>
                        <option value="other">Other</option>
                      </>
                    ) : (
                      <>
                        <option value="llc">LLC</option>
                        <option value="corporation">Corporation</option>
                        <option value="partnership">Partnership</option>
                        <option value="sole-proprietorship">Sole Proprietorship</option>
                        <option value="other">Other</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {type === 'trust' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type of Trust / Will</label>
                  <select {...register('trustType')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="revocable">Revocable Trust</option>
                    <option value="irrevocable">Irrevocable Trust</option>
                    <option value="will">Will</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {type !== 'trust' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                    <input {...register('accountNumber')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="XXXX-XXXX" />
                  </div>
                )}
                <div className={type === 'trust' ? 'col-span-full' : ''}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                  <input {...register('url')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://..." />
                </div>
              </div>

              {/* Balance Fields */}
              {(type === 'asset' || type === 'debt') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!(type === 'asset' && category === 'real-estate') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Balance</label>
                        <input {...register('currentBalance')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="$0.00" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">As of Date</label>
                        <input type="date" {...register('balanceAsOf')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                      </div>
                    </>
                  )}
                  {type === 'debt' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Total Credit Limit</label>
                      <input {...register('creditLimit')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="$0.00" />
                    </div>
                  )}
                  {type === 'debt' && (category === 'mortgage' || category === 'loan' || category === 'other') && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Start Balance</label>
                      <input {...register('startBalance')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="$0.00" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Type Specific Fields */}
          {type === 'asset' && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
               <h4 className="font-medium text-slate-900">Asset Details</h4>
               
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Asset Value</label>
                 <input {...register('assetValue')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="$0.00" />
                 <p className="text-xs text-slate-500 mt-1">Value as of today (will automatically date stamp when saved)</p>
               </div>

               {category === 'real-estate' ? (
                 <>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Price</label>
                       <input {...register('purchasePrice')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="$0.00" />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Current Value</label>
                       <input {...register('currentValue')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="$0.00" />
                     </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Deed URL</label>
                       <input {...register('deedUrl')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">County Clerk URL</label>
                       <input {...register('countyClerkUrl')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                     </div>
                   </div>
                 </>
               ) : category === 'car-boat-motorcycle' ? (
                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Institution Name</label>
                     <input {...register('institutionName')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">AutoCheck URL</label>
                     <input {...register('autoCheckUrl')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://..." />
                   </div>
                 </div>
               ) : (
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Institution Name</label>
                   <input {...register('institutionName')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                 </div>
               )}
            </div>
          )}

          {type === 'debt' && category === 'llc' && (
             <div className="space-y-4 pt-4 border-t border-slate-100">
               <h4 className="font-medium text-slate-900">LLC Details</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Control Number</label>
                   <input {...register('controlNumber')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">State Registry URL</label>
                   <input {...register('stateUrl')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                 </div>
               </div>
             </div>
          )}

          {type === 'insurance' && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="font-medium text-slate-900">Policy Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                  <input {...register('companyName')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Coverage Amount</label>
                  <input {...register('amount')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="$1,000,000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Representative Name</label>
                  <input {...register('representativeName')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rep. Contact Info</label>
                  <input {...register('representativeContact')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Phone or Email" />
                </div>
              </div>
            </div>
          )}

          {type === 'trust' && (
             <div className="space-y-4 pt-4 border-t border-slate-100">
               <h4 className="font-medium text-slate-900">Trust / Will Details</h4>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Trustee / Executor Details</label>
                 <textarea {...register('trusteeDetails')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" rows={3} placeholder="Names and contact info for trustees or executors..." />
               </div>
             </div>
          )}

          {type === 'business' && (
             <div className="space-y-4 pt-4 border-t border-slate-100">
               <h4 className="font-medium text-slate-900">Business Entity Details</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">EIN</label>
                   <input {...register('ein')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="XX-XXXXXXX" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID (if different)</label>
                   <input {...register('taxId')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">State of Formation</label>
                   <input {...register('stateOfFormation')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Delaware" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Formation Date</label>
                   <input {...register('formationDate')} type="date" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                 </div>
                 <div className="col-span-full">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Owner / Officer Details</label>
                   <textarea {...register('ownerDetails')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" rows={2} placeholder="Names and contact info for owners/officers..." />
                 </div>
               </div>
             </div>
          )}

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea {...register('notes')} rows={3} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Any additional details..." />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm">Save Record</button>
          </div>
        </form>
      </div>
    </div>
  );
}
