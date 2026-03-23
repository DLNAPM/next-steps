import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { cn } from '../lib/utils';

const QA_ITEMS = [
  {
    question: "Asset",
    answer: "An asset is anything of value that is owned by an individual, family, or organization. This includes cash, real estate, investments, vehicles, and personal property."
  },
  {
    question: "Debt",
    answer: "Debt is money borrowed by one party from another. Common forms include mortgages, credit card balances, auto loans, and personal loans."
  },
  {
    question: "Irrevocable Trust",
    answer: "A trust that cannot be modified, amended, or terminated without the permission of the grantor's named beneficiary or beneficiaries. The grantor, having transferred assets into the trust, effectively removes all of their rights of ownership to the assets and the trust."
  },
  {
    question: "Probate",
    answer: "The legal process through which a deceased person's estate is properly distributed to heirs and designated beneficiaries and any debt owed to creditors is paid off."
  },
  {
    question: "Revocable Trust",
    answer: "A trust whereby provisions can be altered or canceled dependent on the grantor or the originator of the trust. During the life of the trust, income earned is distributed to the grantor, and only after death does property transfer to the beneficiaries."
  },
  {
    question: "The Difference between having a Will vs a Trust",
    answer: "A will is a document that dictates how you want your assets distributed after you die and requires probate. A trust is a fiduciary arrangement that allows a third party, or trustee, to hold assets on behalf of a beneficiary or beneficiaries. Trusts can take effect before death, at death, or afterwards, and typically avoid probate."
  },
  {
    question: "What happens when a loved one passes and their loved ones have to go to probate",
    answer: "The family must file a petition with the probate court, notify heirs and creditors, inventory the deceased's assets, pay outstanding debts and taxes, and finally distribute the remaining assets according to the will or state law. This process can be lengthy, public, and costly."
  },
  {
    question: "What happens when a loved one passes away without having a Trust but has a Will",
    answer: "The estate must go through the probate process. The court will validate the will, appoint the executor named in the will, and oversee the distribution of assets as specified in the document."
  },
  {
    question: "What happens when a loved one passes away without having a Will but has a Trust",
    answer: "The assets held within the trust are distributed to the beneficiaries according to the trust's terms by the successor trustee, completely bypassing the probate process. Any assets not placed in the trust and not covered by a will may still be subject to probate under state intestacy laws."
  },
  {
    question: "What is the percentage of American Families who have a Family Trust",
    answer: "Estimates suggest that only about 20% to 30% of American families have a trust in place, though this number varies by age and wealth demographics."
  },
  {
    question: "What is the percentage of American Families who have a Will",
    answer: "Studies indicate that roughly 32% to 40% of American adults have a will. This means the majority of Americans do not have a basic estate plan in place."
  },
  {
    question: "What is the purpose of a Probate Attorney",
    answer: "A probate attorney is a state-licensed lawyer who guides the executor of a will or the beneficiaries of an estate through the probate process. They help identify and secure estate assets, obtain appraisals, pay debts, and ensure the legal transfer of assets."
  },
  {
    question: "What is the purpose of a Probate Judge",
    answer: "A probate judge presides over the probate court. Their role is to ensure that a deceased person's debts are paid and their assets are legally distributed to the rightful heirs or beneficiaries, either according to a valid will or state law."
  },
  {
    question: "Will",
    answer: "A legal document that expresses a person's wishes as to how their property is to be distributed after their death and as to which person is to manage the property until its final distribution."
  }
];

export default function QA() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filteredItems = QA_ITEMS.filter(item => 
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Glossary & Q&A</h2>
        <p className="text-slate-500 mt-1">Learn more about common estate planning terms and concepts.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search terms or questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
        />
      </div>

      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-500">No matching terms or questions found.</p>
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <div 
                key={index} 
                className={cn(
                  "bg-white rounded-xl border transition-all overflow-hidden",
                  isExpanded ? "border-indigo-200 shadow-md" : "border-slate-200 shadow-sm hover:border-slate-300"
                )}
              >
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-semibold text-slate-900 pr-4">{item.question}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-6 pb-4 pt-0">
                    <div className="w-full h-px bg-slate-100 mb-4"></div>
                    <p className="text-slate-600 leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
