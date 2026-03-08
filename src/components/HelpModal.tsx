import React from 'react';
import { X, HelpCircle, ShieldAlert, Info, Users, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-indigo-600">
              <HelpCircle className="w-6 h-6" />
              <h2 className="text-xl font-bold">About Next Steps</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Description */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
                <Info className="w-5 h-5 text-blue-500" />
                <h3>What is this app?</h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                <strong>Next Steps</strong> is a secure family financial record organizer designed to help you catalog your assets, debts, and insurance policies. It serves as a central digital vault for your critical financial information, making it easier for you and your loved ones to locate important records when needed.
              </p>
            </section>

            {/* How to Use */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
                <BookOpen className="w-5 h-5 text-emerald-500" />
                <h3>How to use</h3>
              </div>
              <ul className="space-y-2 text-slate-600 ml-1">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold">1</span>
                  <span><strong>Categorize:</strong> Add records under Assets, Debts, or Insurance sections.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold">2</span>
                  <span><strong>Detail:</strong> Provide key details like account numbers, current balances, and institution names.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold">3</span>
                  <span><strong>Share:</strong> Securely share access with trusted family members or advisors using the "Share Access" feature.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold">4</span>
                  <span><strong>Report:</strong> Generate and print summaries of your financial picture.</span>
                </li>
              </ul>
            </section>

            {/* Audience */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
                <Users className="w-5 h-5 text-purple-500" />
                <h3>Who is this for?</h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                This application is intended for individuals, heads of households, and families who want to ensure their financial legacy is organized. It is particularly useful for estate planning and ensuring that family members are not left searching for information during difficult times.
              </p>
            </section>

            {/* Disclaimer */}
            <section className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-lg">
                <ShieldAlert className="w-5 h-5" />
                <h3>Important Disclaimer</h3>
              </div>
              <div className="text-amber-900/80 text-sm space-y-2 leading-relaxed">
                <p>
                  <strong>Security Warning:</strong> While we prioritize security, please exercise caution with the data you store.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li><strong>DO NOT</strong> store sensitive authentication credentials like passwords, PINs, or full social security numbers in the description fields.</li>
                  <li><strong>Intended Use:</strong> This tool is for cataloging <em>where</em> assets are located and <em>what</em> they are. It is NOT for managing daily transactions or direct banking access.</li>
                  <li><strong>Guest & Demo Modes:</strong> Data entered in Guest or Demo modes is stored locally in memory and <strong>will be lost</strong> upon page refresh or logout. Sign in with Google to persist your data securely.</li>
                </ul>
              </div>
            </section>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
