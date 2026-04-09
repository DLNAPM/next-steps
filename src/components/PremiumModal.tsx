import React from 'react';
import { Sparkles, X, Check } from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export default function PremiumModal({ isOpen, onClose, featureName }: PremiumModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
          
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Sparkles className="w-8 h-8 text-amber-300" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Upgrade to Premium</h2>
          <p className="text-indigo-100 text-sm">
            {featureName ? `Unlock ${featureName} and more!` : 'Unlock all advanced features!'}
          </p>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
              Limited Time Offer
            </div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-4xl font-extrabold text-slate-900">$11.11</span>
              <span className="text-slate-500 font-medium">/ quarterly</span>
            </div>
            <p className="text-emerald-600 font-medium text-sm">Includes an 11-Day Free Trial</p>
            <p className="text-slate-400 text-xs mt-1">Cancel anytime</p>
          </div>

          <ul className="space-y-3 mb-8">
            {[
              'AI Family Financial Advisor',
              'Print & Export Reports (PDF/Word)',
              'Data Import & Export (Excel/JSON)',
              'Share Access with Family',
              'Custom Print & Export Logo'
            ].map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                <div className="mt-0.5 bg-emerald-100 text-emerald-600 rounded-full p-0.5 shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                {feature}
              </li>
            ))}
          </ul>

          <button 
            onClick={() => {
              alert("Redirecting to Stripe Checkout...");
              onClose();
            }}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Start 11-Day Free Trial
          </button>
        </div>
      </div>
    </div>
  );
}
