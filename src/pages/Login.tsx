import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, User, Users, PlayCircle, HelpCircle, FileText, Lock } from 'lucide-react';
import { useState } from 'react';
import HelpModal from '../components/HelpModal';
import AppIcon from '../components/AppIcon';

export default function Login() {
  const { user, signInWithGoogle, signInAsGuest, signInAsDemo } = useAuth();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <AppIcon size="sm" />
          <span className="text-xl font-bold text-slate-900 tracking-tight">Next Steps</span>
        </div>
        <button
          onClick={() => setIsHelpOpen(true)}
          className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          How it works
        </button>
      </header>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col">
        <section className="px-6 py-16 md:py-24 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight">
              Secure your family's <span className="text-indigo-600">financial legacy.</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
              Next Steps is a secure family financial record organizer. Catalog your assets, debts, and insurance policies in one central digital vault, ensuring your loved ones have the information they need when it matters most.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={signInWithGoogle}
                className="flex items-center justify-center gap-3 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
              >
                <svg className="h-5 w-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </button>
              <button
                onClick={signInAsDemo}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all shadow-sm"
              >
                <PlayCircle className="h-5 w-5 text-indigo-600" />
                Try Demo
              </button>
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Lock className="h-4 w-4" /> Guest and Demo data is temporary.
            </p>
          </div>
          
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg aspect-square rounded-3xl overflow-hidden shadow-2xl border border-slate-100 bg-white flex items-center justify-center p-6">
               <img 
                 src="/Copilot_NextSteps(EPS).jpg" 
                 alt="Next Steps Estate Planning Solutions" 
                 className="w-full h-full object-contain rounded-xl"
                 referrerPolicy="no-referrer"
               />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-slate-50 py-20 px-6 border-t border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Everything you need to stay organized</h2>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                A comprehensive suite of tools designed specifically for family financial planning and estate organization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Centralized Vault</h3>
                <p className="text-slate-600 leading-relaxed">
                  Keep all your critical financial information in one secure location. Easily catalog bank accounts, real estate, investments, and insurance policies.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Secure Sharing</h3>
                <p className="text-slate-600 leading-relaxed">
                  Grant read-only or edit access to trusted family members, executors, or financial advisors. Ensure the right people have access at the right time.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Clear Reporting</h3>
                <p className="text-slate-600 leading-relaxed">
                  Generate comprehensive summaries of your financial picture. Print or export your data to keep physical backups or share with legal professionals.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-8 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} Next Steps. All rights reserved.</p>
      </footer>
    </div>
  );
}
