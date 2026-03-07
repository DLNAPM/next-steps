import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Landmark, CreditCard, Shield, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { records } = useData();

  const assets = records.filter(r => r.type === 'asset');
  const debts = records.filter(r => r.type === 'debt');
  const insurance = records.filter(r => r.type === 'insurance');

  const stats = [
    { label: 'Total Assets Recorded', value: assets.length, icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/assets' },
    { label: 'Total Debts Recorded', value: debts.length, icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-50', link: '/debts' },
    { label: 'Insurance Policies', value: insurance.length, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50', link: '/insurance' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Welcome back, {user?.displayName?.split(' ')[0]}</h2>
        <p className="text-slate-500 mt-2">Here's an overview of your family's financial records.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              {records.slice(0, 5).map(record => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">{record.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{record.type} • {new Date(record.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <Link to={`/${record.type === 'asset' ? 'assets' : record.type === 'debt' ? 'debts' : 'insurance'}`} className="text-sm text-indigo-600 hover:underline">
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-indigo-900 p-6 rounded-2xl shadow-md text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Why this matters</h3>
            <p className="text-indigo-100 mb-6 leading-relaxed">
              Organizing these records now ensures your loved ones aren't left searching for critical information during difficult times. You're giving them peace of mind.
            </p>
            <div className="flex gap-3">
               <Link to="/assets" className="px-4 py-2 bg-white text-indigo-900 rounded-lg font-medium text-sm hover:bg-indigo-50 transition-colors">
                 Add Assets
               </Link>
               <Link to="/insurance" className="px-4 py-2 bg-indigo-800 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors">
                 Add Insurance
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
