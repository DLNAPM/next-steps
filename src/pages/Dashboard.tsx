import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Landmark, 
  TrendingUp, 
  CreditCard, 
  Shield, 
  ScrollText, 
  Briefcase, 
  Plus, 
  ArrowRight,
  Globe,
  ExternalLink,
  FileText,
  Building2,
  Car,
  Link2,
  Sparkles,
  Compass
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { FinancialRecord, StockRecord, AssetRecord, DebtRecord } from '../types';
import { cn } from '../lib/utils';

export interface DefinedUrlCategory {
  categoryName: string; // "Website / Online Portal", "Deed Document", "County Clerk", "AutoCheck Report", "State Filing / Registry", "MarketWatch Ticker", "Brokerage Portal"
  shortLabel: string;
  url: string;
  iconType: 'website' | 'deed' | 'county' | 'autocheck' | 'state' | 'marketwatch';
  colorClasses: string;
}

export function getDefinedUrlsForRecord(record: FinancialRecord): DefinedUrlCategory[] {
  const urls: DefinedUrlCategory[] = [];

  const formatUrl = (raw?: string) => {
    if (!raw) return '';
    const trimmed = raw.trim();
    if (!trimmed) return '';
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') 
      ? trimmed 
      : `https://${trimmed}`;
  };

  if (record.type === 'asset') {
    const a = record as AssetRecord;
    if (a.url?.trim()) {
      urls.push({
        categoryName: 'Website / Online Portal',
        shortLabel: 'Website / Portal',
        url: formatUrl(a.url),
        iconType: 'website',
        colorClasses: 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300',
      });
    }
    if (a.deedUrl?.trim()) {
      urls.push({
        categoryName: 'Deed Document',
        shortLabel: 'Deed Document',
        url: formatUrl(a.deedUrl),
        iconType: 'deed',
        colorClasses: 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300',
      });
    }
    if (a.countyClerkUrl?.trim()) {
      urls.push({
        categoryName: 'County Clerk Search',
        shortLabel: 'County Clerk',
        url: formatUrl(a.countyClerkUrl),
        iconType: 'county',
        colorClasses: 'text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300',
      });
    }
    if (a.autoCheckUrl?.trim()) {
      urls.push({
        categoryName: 'AutoCheck Vehicle History',
        shortLabel: 'AutoCheck Report',
        url: formatUrl(a.autoCheckUrl),
        iconType: 'autocheck',
        colorClasses: 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300',
      });
    }
  } else if (record.type === 'debt') {
    const d = record as DebtRecord;
    if (d.url?.trim()) {
      urls.push({
        categoryName: 'Payment / Account Portal',
        shortLabel: 'Payment Portal',
        url: formatUrl(d.url),
        iconType: 'website',
        colorClasses: 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100 hover:border-rose-300',
      });
    }
    if (d.stateUrl?.trim()) {
      urls.push({
        categoryName: 'State Filing / Registry',
        shortLabel: 'State Registry',
        url: formatUrl(d.stateUrl),
        iconType: 'state',
        colorClasses: 'text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300',
      });
    }
  } else if (record.type === 'stock') {
    const s = record as StockRecord;
    const ticker = s.tickerSymbol?.trim().toUpperCase();
    const mw = s.websiteUrl?.trim() || (ticker ? `https://www.marketwatch.com/investing/stock/${encodeURIComponent(ticker.toLowerCase())}` : '');
    if (mw) {
      urls.push({
        categoryName: `MarketWatch Ticker (${ticker || 'Stock'})`,
        shortLabel: `MarketWatch: ${ticker || 'Stock'}`,
        url: formatUrl(mw),
        iconType: 'marketwatch',
        colorClasses: 'text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300',
      });
    }
    if (s.url?.trim()) {
      urls.push({
        categoryName: 'Brokerage / Account Portal',
        shortLabel: 'Broker Portal',
        url: formatUrl(s.url),
        iconType: 'website',
        colorClasses: 'text-sky-700 bg-sky-50 border-sky-200 hover:bg-sky-100 hover:border-sky-300',
      });
    }
  } else if ((record as any).url?.trim()) {
    const catName = record.type === 'insurance' 
      ? 'Insurance Policy Portal' 
      : record.type === 'trust' 
      ? 'Trust Repository URL' 
      : 'Business Entity Portal';
    urls.push({
      categoryName: catName,
      shortLabel: 'Website / Portal',
      url: formatUrl((record as any).url),
      iconType: 'website',
      colorClasses: 'text-slate-700 bg-slate-100 border-slate-200 hover:bg-slate-200',
    });
  }

  return urls;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { records } = useData();
  const [filterType, setFilterType] = useState<'all' | 'asset' | 'debt' | 'stock' | 'has_urls'>('all');

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

  // Map of all defined URLs across records
  const allRecordsWithUrls = records.map(r => ({
    record: r,
    urls: getDefinedUrlsForRecord(r),
  }));

  const recordsWithDefinedUrls = allRecordsWithUrls.filter(item => item.urls.length > 0);
  const totalDefinedUrlsCount = allRecordsWithUrls.reduce((sum, item) => sum + item.urls.length, 0);

  // Group URLs by category for the Quick Launchpad
  const urlCategoryCounts = {
    website: allRecordsWithUrls.flatMap(i => i.urls).filter(u => u.iconType === 'website').length,
    marketwatch: allRecordsWithUrls.flatMap(i => i.urls).filter(u => u.iconType === 'marketwatch').length,
    deed: allRecordsWithUrls.flatMap(i => i.urls).filter(u => u.iconType === 'deed').length,
    county: allRecordsWithUrls.flatMap(i => i.urls).filter(u => u.iconType === 'county').length,
    autocheck: allRecordsWithUrls.flatMap(i => i.urls).filter(u => u.iconType === 'autocheck').length,
    state: allRecordsWithUrls.flatMap(i => i.urls).filter(u => u.iconType === 'state').length,
  };

  const getRecordDetails = (record: FinancialRecord) => {
    const isBusiness = !!record.isBusiness;
    const tabQuery = isBusiness ? '?tab=business' : '';
    const hash = `#record-${record.id}`;

    let path = '/assets';
    let categoryLabel = 'Asset';
    let title = record.name;
    let financialMetric = '';

    switch (record.type) {
      case 'asset': {
        const a = record as AssetRecord;
        path = '/assets';
        categoryLabel = `Asset • ${a.category || 'General'}`;
        financialMetric = a.currentBalance || a.assetValue || a.currentValue || '';
        break;
      }
      case 'stock': {
        const stock = record as StockRecord;
        path = '/stocks';
        categoryLabel = stock.brokerageCompany ? `Stock • ${stock.brokerageCompany}` : 'Stock Holding';
        title = stock.tickerSymbol 
          ? `${stock.tickerSymbol.toUpperCase()} - ${stock.stockCompanyName || stock.name}` 
          : stock.name;
        financialMetric = stock.currentValue ? `Value: ${stock.currentValue}` : stock.amountInvested ? `Invested: ${stock.amountInvested}` : '';
        break;
      }
      case 'debt': {
        const d = record as DebtRecord;
        path = '/debts';
        categoryLabel = `Debt • ${d.category || 'General'}`;
        financialMetric = d.currentBalance ? `Balance: ${d.currentBalance}` : d.creditLimit ? `Limit: ${d.creditLimit}` : '';
        break;
      }
      case 'insurance':
        path = '/insurance';
        categoryLabel = 'Life Insurance';
        financialMetric = (record as any).amount || '';
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
      financialMetric,
      isBusiness
    };
  };

  const renderUrlIcon = (iconType: DefinedUrlCategory['iconType']) => {
    switch (iconType) {
      case 'website':
        return <Globe className="w-3.5 h-3.5 shrink-0" />;
      case 'deed':
        return <FileText className="w-3.5 h-3.5 shrink-0" />;
      case 'county':
        return <Building2 className="w-3.5 h-3.5 shrink-0" />;
      case 'autocheck':
        return <Car className="w-3.5 h-3.5 shrink-0" />;
      case 'state':
        return <Landmark className="w-3.5 h-3.5 shrink-0" />;
      case 'marketwatch':
        return <TrendingUp className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  // Filter records for the Small Dashboard
  const displayedRecords = [...records]
    .filter(record => {
      if (filterType === 'all') return true;
      if (filterType === 'asset') return record.type === 'asset';
      if (filterType === 'debt') return record.type === 'debt';
      if (filterType === 'stock') return record.type === 'stock';
      if (filterType === 'has_urls') {
        return getDefinedUrlsForRecord(record).length > 0;
      }
      return true;
    })
    .sort((a, b) => {
      const aTime = a.updatedAt || a.createdAt || 0;
      const bTime = b.updatedAt || b.createdAt || 0;
      return bTime - aTime;
    });

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

      {/* Main Grid: Left Column is the Small Dashboard with Defined URLs, Right Column is the URL Launchpad & Context */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Small Dashboard for Asset/Debt/Stock Records (8 columns on lg) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Small Dashboard & Defined URLs
                  </h3>
                  <p className="text-xs text-slate-500">
                    Displaying each defined URL category for each Asset, Debt, and Stock record
                  </p>
                </div>
              </div>
            </div>

            {/* Total URL Badge */}
            <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-200/60 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-900">
                {totalDefinedUrlsCount} Active URL{totalDefinedUrlsCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl mb-6">
            <button
              onClick={() => setFilterType('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filterType === 'all' ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              All Records ({records.length})
            </button>
            <button
              onClick={() => setFilterType('asset')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1",
                filterType === 'asset' ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Landmark className="w-3.5 h-3.5" />
              Assets ({assets.length})
            </button>
            <button
              onClick={() => setFilterType('debt')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1",
                filterType === 'debt' ? "bg-white text-rose-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Debts ({debts.length})
            </button>
            <button
              onClick={() => setFilterType('stock')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1",
                filterType === 'stock' ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Stocks ({stocks.length})
            </button>
            <button
              onClick={() => setFilterType('has_urls')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1",
                filterType === 'has_urls' ? "bg-white text-amber-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Link2 className="w-3.5 h-3.5" />
              With URLs Only ({recordsWithDefinedUrls.length})
            </button>
          </div>

          {/* Record List */}
          {displayedRecords.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Link2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-medium">No records match the selected filter.</p>
              <div className="flex justify-center gap-3 mt-3">
                <Link to="/assets" className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-semibold hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add Asset
                </Link>
                <Link to="/debts" className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-semibold hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add Debt
                </Link>
                <Link to="/stocks" className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-semibold hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add Stock
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedRecords.map(record => {
                const dateVal = record.updatedAt || record.createdAt || Date.now();
                const details = getRecordDetails(record);
                const definedUrls = getDefinedUrlsForRecord(record);

                return (
                  <div 
                    key={record.id} 
                    className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/80 transition-all hover:shadow-sm hover:border-slate-300"
                  >
                    {/* Record Main Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5",
                          record.type === 'asset' ? "bg-emerald-100 text-emerald-700" :
                          record.type === 'stock' ? "bg-indigo-100 text-indigo-700" :
                          record.type === 'debt' ? "bg-rose-100 text-rose-700" :
                          record.type === 'trust' ? "bg-purple-100 text-purple-700" :
                          record.type === 'business' ? "bg-orange-100 text-orange-700" :
                          "bg-blue-100 text-blue-700"
                        )}>
                          {record.type === 'asset' ? <Landmark className="w-4 h-4" /> :
                           record.type === 'stock' ? <TrendingUp className="w-4 h-4" /> :
                           record.type === 'debt' ? <CreditCard className="w-4 h-4" /> :
                           record.name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-sm truncate">
                              {details.title}
                            </h4>
                            {details.isBusiness && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                                Business
                              </span>
                            )}
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600">
                              {record.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                            <span>{details.categoryLabel}</span>
                            {details.financialMetric && (
                              <>
                                <span>•</span>
                                <span className={cn(
                                  "font-bold",
                                  record.type === 'asset' ? "text-emerald-700" :
                                  record.type === 'stock' ? "text-indigo-700" :
                                  record.type === 'debt' ? "text-rose-700" : "text-slate-700"
                                )}>
                                  {details.financialMetric}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span className="text-[11px] text-slate-400">
                              Updated {new Date(dateVal).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link 
                        to={details.link} 
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline shrink-0 flex items-center gap-1 self-start sm:self-center"
                      >
                        View Record
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Defined URL Categories for each Asset/Debt/Stock */}
                    <div className="pt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" />
                          Defined URL Categories ({definedUrls.length})
                        </span>
                      </div>

                      {definedUrls.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {definedUrls.map((urlItem, idx) => (
                            <a
                              key={idx}
                              href={urlItem.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-2xs hover:shadow-xs",
                                urlItem.colorClasses
                              )}
                              title={`Open ${urlItem.categoryName}: ${urlItem.url}`}
                            >
                              {renderUrlIcon(urlItem.iconType)}
                              <span className="font-semibold">{urlItem.shortLabel}</span>
                              <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-dashed border-slate-200 text-xs text-slate-400">
                          <span>No URLs defined for this {record.type} record yet.</span>
                          <Link 
                            to={details.link} 
                            className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline flex items-center gap-0.5"
                          >
                            <Plus className="w-3 h-3" /> Add URL
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Defined URLs Launchpad & Guidance (4 columns on lg) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Quick Launch Directory Widget */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">URL Category Launchpad</h3>
                  <p className="text-xs text-slate-500">1-click direct links across your records</p>
                </div>
              </div>
            </div>

            {/* URL Category Summary Tags */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl">
                <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Portals & Sites</span>
                </div>
                <p className="text-lg font-black text-emerald-700 mt-0.5">{urlCategoryCounts.website}</p>
              </div>

              <div className="p-2.5 bg-indigo-50/70 border border-indigo-200/60 rounded-xl">
                <div className="flex items-center gap-1.5 text-indigo-800 text-xs font-bold">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                  <span>MarketWatch</span>
                </div>
                <p className="text-lg font-black text-indigo-700 mt-0.5">{urlCategoryCounts.marketwatch}</p>
              </div>

              <div className="p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-xl">
                <div className="flex items-center gap-1.5 text-blue-800 text-xs font-bold">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Deed Documents</span>
                </div>
                <p className="text-lg font-black text-blue-700 mt-0.5">{urlCategoryCounts.deed}</p>
              </div>

              <div className="p-2.5 bg-purple-50/70 border border-purple-200/60 rounded-xl">
                <div className="flex items-center gap-1.5 text-purple-800 text-xs font-bold">
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>County Clerk</span>
                </div>
                <p className="text-lg font-black text-purple-700 mt-0.5">{urlCategoryCounts.county}</p>
              </div>

              <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold">
                  <Car className="w-3.5 h-3.5 text-amber-600" />
                  <span>AutoCheck</span>
                </div>
                <p className="text-lg font-black text-amber-700 mt-0.5">{urlCategoryCounts.autocheck}</p>
              </div>

              <div className="p-2.5 bg-orange-50/70 border border-orange-200/60 rounded-xl">
                <div className="flex items-center gap-1.5 text-orange-800 text-xs font-bold">
                  <Landmark className="w-3.5 h-3.5 text-orange-600" />
                  <span>State Registry</span>
                </div>
                <p className="text-lg font-black text-orange-700 mt-0.5">{urlCategoryCounts.state}</p>
              </div>
            </div>

            {/* List of Defined URLs */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {recordsWithDefinedUrls.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500">No defined URLs added yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Add URLs to your assets, debts, and stocks to launch them here.</p>
                </div>
              ) : (
                recordsWithDefinedUrls.flatMap(item => 
                  item.urls.map((urlItem, idx) => (
                    <a
                      key={`${item.record.id}-${idx}`}
                      href={urlItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 truncate">
                            {item.record.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          {renderUrlIcon(urlItem.iconType)}
                          <span className="font-semibold text-slate-600 truncate">{urlItem.shortLabel}</span>
                        </div>
                      </div>
                      <div className="p-1.5 bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-500 rounded-lg transition-colors shrink-0">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </a>
                  ))
                )
              )}
            </div>
          </div>

          {/* Why this matters Card */}
          <div className="bg-indigo-900 p-6 rounded-2xl shadow-md text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Why this matters</h3>
              <p className="text-indigo-100 mb-6 leading-relaxed text-sm">
                Organizing online portals, deed repositories, county records, and live stock trackers in one central dashboard ensures loved ones and executors can immediately locate vital financial resources.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <Link to="/assets" className="px-3.5 py-1.5 bg-white text-indigo-900 rounded-lg font-semibold text-xs hover:bg-indigo-50 transition-colors">
                  Add Assets
                </Link>
                <Link to="/stocks" className="px-3.5 py-1.5 bg-indigo-800 text-white rounded-lg font-semibold text-xs hover:bg-indigo-700 transition-colors">
                  Add Stocks
                </Link>
                <Link to="/debts" className="px-3.5 py-1.5 bg-indigo-800 text-white rounded-lg font-semibold text-xs hover:bg-indigo-700 transition-colors">
                  Add Debts
                </Link>
                <Link to="/insurance" className="px-3.5 py-1.5 bg-indigo-800 text-white rounded-lg font-semibold text-xs hover:bg-indigo-700 transition-colors">
                  Add Insurance
                </Link>
                <Link to="/trusts" className="px-3.5 py-1.5 bg-indigo-800 text-white rounded-lg font-semibold text-xs hover:bg-indigo-700 transition-colors">
                  Add Trusts
                </Link>
                <Link to="/business" className="px-3.5 py-1.5 bg-indigo-800 text-white rounded-lg font-semibold text-xs hover:bg-indigo-700 transition-colors">
                  Add Business
                </Link>
              </div>
            </div>
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-800 rounded-full opacity-50 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-indigo-500 rounded-full opacity-30 blur-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
