import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useForm } from 'react-hook-form';
import { FinancialRecord, AssetRecord, DebtRecord, InsuranceRecord, TrustRecord, RecordType } from '../types';
import { Plus, Trash2, ExternalLink, Edit2, X, ChevronDown, ChevronUp, Briefcase, HelpCircle, ArrowRightLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

const getTooltipContent = (tab: 'personal' | 'business', type: RecordType) => {
  if (type === 'business') {
    return tab === 'personal' 
      ? "Personal Business (Sole Proprietorship/DBA): Business activities handled individually under your personal SSN without formal legal entity registration. Owner and business are legally the same."
      : "Formal Business Entity: Registered legal entities such as LLCs, Corporations, or Partnerships with separate EINs. These offer liability protection and are distinct legal 'persons'.";
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
          Add {type === 'asset' ? 'Asset' : type === 'debt' ? 'Debt' : type === 'insurance' ? 'Policy' : type === 'business' ? 'Entity' : 'Trust/Will'}
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

      {isModalOpen && (
        <RecordFormModal
          type={type}
          initialData={editingRecord}
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
            "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg",
            record.type === 'asset' ? "bg-emerald-100 text-emerald-700" :
            record.type === 'debt' ? "bg-rose-100 text-rose-700" :
            record.type === 'trust' ? "bg-purple-100 text-purple-700" :
            record.type === 'business' ? "bg-orange-100 text-orange-700" :
            "bg-blue-100 text-blue-700"
          )}>
            {record.name[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900">{record.name}</h3>
              {isShared && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Shared</span>}
              {record.isBusiness && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Business</span>}
            </div>
            <p className="text-sm text-slate-500">
              {/* Show a key detail based on type */}
              {associatedBusiness && <span className="text-indigo-600 font-semibold mr-1">{associatedBusiness.name} •</span>}
              {record.type === 'trust' ? ((record as TrustRecord).trustType ? `Type: ${String((record as TrustRecord).trustType).charAt(0).toUpperCase() + String((record as TrustRecord).trustType).slice(1)}` : 'Trust / Will') :
              record.type === 'business' ? `Business: ${String((record as any).category).toUpperCase()}` :
              (record as any).accountNumber ? `Acct: ••••${(record as any).accountNumber.slice(-4)}` : 'No Account #'}
              {record.type === 'insurance' && (record as InsuranceRecord).amount && ` • ${(record as InsuranceRecord).amount}`}
              {(record as any).currentBalance && ` • ${(record as any).currentBalance}`}
              {record.type === 'asset' && (record as AssetRecord).category === 'real-estate' && (record as AssetRecord).currentValue && ` • ${(record as AssetRecord).currentValue}`}
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
            
              {(record as any).currentBalance && record.type !== 'asset' && (record as any).category !== 'real-estate' && (
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Current Balance</span>
                  <span className="text-slate-600">{(record as any).currentBalance}</span>
                </div>
              )}

              {record.type === 'asset' && (record as any).category !== 'real-estate' && (record as any).currentBalance && (
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
  startBalance?: string;
  assetValue?: string;
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

function RecordFormModal({ type, initialData, onClose, onSubmit }: { 
  type: RecordType; 
  initialData: FinancialRecord | null; 
  onClose: () => void; 
  onSubmit: (data: any) => void;
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
      startBalance: '',
      purchasePrice: '',
      currentValue: '',
      isBusiness: false,
      associatedBusinessId: '',
      category: type === 'asset' ? 'bank' : type === 'debt' ? 'mortgage' : type === 'business' ? 'llc' : undefined,
      trustType: type === 'trust' ? 'revocable' : undefined,
    }
  });

  const category = watch('category');
  const isBusiness = watch('isBusiness');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-slate-900">
            {initialData ? 'Edit' : 'Add'} {type === 'asset' ? 'Asset' : type === 'debt' ? 'Debt' : type === 'insurance' ? 'Insurance Policy' : type === 'business' ? 'Business Entity' : 'Family Trust & Will'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
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

          {/* Common Fields */}
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
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Balance</label>
                    <input {...register('currentBalance')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="$0.00" />
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
