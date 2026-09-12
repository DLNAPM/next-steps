import React, { useState, useEffect, useMemo } from 'react';
import { 
  FinancialRecord, 
  AssetRecord, 
  StockRecord, 
  DebtRecord, 
  InsuranceRecord, 
  TrustRecord, 
  BusinessRecord 
} from '../types';
import { 
  FileText, 
  Printer, 
  ChevronRight, 
  Download, 
  ShieldCheck, 
  Landmark, 
  TrendingUp, 
  CreditCard, 
  Shield, 
  ScrollText, 
  Briefcase, 
  Users, 
  Scale, 
  HeartHandshake, 
  Key, 
  CheckCircle2, 
  Circle, 
  BookOpen, 
  AlertTriangle, 
  Sparkles, 
  ArrowUpRight,
  Search,
  Building2,
  Calendar,
  Lock,
  ExternalLink,
  Edit3
} from 'lucide-react';

interface FamilyEstateReportProps {
  records: FinancialRecord[];
  user: any;
  settings: any;
  onPrint: () => void;
  onClose?: () => void;
}

const parseVal = (val?: string | number): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
  return isNaN(num) ? 0 : num;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function FamilyEstateReport({
  records,
  user,
  settings,
  onPrint,
  onClose,
}: FamilyEstateReportProps) {
  // Table of Contents sections
  const tocSections = [
    { id: 'sec-1', number: '1', title: 'Executive Summary', icon: Sparkles },
    { id: 'sec-2', number: '2', title: 'Family Profile & Core Objectives', icon: Users },
    { id: 'sec-3', number: '3', title: 'Net Worth Statement & Asset Inventory', icon: Landmark },
    { id: 'sec-4', number: '4', title: 'Estate Distribution Strategy', icon: ScrollText },
    { id: 'sec-5', number: '5', title: 'Insurance & Risk Management Analysis', icon: Shield },
    { id: 'sec-6', number: '6', title: 'Tax Optimization Strategy', icon: Scale },
    { id: 'sec-7', number: '7', title: 'Philanthropic & Charitable Giving Plan', icon: HeartHandshake },
    { id: 'sec-8', number: '8', title: 'Digital Estate & Business Succession Plan', icon: Key },
    { id: 'sec-9', number: '9', title: 'Action Plan & Next Steps', icon: CheckCircle2 },
    { id: 'sec-10', number: '10', title: 'Appendix & Supporting Documents', icon: BookOpen },
  ];

  const [activeSection, setActiveSection] = useState('sec-1');
  const [glossaryFilter, setGlossaryFilter] = useState('');

  // Local storage persisted checklist for Action Plan
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('estate_report_tasks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const updated = { ...prev, [taskId]: !prev[taskId] };
      try {
        localStorage.setItem('estate_report_tasks', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Custom Family Metadata
  const familyTitle = user?.displayName ? `${user.displayName}'s Family` : 'Private Family';
  const reportDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate Asset aggregations
  const categorized = useMemo(() => {
    const assets = records.filter((r) => r.type === 'asset') as AssetRecord[];
    const stocks = records.filter((r) => r.type === 'stock') as StockRecord[];
    const debts = records.filter((r) => r.type === 'debt') as DebtRecord[];
    const insurances = records.filter((r) => r.type === 'insurance') as InsuranceRecord[];
    const trusts = records.filter((r) => r.type === 'trust') as TrustRecord[];
    const businesses = records.filter((r) => r.type === 'business') as BusinessRecord[];

    // Liquid & Investment accounts
    const liquidAssets = assets.filter((a) => ['bank', 'investment', 'pension'].includes(a.category));
    const liquidTotal = liquidAssets.reduce((sum, a) => sum + parseVal(a.currentBalance || a.assetValue), 0);

    // Stock holdings total
    const stockTotal = stocks.reduce((sum, s) => sum + parseVal(s.currentValue || s.amountInvested), 0);

    // Real estate & Tangible property
    const realEstate = assets.filter((a) => a.category === 'real-estate');
    const realEstateTotal = realEstate.reduce((sum, a) => sum + parseVal(a.currentValue || a.purchasePrice || a.assetValue), 0);

    const tangibleVehicles = assets.filter((a) => ['car-boat-motorcycle', 'other'].includes(a.category));
    const tangibleTotal = tangibleVehicles.reduce((sum, a) => sum + parseVal(a.assetValue || a.currentBalance), 0);

    // Business assets & equity
    const businessRecordsList = records.filter((r) => r.isBusiness || r.type === 'business');
    const businessAssetsOnly = assets.filter((a) => a.isBusiness);
    const businessAssetVal = businessAssetsOnly.reduce((sum, a) => sum + parseVal(a.assetValue || a.currentBalance), 0);

    // Gross Assets total
    const totalGrossAssets = liquidTotal + stockTotal + realEstateTotal + tangibleTotal + businessAssetVal;

    // Debts & Liabilities
    const totalMortgages = debts.filter((d) => d.category === 'mortgage').reduce((sum, d) => sum + parseVal(d.currentBalance), 0);
    const totalRevolvingCredit = debts.filter((d) => d.category === 'credit-card').reduce((sum, d) => sum + parseVal(d.currentBalance), 0);
    const totalLoans = debts.filter((d) => ['loan', 'llc', 'other'].includes(d.category)).reduce((sum, d) => sum + parseVal(d.currentBalance), 0);
    const totalDebts = debts.reduce((sum, d) => sum + parseVal(d.currentBalance), 0);

    // Net Worth
    const netWorth = totalGrossAssets - totalDebts;

    // Life Insurance death benefits total
    const totalLifeInsurance = insurances.reduce((sum, i) => sum + parseVal(i.amount), 0);

    return {
      assets,
      stocks,
      debts,
      insurances,
      trusts,
      businesses,
      liquidAssets,
      liquidTotal,
      stockTotal,
      realEstate,
      realEstateTotal,
      tangibleVehicles,
      tangibleTotal,
      businessRecordsList,
      businessAssetVal,
      totalGrossAssets,
      totalMortgages,
      totalRevolvingCredit,
      totalLoans,
      totalDebts,
      netWorth,
      totalLifeInsurance,
    };
  }, [records]);

  // Key recommendations derived from data
  const dynamicRecommendations = useMemo(() => {
    const recs: { title: string; category: string; impact: 'High' | 'Medium' | 'Essential'; text: string }[] = [];

    if (categorized.trusts.length === 0) {
      recs.push({
        title: 'Establish Living Trust Framework',
        category: 'Estate Distribution',
        impact: 'Essential',
        text: 'No active Trusts were detected. Titling primary assets into a Revocable Living Trust avoids the public, costly, and lengthy probate process.',
      });
    } else {
      recs.push({
        title: 'Complete Trust Asset Titling & Deed Verification',
        category: 'Estate Distribution',
        impact: 'High',
        text: `You have ${categorized.trusts.length} recorded trust(s). Verify that real property deeds and taxable brokerage accounts have been retitled in the name of the trustee.`,
      });
    }

    if (categorized.totalLifeInsurance < categorized.totalDebts) {
      recs.push({
        title: 'Coverage vs. Debt Liquidity Gap',
        category: 'Risk Management',
        impact: 'High',
        text: `Total recorded life insurance (${formatCurrency(categorized.totalLifeInsurance)}) is currently less than total liabilities (${formatCurrency(categorized.totalDebts)}). Additional term coverage is advised to shield survivors.`,
      });
    } else {
      recs.push({
        title: 'Designate Secondary & Contingent Beneficiaries',
        category: 'Risk Management',
        impact: 'Medium',
        text: `Confirm that all ${categorized.insurances.length} insurance policies and investment accounts have both primary and contingent beneficiaries designated.`,
      });
    }

    if (categorized.businesses.length > 0) {
      recs.push({
        title: 'Business Continuity & Buy-Sell Funding',
        category: 'Business Succession',
        impact: 'High',
        text: `${categorized.businesses.length} business entity/entities recorded. Ensure operating agreements contain buy-sell transfer restrictions and cross-purchase key-person funding.`,
      });
    }

    if (categorized.stocks.length > 0 || categorized.liquidTotal > 100000) {
      recs.push({
        title: 'Evaluate Donor-Advised Fund (DAF) for Appreciated Securities',
        category: 'Tax & Philanthropy',
        impact: 'Medium',
        text: 'Gifting highly appreciated stocks or ETF positions directly to a DAF provides a fair-market-value income tax deduction while bypassing capital gains taxes.',
      });
    }

    recs.push({
      title: 'Digital Asset Password & Protocol Vault',
      category: 'Digital Estate',
      impact: 'Essential',
      text: 'Designate a digital fiduciary and configure Apple Legacy Contacts / Google Inactive Account Manager in compliance with RUFADAA statutes.',
    });

    return recs;
  }, [categorized]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const glossaryItems = [
    { term: 'Revocable Living Trust', def: 'A legal instrument created during life that can be altered or dissolved at any time. It manages assets during life and directs distribution upon death without undergoing probate court.' },
    { term: 'Irrevocable Trust', def: 'A trust that generally cannot be modified or terminated without court approval or the consent of all beneficiaries. Assets transferred are removed from the taxable estate for asset protection and estate tax planning.' },
    { term: 'Per Stirpes', def: 'A legal distribution principle meaning "by branch." If a beneficiary predeceases the grantor, their share passes equally to their direct descendants.' },
    { term: 'Step-Up in Basis', def: 'The readjustment of the cost basis of an inherited asset to its fair market value on the date of the decedent\'s death, eliminating unrealized capital gains incurred during the decedent\'s lifetime.' },
    { term: 'Pour-Over Will', def: 'A specialized will used in conjunction with a living trust that automatically transfers ("pours over") any assets held outside the trust at death into the trust.' },
    { term: 'Fiduciary Duty', def: 'The highest legal duty of care and loyalty owed by an executor, trustee, or power of attorney agent to act strictly in the best financial interest of the beneficiaries.' },
    { term: 'Donor-Advised Fund (DAF)', def: 'A philanthropic sponsoring account that allows donors to make a charitable contribution, receive an immediate tax deduction, and grant out funds to charities over time.' },
    { term: 'Durable Power of Attorney (POA)', def: 'A legal document granting an agent authority to manage financial and legal affairs that remains in effect if the principal becomes incapacitated.' },
    { term: 'Healthcare Proxy / Advance Directive', def: 'A document appointing an agent to make medical decisions if the grantor is incapacitated, combined with a living will articulating end-of-life care preferences.' },
    { term: 'Spendthrift Clause', def: 'A provision in a trust restricting the voluntary or involuntary transfer of a beneficiary\'s interest, preventing outside creditors from seizing trust assets before distribution.' },
    { term: 'SECURE Act 10-Year Rule', def: 'Federal regulation requiring most non-spouse beneficiaries of inherited traditional IRAs/401(k)s to fully withdraw all account funds within 10 years of the original owner\'s death.' },
    { term: 'Unified Lifetime Gift & Estate Exemption', def: 'The cumulative total an individual can transfer during life or at death without incurring federal gift or estate taxes ($13.61M in 2024 / $13.99M in 2025, subject to sunset provisions).' },
  ];

  const filteredGlossary = glossaryItems.filter(
    (g) =>
      g.term.toLowerCase().includes(glossaryFilter.toLowerCase()) ||
      g.def.toLowerCase().includes(glossaryFilter.toLowerCase())
  );

  return (
    <div className="space-y-8 print:space-y-6">
      {/* Top Action Bar (hidden in print) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Sparkles className="w-3.5 h-3.5" />
              Comprehensive Advisory Document
            </span>
            <span className="text-xs text-slate-500 font-medium">Generated {reportDate}</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Family Estate Financial Planning Report
          </h2>
          <p className="text-slate-500 text-sm max-w-2xl">
            A strategic synthesis of {familyTitle}'s balance sheet, trust infrastructure, risk portfolio, tax architecture, and multigenerational succession roadmap.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onPrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium shadow-sm transition-all text-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors text-sm"
            >
              Return to Reports
            </button>
          )}
        </div>
      </div>

      {/* Interactive Jump Navigation (hidden in print) */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 print:hidden">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
          Table of Contents Quick Jump
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {tocSections.map((sec) => {
            const Icon = sec.icon;
            const isSelected = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100/80 border border-slate-200/60'
                }`}
              >
                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                  isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {sec.number}
                </span>
                <span className="truncate">{sec.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PRINT COVER / HEADER */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-700 mb-1">
              Confidential Estate Advisory
            </div>
            <h1 className="text-3xl font-extrabold text-slate-950">
              Family Estate Financial Planning Report
            </h1>
            <p className="text-base text-slate-700 mt-1 font-medium">
              Prepared for: {familyTitle}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Generated on {reportDate} • Next Steps Planning Portfolio
            </p>
          </div>
          <img
            src={settings.logoUrl || '/Copilot_NextSteps(EPS).jpg'}
            alt="Logo"
            className="h-16 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: EXECUTIVE SUMMARY */}
      {/* ============================================================ */}
      <section
        id="sec-1"
        className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0 print:break-after-page"
      >
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base print:border print:border-slate-300">
              1
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">1. Executive Summary</h3>
              <p className="text-xs text-slate-500">High-level purpose, strategic goals, and advisory takeaways</p>
            </div>
          </div>
        </div>

        {/* 1.1 Purpose of the Report */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            1.1 Purpose of the Report
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed">
            The primary purpose of this <strong>Family Estate Financial Planning Report</strong> is to establish an integrated, authoritative roadmap for the wealth, risk management, and intergenerational transfer of <strong>{familyTitle}</strong>. This document consolidates all registered assets, investment portfolios, liabilities, business ventures, insurance protections, and estate instruments into an actionable framework. It serves to protect family wealth, ensure continuity during unexpected incapacitation or death, prevent court-administered probate bottlenecks, and fulfill family philanthropic and legacy desires with maximum tax efficiency.
          </p>
        </div>

        {/* 1.2 Primary Family Financial Goals */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            1.2 Primary Family Financial Goals
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
              <div className="text-indigo-600 font-bold text-xs uppercase mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Capital Preservation & Protection
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Protect accrued net worth ({formatCurrency(categorized.netWorth)}) from probate administration costs, creditor exposure, unnecessary litigation, and estate tax erosion.
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
              <div className="text-emerald-600 font-bold text-xs uppercase mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                Orderly Multigenerational Transfer
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Guarantee seamless, private distribution of real estate, business interests, and securities to chosen heirs with clear fiduciary directives and spendthrift safeguards.
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
              <div className="text-purple-600 font-bold text-xs uppercase mb-1 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4" />
                Family Values & Legacy Continuity
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Foster intergenerational financial stewardship, support higher education for descendants, fund charitable causes, and maintain operational continuity for family enterprises.
              </p>
            </div>
          </div>
        </div>

        {/* 1.3 Key Recommendations Summary */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            1.3 Key Recommendations Summary
          </h4>
          <div className="space-y-2">
            {dynamicRecommendations.map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
              >
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                    rec.impact === 'Essential'
                      ? 'bg-rose-100 text-rose-800'
                      : rec.impact === 'High'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {rec.impact}
                </span>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>{rec.title}</span>
                    <span className="text-slate-400 font-normal">({rec.category})</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rec.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 2: FAMILY PROFILE & CORE OBJECTIVES */}
      {/* ============================================================ */}
      <section
        id="sec-2"
        className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0 print:break-after-page"
      >
        <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base print:border print:border-slate-300">
            2
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">2. Family Profile & Core Objectives</h3>
            <p className="text-xs text-slate-500">Beneficiary directory, advisory team, and statement of family intent</p>
          </div>
        </div>

        {/* 2.1 Family Tree & Beneficiary Directory */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            2.1 Family Tree & Beneficiary Directory
          </h4>
          <p className="text-xs text-slate-600">
            Identifies the designated beneficiaries across active accounts, trusts, and life insurance policies.
          </p>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Beneficiary / Descendant</th>
                  <th className="px-4 py-3 text-left font-semibold">Relationship</th>
                  <th className="px-4 py-3 text-left font-semibold">Designation Class</th>
                  <th className="px-4 py-3 text-left font-semibold">Allocated Vehicles</th>
                  <th className="px-4 py-3 text-left font-semibold">Per Stirpes / Terms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Primary Spouse / Partner</td>
                  <td className="px-4 py-3">Spouse</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      Primary (100%)
                    </span>
                  </td>
                  <td className="px-4 py-3">Living Trust, 401(k), Primary Life Insurance</td>
                  <td className="px-4 py-3">Full marital deduction rights & survivor trust funding</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Immediate Children / Descendants</td>
                  <td className="px-4 py-3">Children</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                      Contingent (Equal Shares)
                    </span>
                  </td>
                  <td className="px-4 py-3">Residuary Estate, Irrevocable Education Trusts</td>
                  <td className="px-4 py-3">Per Stirpes representation across generational lines</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Special Needs / Minor Dependents</td>
                  <td className="px-4 py-3">Grandchildren / Dependents</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                      Specific Bequest
                    </span>
                  </td>
                  <td className="px-4 py-3">529 Plans, Supplemental Needs Sub-Trust</td>
                  <td className="px-4 py-3">Age-staged distributions (e.g. 25, 30, 35)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2.2 Key Contacts & Professional Advisors */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            2.2 Key Contacts & Professional Advisors
          </h4>
          <p className="text-xs text-slate-600">
            Coordinated fiduciary team authorized to execute directives upon death or disability.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
              <span className="text-[10px] font-bold uppercase text-indigo-600">Estate Planning Attorney</span>
              <p className="text-xs font-bold text-slate-900">Primary Legal Counsel</p>
              <p className="text-xs text-slate-500">Drafts & updates living trusts, pour-over wills, and power of attorney documents.</p>
              <div className="pt-2 text-[11px] text-slate-600 font-medium">Status: Document Review Ready</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
              <span className="text-[10px] font-bold uppercase text-indigo-600">Certified Public Accountant (CPA)</span>
              <p className="text-xs font-bold text-slate-900">Tax Advisory Team</p>
              <p className="text-xs text-slate-500">Oversees Form 1040, fiduciary Form 1041 filings, and lifetime gift tax return Form 709.</p>
              <div className="pt-2 text-[11px] text-slate-600 font-medium">Status: Annual Audit Active</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
              <span className="text-[10px] font-bold uppercase text-indigo-600">Financial Advisor / Wealth Manager</span>
              <p className="text-xs font-bold text-slate-900">Investment Custodian</p>
              <p className="text-xs text-slate-500">Manages brokerage portfolios, asset allocation, and transfer-on-death (TOD) titling.</p>
              <div className="pt-2 text-[11px] text-slate-600 font-medium">Status: Portfolio Monitored</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
              <span className="text-[10px] font-bold uppercase text-indigo-600">Insurance & Risk Broker</span>
              <p className="text-xs font-bold text-slate-900">
                {categorized.insurances[0]?.companyName || 'Risk Underwriter'}
              </p>
              <p className="text-xs text-slate-500">
                {categorized.insurances[0]?.representativeName || 'Carrier Representative'} ({categorized.insurances[0]?.representativeContact || 'Contact on file'})
              </p>
              <div className="pt-2 text-[11px] text-slate-600 font-medium">Status: Active Coverage</div>
            </div>
          </div>
        </div>

        {/* 2.3 Statement of Family Values and Legacy Intent */}
        <div className="space-y-2 p-5 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl border border-indigo-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-indigo-600" />
            2.3 Statement of Family Values and Legacy Intent
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed italic">
            "We intend for this estate to serve as an engine of opportunity rather than an incentive for dependency. Our distributions prioritize academic education, ethical character, healthcare stability, and entrepreneurial initiative. We charge our successor trustees with administering funds prudently, resolving familial differences amicably outside of litigation, and honoring our lifelong commitment to community philanthropy."
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 3: NET WORTH STATEMENT & ASSET INVENTORY */}
      {/* ============================================================ */}
      <section
        id="sec-3"
        className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0 print:break-after-page"
      >
        <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base print:border print:border-slate-300">
            3
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">3. Net Worth Statement & Asset Inventory</h3>
            <p className="text-xs text-slate-500">Balance sheet synthesis, tangible property, business equity, and debts</p>
          </div>
        </div>

        {/* 3.1 Current Balance Sheet Summary */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            3.1 Current Balance Sheet Summary
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5">
              <span className="text-xs font-bold uppercase text-emerald-800 tracking-wider">
                Total Gross Assets
              </span>
              <p className="text-2xl lg:text-3xl font-bold text-emerald-700 mt-1">
                {formatCurrency(categorized.totalGrossAssets)}
              </p>
              <div className="mt-2 text-[11px] text-emerald-800 space-y-0.5">
                <div>Liquid & Investment: {formatCurrency(categorized.liquidTotal + categorized.stockTotal)}</div>
                <div>Real Property: {formatCurrency(categorized.realEstateTotal)}</div>
                <div>Business & Tangible: {formatCurrency(categorized.businessAssetVal + categorized.tangibleTotal)}</div>
              </div>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5">
              <span className="text-xs font-bold uppercase text-rose-800 tracking-wider">
                Total Liabilities & Debts
              </span>
              <p className="text-2xl lg:text-3xl font-bold text-rose-700 mt-1">
                {formatCurrency(categorized.totalDebts)}
              </p>
              <div className="mt-2 text-[11px] text-rose-800 space-y-0.5">
                <div>Mortgage Balances: {formatCurrency(categorized.totalMortgages)}</div>
                <div>Revolving Credit: {formatCurrency(categorized.totalRevolvingCredit)}</div>
                <div>Loans & Commercial: {formatCurrency(categorized.totalLoans)}</div>
              </div>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5">
              <span className="text-xs font-bold uppercase text-indigo-800 tracking-wider">
                Estimated Net Estate Worth
              </span>
              <p className="text-2xl lg:text-3xl font-bold text-indigo-700 mt-1">
                {formatCurrency(categorized.netWorth)}
              </p>
              <div className="mt-2 text-[11px] text-indigo-800 space-y-0.5">
                <div>Net Solvency Ratio: {categorized.totalDebts > 0 ? `${((categorized.totalGrossAssets / categorized.totalDebts)).toFixed(1)}x Assets/Debt` : 'Zero Debt'}</div>
                <div>Life Ins. Benefit: {formatCurrency(categorized.totalLifeInsurance)}</div>
                <div>Net + Death Benefit: {formatCurrency(categorized.netWorth + categorized.totalLifeInsurance)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3.2 Liquid Assets and Investment Accounts */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            3.2 Liquid Assets and Investment Accounts
          </h4>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Account / Holding Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Category / Broker</th>
                  <th className="px-4 py-3 text-left font-semibold">Account Number</th>
                  <th className="px-4 py-3 text-right font-semibold">Current Value</th>
                  <th className="px-4 py-3 text-left font-semibold">Estate Titling / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {categorized.liquidAssets.length === 0 && categorized.stocks.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-3 text-center text-slate-400">No liquid accounts or stocks recorded.</td></tr>
                ) : (
                  <>
                    {categorized.liquidAssets.map((asset) => (
                      <tr key={asset.id}>
                        <td className="px-4 py-3 font-semibold text-slate-900">{asset.name}</td>
                        <td className="px-4 py-3 capitalize">{asset.institutionName || asset.category}</td>
                        <td className="px-4 py-3 font-mono">{asset.accountNumber || '—'}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {formatCurrency(parseVal(asset.currentBalance || asset.assetValue))}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{asset.notes || 'Confirm TOD/POD Beneficiary'}</td>
                      </tr>
                    ))}
                    {categorized.stocks.map((stock) => (
                      <tr key={stock.id} className="bg-indigo-50/20">
                        <td className="px-4 py-3 font-semibold text-indigo-950 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono font-bold text-[10px]">
                            {stock.tickerSymbol || 'EQUITY'}
                          </span>
                          <span>{stock.stockCompanyName || stock.name}</span>
                        </td>
                        <td className="px-4 py-3">{stock.brokerageCompany || 'Brokerage Stock'}</td>
                        <td className="px-4 py-3 font-mono">{stock.accountNumber || '—'}</td>
                        <td className="px-4 py-3 text-right font-bold text-indigo-900">
                          {formatCurrency(parseVal(stock.currentValue || stock.amountInvested))}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{stock.notes || 'Retitle in Trust'}</td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3.3 Real Estate and Tangible Property Assets */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            3.3 Real Estate and Tangible Property Assets
          </h4>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Property Description</th>
                  <th className="px-4 py-3 text-left font-semibold">Classification</th>
                  <th className="px-4 py-3 text-right font-semibold">Acquisition Price</th>
                  <th className="px-4 py-3 text-right font-semibold">Appraised / Market Value</th>
                  <th className="px-4 py-3 text-left font-semibold">Title Status & Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {categorized.realEstate.length === 0 && categorized.tangibleVehicles.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-3 text-center text-slate-400">No real estate or tangible property recorded.</td></tr>
                ) : (
                  <>
                    {categorized.realEstate.map((re) => (
                      <tr key={re.id}>
                        <td className="px-4 py-3 font-semibold text-slate-900">{re.name}</td>
                        <td className="px-4 py-3 capitalize">Real Estate (Primary/Rental)</td>
                        <td className="px-4 py-3 text-right">{re.purchasePrice || '—'}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {formatCurrency(parseVal(re.currentValue || re.assetValue))}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-500">{re.notes || 'Verify deed recorded under Trust'}</span>
                        </td>
                      </tr>
                    ))}
                    {categorized.tangibleVehicles.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-semibold text-slate-900">{item.name}</td>
                        <td className="px-4 py-3 capitalize">{item.category.replace(/-/g, ' ')}</td>
                        <td className="px-4 py-3 text-right">—</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          {formatCurrency(parseVal(item.assetValue || item.currentBalance))}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{item.notes || 'Personal Property'}</td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3.4 Business Interests and Private Equity */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            3.4 Business Interests and Private Equity
          </h4>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Entity Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Structure</th>
                  <th className="px-4 py-3 text-left font-semibold">State / EIN</th>
                  <th className="px-4 py-3 text-left font-semibold">Ownership Details</th>
                  <th className="px-4 py-3 text-left font-semibold">Succession Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {categorized.businesses.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-3 text-center text-slate-400">No standalone business entities registered.</td></tr>
                ) : (
                  categorized.businesses.map((biz) => (
                    <tr key={biz.id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{biz.name}</td>
                      <td className="px-4 py-3 uppercase font-mono">{biz.category}</td>
                      <td className="px-4 py-3 font-mono">{biz.stateOfFormation ? `${biz.stateOfFormation} • ` : ''}{biz.ein || biz.taxId || 'Pending'}</td>
                      <td className="px-4 py-3">{biz.ownerDetails || '100% Family Owned'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold border border-amber-200 text-[10px]">
                          Buy-Sell Review Needed
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3.5 Summary of Liabilities and Debts */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            3.5 Summary of Liabilities and Debts
          </h4>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Liability Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Lender / Creditor</th>
                  <th className="px-4 py-3 text-right font-semibold">Outstanding Balance</th>
                  <th className="px-4 py-3 text-left font-semibold">Discharge Strategy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {categorized.debts.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-3 text-center text-slate-400">No debts recorded.</td></tr>
                ) : (
                  categorized.debts.map((debt) => (
                    <tr key={debt.id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{debt.name}</td>
                      <td className="px-4 py-3 capitalize">{debt.category.replace(/-/g, ' ')}</td>
                      <td className="px-4 py-3">{debt.lenderName || '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600">
                        {formatCurrency(parseVal(debt.currentBalance))}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {debt.category === 'mortgage' ? 'Satisfied by Life Insurance or Estate Sale' : 'Paid from Liquid Reserves'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 4: ESTATE DISTRIBUTION STRATEGY */}
      {/* ============================================================ */}
      <section
        id="sec-4"
        className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0 print:break-after-page"
      >
        <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base print:border print:border-slate-300">
            4
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">4. Estate Distribution Strategy</h3>
            <p className="text-xs text-slate-500">Trust framework, beneficiary allocation, trustees, and protective provisions</p>
          </div>
        </div>

        {/* 4.1 Will and Trust Framework Review */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            4.1 Will and Trust Framework Review
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed">
            A comprehensive estate plan employs a <strong>Revocable Living Trust</strong> as the primary wealth transfer vehicle, accompanied by a <strong>Pour-Over Will</strong> to capture any overlooked personal effects.
          </p>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Instrument Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Classification</th>
                  <th className="px-4 py-3 text-left font-semibold">Trustee / Fiduciary Details</th>
                  <th className="px-4 py-3 text-left font-semibold">Funding & Titling Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {categorized.trusts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-center text-amber-700 bg-amber-50">
                      No Trust documents registered. Priority Action: Consult estate counsel to execute a Revocable Living Trust.
                    </td>
                  </tr>
                ) : (
                  categorized.trusts.map((trust) => (
                    <tr key={trust.id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{trust.name}</td>
                      <td className="px-4 py-3 capitalize font-medium">{trust.trustType || 'Revocable Trust'}</td>
                      <td className="px-4 py-3 whitespace-pre-line text-slate-600">
                        {trust.trusteeDetails || 'Primary Trustee: Grantor(s) • Successor on file'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          Active Document
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4.2 Asset Allocation by Beneficiary */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            4.2 Asset Allocation by Beneficiary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <h5 className="text-xs font-bold text-slate-900 uppercase">First-To-Die Spouse Provisions</h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                Assets pass to the surviving spouse free of federal estate tax utilizing the unlimited marital deduction. For estates exceeding exemption thresholds, assets bifurcate into a <strong>Survivor's Trust (A Trust)</strong> and a credit-shelter <strong>Bypass / Credit Shelter Trust (B Trust)</strong> to lock in the deceased spouse's unified exemption.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <h5 className="text-xs font-bold text-slate-900 uppercase">Second-To-Die (Children & Descendants)</h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                The remaining residuary estate is divided into equal sub-shares for surviving children. Distributions are governed by milestone stages (e.g. 1/3 at age 25 for education/home buying, 1/3 at age 30, balance at age 35) or held in lifetime discretionary trusts for creditor shield.
              </p>
            </div>
          </div>
        </div>

        {/* 4.3 Guardian and Trustee Designations */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            4.3 Guardian and Trustee Designations
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-indigo-600">Initial Trustees</span>
              <p className="text-xs font-bold text-slate-900">{user?.displayName || 'Family Grantors'}</p>
              <p className="text-[11px] text-slate-500">Full lifetime authority to manage, buy, sell, and encumber trust property.</p>
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-indigo-600">Successor Fiduciary</span>
              <p className="text-xs font-bold text-slate-900">Named Successor / Corporate Trustee</p>
              <p className="text-[11px] text-slate-500">Assumes administrative duties upon certified incapacity or second-to-die event.</p>
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-indigo-600">Testamentary Guardian</span>
              <p className="text-xs font-bold text-slate-900">Designated Family Guardian</p>
              <p className="text-[11px] text-slate-500">Holds legal and physical custody of minor children as affirmed in Pour-Over Will.</p>
            </div>
          </div>
        </div>

        {/* 4.4 Special Provisions */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            4.4 Special Provisions (Spendthrift, Special Needs, Substance Directives)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <strong className="text-slate-900 block mb-1">Spendthrift Protection Clause:</strong>
              <p className="text-slate-600">
                Shields trust assets from outside creditors, bankruptcy proceedings, and divorce claims of beneficiaries prior to actual distribution.
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <strong className="text-slate-900 block mb-1">Special Needs Trust (SNT) Protocol:</strong>
              <p className="text-slate-600">
                Ensures any disabled heir receives supplemental care and quality-of-life enhancements without disqualifying them from Medicaid or SSI state benefits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 5: INSURANCE & RISK MANAGEMENT ANALYSIS */}
      {/* ============================================================ */}
      <section
        id="sec-5"
        className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0 print:break-after-page"
      >
        <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base print:border print:border-slate-300">
            5
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">5. Insurance & Risk Management Analysis</h3>
            <p className="text-xs text-slate-500">Life portfolio, long-term care reserves, and personal/commercial liability shield</p>
          </div>
        </div>

        {/* 5.1 Life Insurance Policy Portfolio */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            5.1 Life Insurance Policy Portfolio
          </h4>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Insurance Carrier</th>
                  <th className="px-4 py-3 text-left font-semibold">Policy Name & Number</th>
                  <th className="px-4 py-3 text-right font-semibold">Death Benefit</th>
                  <th className="px-4 py-3 text-left font-semibold">Carrier Agent / Contact</th>
                  <th className="px-4 py-3 text-left font-semibold">Beneficiary Directives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {categorized.insurances.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-center text-amber-700 bg-amber-50">
                      No active insurance policies registered. We recommend securing 10x-15x annual income in term life coverage.
                    </td>
                  </tr>
                ) : (
                  categorized.insurances.map((ins) => (
                    <tr key={ins.id}>
                      <td className="px-4 py-3 font-semibold text-slate-900">{ins.companyName}</td>
                      <td className="px-4 py-3">{ins.name} ({ins.accountNumber || 'Pending'})</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">
                        {ins.amount ? formatCurrency(parseVal(ins.amount)) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {ins.representativeName ? `${ins.representativeName} • ${ins.representativeContact}` : 'Direct Custodian'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {ins.notes || 'Named to Surviving Spouse / Living Trust'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5.2 Long-Term Care & Disability Coverage */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            5.2 Long-Term Care & Disability Coverage
          </h4>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Assisted Living & Catastrophic Eldercare Analysis</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              With median assisted-living and private nursing care exceeding $108,000 annually per individual, self-insuring through dedicated liquid reserves or hybrid life/LTC asset-based riders is essential. This protects core equities from being depleted to qualify for government Medicaid nursing spend-downs.
            </p>
          </div>
        </div>

        {/* 5.3 Liability & Asset Protection Evaluation */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            5.3 Liability & Asset Protection Evaluation
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
              <strong className="text-slate-900 block font-semibold">Excess Umbrella Liability:</strong>
              <p className="text-slate-600">
                Recommended minimum of $2,000,000 - $5,000,000 personal umbrella policy to guard personal net worth against automobile collision and premises liability claims.
              </p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
              <strong className="text-slate-900 block font-semibold">Corporate Veil Separation:</strong>
              <p className="text-slate-600">
                Maintain strict separation of business funds for all {categorized.businesses.length} registered commercial entities. Never commingle personal funds.
              </p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
              <strong className="text-slate-900 block font-semibold">Homestead Exemption Filing:</strong>
              <p className="text-slate-600">
                Ensure statutory primary residence homestead protections are declared with the county clerk where primary real estate is situated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 6: TAX OPTIMIZATION STRATEGY */}
      {/* ============================================================ */}
      <section
        id="sec-6"
        className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0 print:break-after-page"
      >
        <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base print:border print:border-slate-300">
            6
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">6. Tax Optimization Strategy</h3>
            <p className="text-xs text-slate-500">Federal/state estate tax liability, lifetime gift exemptions, and basis step-up</p>
          </div>
        </div>

        {/* 6.1 Estimated Federal and State Estate Tax Liability */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            6.1 Estimated Federal and State Estate Tax Liability
          </h4>
          <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-indigo-950">
              <span>Current Federal Unified Lifetime Exemption</span>
              <span>$13,990,000 / Individual ($27,980,000 Married Couple)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              With a current estimated gross estate of <strong>{formatCurrency(categorized.totalGrossAssets)}</strong>, the estate currently resides below the current federal exemption threshold. However, potential statutory sunset provisions may reduce this threshold to ~$7M per individual adjusted for inflation, requiring ongoing monitoring.
            </p>
          </div>
        </div>

        {/* 6.2 Gift Tax Strategies & Lifetime Exemption Tracking */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            6.2 Gift Tax Strategies & Lifetime Exemption Tracking
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-indigo-600" />
                Annual Gift Exclusion Utilization
              </div>
              <p className="text-slate-600">
                Grantors may gift up to <strong>$18,000 per recipient per year ($36,000 for married couples split-gifting)</strong> to children or grandchildren without filing IRS Form 709 or reducing lifetime exemptions.
              </p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-indigo-600" />
                529 Education Super-Funding
              </div>
              <p className="text-slate-600">
                Leverage 5-year gift tax averaging to front-load up to $90,000 ($180,000 married) into qualifying college 529 plans immediately without triggering gift taxes.
              </p>
            </div>
          </div>
        </div>

        {/* 6.3 Income Tax Efficiency for Inherited Assets */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            6.3 Income Tax Efficiency for Inherited Assets (Step-Up in Basis & SECURE Act)
          </h4>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
            <p className="text-slate-700 leading-relaxed">
              <strong>Full Step-Up in Basis:</strong> Real estate and taxable stock portfolios enjoy a complete step-up in cost basis to fair market value at death under IRC § 1014. Surviving heirs can immediately liquidate these positions with virtually zero capital gains liability.
            </p>
            <p className="text-slate-700 leading-relaxed">
              <strong>Retirement Account Caution (SECURE Act 2.0):</strong> Pre-tax 401(k) and traditional IRA accounts do not receive a basis step-up and must be fully withdrawn by non-spouse heirs within 10 years, which may push heirs into peak tax brackets. Consider strategic partial Roth conversions during lower-income retirement years.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 7: PHILANTHROPIC & CHARITABLE GIVING PLAN */}
      {/* ============================================================ */}
      <section
        id="sec-7"
        className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0 print:break-after-page"
      >
        <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base print:border print:border-slate-300">
            7
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">7. Philanthropic & Charitable Giving Plan</h3>
            <p className="text-xs text-slate-500">Charitable vehicles, donor-advised funds, and tax-advantaged gifting</p>
          </div>
        </div>

        {/* 7.1 Charitable Vehicle Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            7.1 Charitable Vehicle Selection
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="font-bold text-slate-900 block">Donor-Advised Fund (DAF)</span>
              <p className="text-slate-600">
                Lowest administrative burden. Yields immediate maximum income tax deduction (up to 60% AGI for cash, 30% for stock) with flexible ongoing grant recommendations.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="font-bold text-slate-900 block">Charitable Remainder Trust (CRT)</span>
              <p className="text-slate-600">
                Irrevocable structure that provides an income stream to family grantors for life or term of years, with the remaining trust corpus donated to chosen charities.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="font-bold text-slate-900 block">Private Family Foundation</span>
              <p className="text-slate-600">
                Maximum control over grantmaking, board representation for children, and direct community involvement, with annual 5% distribution requirements.
              </p>
            </div>
          </div>
        </div>

        {/* 7.2 Funding Strategies and Tax Incentives */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            7.2 Funding Strategies and Tax Incentives
          </h4>
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-2">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Double Tax Benefit: Gifting Appreciated Stocks
            </div>
            <p className="text-slate-700 leading-relaxed">
              Donating appreciated shares of stock directly to a 501(c)(3) charity or DAF completely bypasses state and federal capital gains taxes on all accrued gains, while entitling the donor to a full fair-market-value itemized tax deduction.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 8: DIGITAL ESTATE & BUSINESS SUCCESSION PLAN */}
      {/* ============================================================ */}
      <section
        id="sec-8"
        className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0 print:break-after-page"
      >
        <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base print:border print:border-slate-300">
            8
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">8. Digital Estate & Business Succession Plan</h3>
            <p className="text-xs text-slate-500">Digital asset portfolio, access protocols, and commercial continuity</p>
          </div>
        </div>

        {/* 8.1 Digital Assets Portfolio and Access Protocols */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            8.1 Digital Assets Portfolio and Access Protocols (RUFADAA Compliance)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-600" />
                Password Managers & Master Access Key
              </span>
              <p className="text-slate-600 leading-relaxed">
                Centralize all digital credentials within an encrypted vault (1Password, Bitwarden). Deposit an emergency physical recovery kit with the successor trustee or attorney.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <Key className="w-4 h-4 text-indigo-600" />
                Platform Legacy Contact Directives
              </span>
              <p className="text-slate-600 leading-relaxed">
                Configure Apple Legacy Contact and Google Inactive Account Manager to transfer photo archives and primary email access directly to fiduciaries upon verified death certificates.
              </p>
            </div>
          </div>
        </div>

        {/* 8.2 Business Continuity and Buy-Sell Agreements */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            8.2 Business Continuity and Buy-Sell Agreements
          </h4>
          <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs space-y-2">
            <p className="text-slate-700 leading-relaxed">
              For operating enterprises ({categorized.businesses.map((b) => b.name).join(', ') || 'Registered Entities'}), ensure the operating agreements contain explicit <strong>Transfer On Death (TOD)</strong> clauses and a funded <strong>Buy-Sell Agreement</strong> backed by cross-purchase life insurance. This guarantees non-participating surviving spouses are bought out fairly without jeopardizing operational cash flows.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 9: ACTION PLAN & NEXT STEPS */}
      {/* ============================================================ */}
      <section
        id="sec-9"
        className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0 print:break-after-page"
      >
        <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base print:border print:border-slate-300">
            9
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">9. Action Plan & Next Steps</h3>
            <p className="text-xs text-slate-500">Immediate priorities, milestone checklist, and annual review cadence</p>
          </div>
        </div>

        {/* 9.1 Immediate Priority Tasks */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            9.1 Immediate Priority Tasks (Days 1 - 60)
          </h4>
          <div className="space-y-2">
            {[
              { id: 'task-1', label: 'Verify real estate deed(s) are titled in name of Revocable Trust' },
              { id: 'task-2', label: 'Update primary & contingent beneficiaries on all 401(k), IRA, and brokerage accounts' },
              { id: 'task-3', label: 'Confirm Durable Financial Power of Attorney & Healthcare Directives are executed' },
              { id: 'task-4', label: 'Deliver physical emergency access keys & document locations to successor trustee' },
            ].map((t) => (
              <div
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-indigo-50/50 transition-colors"
              >
                {completedTasks[t.id] ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                )}
                <span className={`text-xs font-medium ${completedTasks[t.id] ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 9.2 Mid-to-Long-Term Implementation Checklist */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            9.2 Mid-to-Long-Term Implementation Checklist (Months 3 - 18)
          </h4>
          <div className="space-y-2">
            {[
              { id: 'task-5', label: 'Appraise business entity valuations and establish buy-sell key person insurance' },
              { id: 'task-6', label: 'Evaluate Donor-Advised Fund (DAF) to absorb upcoming capital gains events' },
              { id: 'task-7', label: 'Review personal umbrella policy coverage limits (recommended $3M - $5M)' },
              { id: 'task-8', label: 'Conduct family wealth meeting to communicate legacy vision & values with adult heirs' },
            ].map((t) => (
              <div
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-indigo-50/50 transition-colors"
              >
                {completedTasks[t.id] ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />
                )}
                <span className={`text-xs font-medium ${completedTasks[t.id] ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 9.3 Annual Review and Update Schedule */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            9.3 Annual Review and Update Schedule
          </h4>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-600">
            <p>
              Schedule an annual review in <strong>November / December</strong> with CPA and estate counsel to audit:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Changes in family composition (births, deaths, marriages, divorces).</li>
              <li>Material asset acquisitions or business sales exceeding 10% of portfolio.</li>
              <li>State and federal tax code modifications (especially unified exemption changes).</li>
              <li>Successor fiduciary readiness, contact info updates, and health status.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 10: APPENDIX & SUPPORTING DOCUMENTS */}
      {/* ============================================================ */}
      <section
        id="sec-10"
        className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0 print:break-after-page"
      >
        <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base print:border print:border-slate-300">
            10
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">10. Appendix & Supporting Documents</h3>
            <p className="text-xs text-slate-500">Document locator checklist, fiduciary powers, and legal glossary</p>
          </div>
        </div>

        {/* 10.1 Location of Vital Documents Checklist */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            10.1 Location of Vital Documents Checklist
          </h4>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Document Title</th>
                  <th className="px-4 py-3 text-left font-semibold">Physical Storage Location</th>
                  <th className="px-4 py-3 text-left font-semibold">Digital Vault / Portal</th>
                  <th className="px-4 py-3 text-left font-semibold">Authorized Key Holder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Original Revocable Living Trust & Pour-Over Will</td>
                  <td className="px-4 py-3">Home Fireproof Safe / Attorney Vault</td>
                  <td className="px-4 py-3 font-mono text-indigo-600">Encrypted Cloud Vault</td>
                  <td className="px-4 py-3">Grantors & Estate Counsel</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Real Estate Grant Deeds & Title Policies</td>
                  <td className="px-4 py-3">Safe Deposit Box</td>
                  <td className="px-4 py-3 font-mono text-indigo-600">County Records Portal</td>
                  <td className="px-4 py-3">Primary Grantor</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Life Insurance Policy Contracts</td>
                  <td className="px-4 py-3">Financial Master Binder</td>
                  <td className="px-4 py-3 font-mono text-indigo-600">Carrier Portal</td>
                  <td className="px-4 py-3">Primary Beneficiary</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Business Formation & Operating Agreements</td>
                  <td className="px-4 py-3">Corporate Minutes Binder</td>
                  <td className="px-4 py-3 font-mono text-indigo-600">Secretary of State System</td>
                  <td className="px-4 py-3">Managing Member / Trustee</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 10.2 Fiduciary Powers of Attorney */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
            10.2 Fiduciary Powers of Attorney (Medical & Financial)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <strong className="text-slate-900 block font-semibold">Durable Financial Power of Attorney:</strong>
              <p className="text-slate-600">
                Authorizes named agent to access non-trust financial accounts, file tax returns, manage government benefits, and manage daily bills during grantor incapacity.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <strong className="text-slate-900 block font-semibold">Healthcare Proxy & HIPAA Release:</strong>
              <p className="text-slate-600">
                Authorizes surrogate healthcare representative to consult physicians, access medical charts, and execute medical directives according to living will instructions.
              </p>
            </div>
          </div>
        </div>

        {/* 10.3 Glossary of Financial and Legal Terms */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-900">
              10.3 Glossary of Financial and Legal Terms
            </h4>
            <div className="relative w-full sm:w-64 print:hidden">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={glossaryFilter}
                onChange={(e) => setGlossaryFilter(e.target.value)}
                placeholder="Search legal terms..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {filteredGlossary.map((item, idx) => (
              <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 block text-indigo-950">{item.term}</span>
                <p className="text-slate-600 leading-relaxed">{item.def}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Closing Signature / Attestation Block */}
        <div className="pt-8 border-t border-slate-200 space-y-4">
          <p className="text-xs text-slate-500 text-center italic">
            This Family Estate Financial Planning Report has been compiled for strategic review purposes. Final legal and tax decisions should be formally confirmed with licensed legal and financial counsel.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4 text-center text-xs text-slate-700">
            <div className="border-t border-slate-300 pt-2 font-medium">Grantor / Client Signature</div>
            <div className="border-t border-slate-300 pt-2 font-medium">Successor Trustee Acknowledgment</div>
            <div className="border-t border-slate-300 pt-2 font-medium col-span-2 sm:col-span-1">Date of Advisory Review</div>
          </div>
        </div>
      </section>
    </div>
  );
}
