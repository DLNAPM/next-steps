import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Landmark, TrendingUp, CreditCard, Shield, ScrollText, Briefcase, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FinancialRecord, StockRecord } from '../types';

export default function Dashboard() {
  const { user } = useAuth();
  const { records } = useData();

  const assets = records.filter(r => r.type === 'asset');
  const stocks = records.filter(r => r.type === 'stock');
  const debts = records.filter(r => r.type === 'debt');
  const insurance = records.filter(r => r.type === 'insurance');
  const trusts = records.filter(r => r.type === 'trust');
  const businesses = records.filter(r => r.type === 'business');

  const stats = [
    { label: 'Total Assets Recorded', value: assets.length, icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/assets' },
    { label: 'Stocks & Holdings', value: stocks.length, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/stocks' },
    { label: 'Total Debts Recorded', value: debts.length, icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-50', link: '/debts' },
    { label: 'Insurance Policies', value: insurance.length, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50', link: '/insurance' },
    { label: 'Family Trusts & Wills', value: trusts.length, icon: ScrollText, color: 'text-purple-600', bg: 'bg-purple-50', link: '/trusts' },
    { label: 'Business Entities', value: businesses.length, icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50', link: '/business' },
  ];

  const getRecordDetails = (record: FinancialRecord) => {
    const isBusiness = !!record.isBusiness;
    const tabQuery = isBusiness ? '?tab=business' : '';
    const hash = `#record-${record.id}`;

    let path = '/assets';
    let categoryLabel = 'Asset';
    let title = record.name;

    switch (record.type) {
      case 'asset':
        path = '/assets';
        categoryLabel = `Asset • ${(record as any).category || 'General'}`;
        break;
      case 'stock':
        path = '/stocks';
        const stock = record as StockRecord;
        categoryLabel = stock.brokerageCompany ? `Stock • ${stock.brokerageCompany}` : 'Stock Holding';
        title = stock.tickerSymbol 
          ? `${stock.tickerSymbol.toUpperCase()} - ${stock.stockCompanyName || stock.name}` 
          : stock.name;
        break;
      case 'debt':
        path = '/debts';
        categoryLabel = `Debt • ${(record as any).category || 'General'}`;
        break;
      case 'insurance':
        path = '/insurance';
        categoryLabel = 'Life Insurance';
        break;
      case 'trust':
        path = '/trusts';
        categoryLabel = `Trust/Will • ${(record as any).trustType || 'Estate'}`;
        break;
      case 'business':
        path = '/business';
        categoryLabel = `Business Entity • ${(record as any).category || 'LLC'}`;
        break;
    }

    return {
      link: {
        pathname: path,
        search: tabQuery,
        hash,
        state: { highlightId: record.id, tab: isBusiness ? 'business' : 'personal' }
      },
      categoryLabel,
      title,
      isBusiness
    };
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Welcome back, {user?.displayName?.split(' ')[0]}</h2>
        <p className="text-slate-500 mt-2">Here's an overview of your family's financial records.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.link} className="block group">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-600">{stat.label}</h3>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
          </div>
          {records.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-slate-500">No records added yet.</p>
              <Link to="/assets" className="inline-flex items-center gap-2 text-indigo-600 font-medium mt-2 hover:underline">
                <Plus className="w-4 h-4" /> Add your first asset
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {[...records].sort((a, b) => {
                const aTime = a.updatedAt || a.createdAt || 0;
                const bTime = b.updatedAt || b.createdAt || 0;
                return bTime - aTime;
              }).slice(0, 6).map(record => {
                const dateVal = record.updatedAt || record.createdAt || Date.now();
                const details = getRecordDetails(record);

                return (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100/80 transition-colors">
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 truncate">{details.title}</p>
                        {details.isBusiness && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                            Business
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 capitalize mt-0.5 truncate">
                        {details.categoryLabel} • {new Date(dateVal).toLocaleDateString()}
                      </p>
                    </div>
                    <Link 
                      to={details.link} 
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline shrink-0 flex items-center gap-1"
                    >
                      View
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-indigo-900 p-6 rounded-2xl shadow-md text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Why this matters</h3>
            <p className="text-indigo-100 mb-6 leading-relaxed">
              Organizing these records now ensures your loved ones aren't left searching for critical information during difficult times. You're giving them peace of mind.
            </p>
            <div className="flex flex-wrap gap-3">
               <Link to="/assets" className="px-4 py-2 bg-white text-indigo-900 rounded-lg font-medium text-sm hover:bg-indigo-50 transition-colors">
                 Add Assets
               </Link>
               <Link to="/stocks" className="px-4 py-2 bg-indigo-800 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors">
                 Add Stocks
               </Link>
               <Link to="/insurance" className="px-4 py-2 bg-indigo-800 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors">
                 Add Insurance
               </Link>
               <Link to="/trusts" className="px-4 py-2 bg-indigo-800 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors">
                 Add Family Trusts & Wills
               </Link>
               <Link to="/business" className="px-4 py-2 bg-indigo-800 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors">
                 Add Business
               </Link>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-800 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-indigo-500 rounded-full opacity-30 blur-2xl"></div>
        </div>
      </div>
    </div>
  );
}
