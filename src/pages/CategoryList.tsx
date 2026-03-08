import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useForm } from 'react-hook-form';
import { FinancialRecord, AssetRecord, DebtRecord, InsuranceRecord } from '../types';
import { Plus, Trash2, ExternalLink, Edit2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';

type RecordType = 'asset' | 'debt' | 'insurance';

interface CategoryListProps {
  type: RecordType;
  title: string;
  description: string;
}

export default function CategoryList({ type, title, description }: CategoryListProps) {
  const { records, addRecord, updateRecord, deleteRecord } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  
  const filteredRecords = records.filter(r => r.type === type);

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
          Add {type === 'asset' ? 'Asset' : type === 'debt' ? 'Debt' : 'Policy'}
        </button>
      </div>

      <div className="grid gap-4">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="mx-auto h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <Plus className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No records found</h3>
            <p className="text-slate-500 mb-4">Start by adding your first {type}.</p>
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

      {isModalOpen && (
        <RecordFormModal
          type={type}
          initialData={editingRecord}
          onClose={() => setIsModalOpen(false)}
          onSubmit={async (data) => {
            if (editingRecord) {
              await updateRecord(editingRecord.id, data);
            } else {
              await addRecord({ ...data, type } as any);
            }
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

const RecordCard: React.FC<{ record: FinancialRecord; onEdit: () => void; onDelete: () => void }> = ({ record, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const { isSharedRecord } = useData();
  const isShared = isSharedRecord(record);

  return (
    <div className={cn(
      "bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md",
      isShared ? "border-amber-200 bg-amber-50/30" : "border-slate-200"
    )}>
      <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg",
            record.type === 'asset' ? "bg-emerald-100 text-emerald-700" :
            record.type === 'debt' ? "bg-rose-100 text-rose-700" :
            "bg-blue-100 text-blue-700"
          )}>
            {record.name[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900">{record.name}</h3>
              {isShared && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Shared</span>}
            </div>
            <p className="text-sm text-slate-500">
              {/* Show a key detail based on type */}
              {(record as any).accountNumber ? `Acct: ••••${(record as any).accountNumber.slice(-4)}` : 'No Account #'}
              {record.type === 'insurance' && (record as InsuranceRecord).amount && ` • ${(record as InsuranceRecord).amount}`}
              {(record as any).currentBalance && ` • ${(record as any).currentBalance}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            
            {(record as any).currentBalance && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Current Balance</span>
                <span className="text-slate-600">{(record as any).currentBalance}</span>
              </div>
            )}

            {(record as any).startBalance && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Start Balance</span>
                <span className="text-slate-600">{(record as any).startBalance}</span>
              </div>
            )}
            
            {(record as any).url && (
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Website</span>
                <a href={(record as any).url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                  Visit Link <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Type Specific Fields */}
            {record.type === 'asset' && (
              <>
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
  startBalance?: string;
  // Asset specific
  institutionName?: string;
  deedUrl?: string;
  countyClerkUrl?: string;
  // Debt specific
  controlNumber?: string;
  stateUrl?: string;
  // Insurance specific
  companyName?: string;
  amount?: string;
  representativeName?: string;
  representativeContact?: string;
};

function RecordFormModal({ type, initialData, onClose, onSubmit }: { 
  type: RecordType; 
  initialData: FinancialRecord | null; 
  onClose: () => void; 
  onSubmit: (data: any) => void;
}) {
  const { register, handleSubmit, watch } = useForm<FormData>({
    defaultValues: (initialData as any) || {
      name: '',
      notes: '',
      accountNumber: '',
      url: '',
      currentBalance: '',
      startBalance: '',
      category: type === 'asset' ? 'bank' : type === 'debt' ? 'mortgage' : undefined,
    }
  });

  const category = watch('category');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-slate-900">
            {initialData ? 'Edit' : 'Add'} {type === 'asset' ? 'Asset' : type === 'debt' ? 'Debt' : 'Insurance Policy'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Common Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name / Title *</label>
              <input {...register('name', { required: true })} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="e.g. Chase Checking, Home Mortgage" />
            </div>

            {type !== 'insurance' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select {...register('category')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none">
                  {type === 'asset' ? (
                    <>
                      <option value="bank">Bank Account</option>
                      <option value="real-estate">Real Estate</option>
                      <option value="investment">Investment (401k, IRA, Stocks)</option>
                      <option value="pension">Pension</option>
                      <option value="other">Other</option>
                    </>
                  ) : (
                    <>
                      <option value="mortgage">Mortgage</option>
                      <option value="credit-card">Credit Card</option>
                      <option value="loan">Personal/Business Loan</option>
                      <option value="llc">LLC / Business Entity</option>
                      <option value="other">Other</option>
                    </>
                  )}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                <input {...register('accountNumber')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="XXXX-XXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                <input {...register('url')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://..." />
              </div>
            </div>

            {/* Balance Fields */}
            {(type === 'asset' || type === 'debt') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Balance</label>
                  <input {...register('currentBalance')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="$0.00" />
                </div>
                {type === 'debt' && (category === 'mortgage' || category === 'loan' || category === 'other') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Balance</label>
                    <input {...register('startBalance')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="$0.00" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Type Specific Fields */}
          {type === 'asset' && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
               <h4 className="font-medium text-slate-900">Asset Details</h4>
               {category === 'real-estate' ? (
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
