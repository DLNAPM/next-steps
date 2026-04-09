import React from 'react';
import { X, Shield } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Privacy Policy</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 text-slate-600 space-y-4 text-sm leading-relaxed">
          <p className="font-medium text-slate-900 text-base mb-6">
            By using "Next Steps", you agree to the terms outlined in this Privacy Policy.
          </p>
          
          <h3 className="text-base font-bold text-slate-900 mt-6">1. Information We Collect</h3>
          <p>We collect information you provide directly to us when you create an account, update your profile, or use our services. This may include your name, email address, and financial record data you choose to store.</p>

          <h3 className="text-base font-bold text-slate-900 mt-6">2. How We Use Your Information</h3>
          <p>We use the information we collect to provide, maintain, and improve our services, to process your transactions, and to communicate with you.</p>

          <h3 className="text-base font-bold text-slate-900 mt-6">3. Data Security</h3>
          <p>We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note that no method of transmission over the Internet or method of electronic storage is 100% secure.</p>

          <h3 className="text-base font-bold text-slate-900 mt-6">4. Sharing of Information</h3>
          <p>We do not share your personal information with third parties except as described in this privacy policy, such as with service providers who assist us in operating our services, or when you explicitly choose to share access with family members.</p>
          
          <h3 className="text-base font-bold text-slate-900 mt-6">5. Your Choices</h3>
          <p>You may update, correct, or delete your account information at any time by logging into your account settings.</p>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Accept & Return
          </button>
        </div>
      </div>
    </div>
  );
}
