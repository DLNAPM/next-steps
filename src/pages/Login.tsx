import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  PlayCircle, 
  FileText, 
  Lock, 
  Mail, 
  Key, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Smartphone,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import React, { useState } from 'react';
import HelpModal from '../components/HelpModal';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import AppIcon from '../components/AppIcon';

export default function Login() {
  const { 
    user, 
    authError, 
    clearAuthError, 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    sendPasswordReset, 
    signInAsDemo 
  } = useAuth();
  
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email.trim(), password, displayName.trim() || undefined);
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch {
      // Error handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    setResetError(null);
    try {
      await sendPasswordReset(resetEmail.trim());
      setResetSent(true);
    } catch (err: any) {
      setResetError(err?.message || "Failed to send reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white shadow-xs">
        <div className="flex items-center gap-2.5">
          <AppIcon size="sm" />
          <div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Next Steps</span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
              Estate & Financial Vault
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsHelpOpen(true)}
          className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          How it works
        </button>
      </header>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Hero & Login Section */}
      <main className="flex-1 flex flex-col">
        <section className="px-6 py-12 md:py-16 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Headline and Auth Cards */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Comprehensive Estate Planning Solutions
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
                Secure your family's <span className="text-indigo-600">financial legacy.</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Next Steps is a digital financial record vault. Catalog your assets, debts, and estate directives in one secure place, ensuring your loved ones have clarity when it matters most.
              </p>
            </div>

            {/* Error / Android Notice Banner */}
            {authError && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-950 animate-in fade-in duration-200 shadow-xs">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-sm space-y-2">
                  <div className="font-semibold text-amber-900">Sign-In Notice</div>
                  <p className="text-amber-800 leading-relaxed">{authError}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setAuthMode('email');
                        clearAuthError();
                      }}
                      className="px-3 py-1 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors cursor-pointer"
                    >
                      Use Email & Password Sign-In
                    </button>
                    <button
                      onClick={clearAuthError}
                      className="px-2.5 py-1 text-xs text-amber-800 hover:text-amber-950 font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Authentication Container Box */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              
              {/* Mode Switcher Tabs */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('google');
                    clearAuthError();
                  }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    authMode === 'google' 
                      ? 'bg-white text-slate-900 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Google Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('email');
                    clearAuthError();
                  }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    authMode === 'email' 
                      ? 'bg-white text-slate-900 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span>Email & Password</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                    Mobile Safe
                  </span>
                </button>
              </div>

              {/* Tab 1: Google Sign In */}
              {authMode === 'google' && (
                <div className="space-y-4 pt-1">
                  <button
                    onClick={signInWithGoogle}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md cursor-pointer text-base"
                  >
                    <svg className="h-5 w-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Sign in with Google</span>
                  </button>

                  {/* Android & Mobile Helper Callout */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
                    <Smartphone className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong className="text-slate-800">Using Android or Mobile Chrome?</strong> If popup blockers or storage partitioning restricts Google sign-in on your phone, you can switch to the{' '}
                      <button
                        onClick={() => {
                          setAuthMode('email');
                          clearAuthError();
                        }}
                        className="text-indigo-600 font-semibold underline hover:text-indigo-800 cursor-pointer"
                      >
                        Email & Password tab
                      </button>{' '}
                      for direct, hassle-free access.
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Email & Password Sign In / Sign Up */}
              {authMode === 'email' && (
                <form onSubmit={handleEmailAuth} className="space-y-4 pt-1">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-sm font-bold text-slate-800">
                      {isSignUp ? 'Create a Secure Account' : 'Sign In with Email'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        clearAuthError();
                      }}
                      className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
                    >
                      {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                  </div>

                  {isSignUp && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g., Alex Johnson"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">Password</label>
                      {!isSignUp && (
                        <button
                          type="button"
                          onClick={() => {
                            setResetEmail(email);
                            setShowResetModal(true);
                          }}
                          className="text-[11px] text-indigo-600 font-medium hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isSignUp ? "At least 6 characters" : "Enter your password"}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !email.trim() || !password}
                    className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Processing...
                      </span>
                    ) : (
                      <>
                        <span>{isSignUp ? 'Create Account' : 'Sign In with Email'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Demo Mode Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={signInAsDemo}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs cursor-pointer"
                >
                  <PlayCircle className="h-4 w-4 text-indigo-600" />
                  <span>Try Demo Mode</span>
                </button>
                <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  256-Bit Encrypted
                </span>
              </div>
            </div>

          </div>
          
          {/* Right Column: Hero Graphic / Branding */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-900 group">
              <img 
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1000" 
                alt="Organized Planning and Fresh Start" 
                className="w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-opacity duration-700"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1000';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent" />
              
              {/* Stylized Badge Overlay */}
              <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center px-6 text-center">
                <div className="bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 px-6 py-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform -rotate-1 hover:rotate-0 transition-all duration-500">
                  <div className="text-2xl md:text-3xl font-black text-white tracking-[0.2em] mb-1 leading-none uppercase">NEXT STEPS</div>
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-500 to-transparent my-2.5" />
                  <div className="text-[9px] md:text-[10px] font-bold text-amber-400 uppercase tracking-[0.35em] whitespace-nowrap">
                    Estate Planning Solutions
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-16 px-6 border-t border-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Everything you need to organize your estate</h2>
              <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
                A purpose-built suite of tools designed specifically for family estate planning and wealth organization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Centralized Vault</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Catalog assets, debts, real estate, trusts, and insurance policies securely in one accessible place.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Secure Beneficiary Sharing</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Grant read-only or edit access to trusted loved ones, co-trustees, or advisors when needed.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Family Estate Reports</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Generate complete 10-section Estate Financial Planning reports, Word docs, and print-ready PDFs.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
        <p className="text-slate-600">
          By using "Next Steps", you agree to the terms outlined in this{' '}
          <button onClick={() => setIsPrivacyOpen(true)} className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium cursor-pointer">
            Privacy Policy
          </button>.
        </p>
        <p>© {new Date().getFullYear()} Next Steps. All rights reserved.</p>
      </footer>

      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />

      {/* Forgot Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-600" />
                Reset Password
              </h3>
              <button 
                onClick={() => {
                  setShowResetModal(false);
                  setResetSent(false);
                  setResetError(null);
                }} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {resetSent ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Reset Email Sent!
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    We sent a password reset link to <strong>{resetEmail}</strong>. Follow the instructions in the email to set your new password.
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Enter the email address associated with your account. We will send you a secure link to reset your password.
                  </p>
                  
                  {resetError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      autoFocus
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowResetModal(false)}
                      className="px-4 py-2 text-sm text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading || !resetEmail.trim()}
                      className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                    >
                      {resetLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
