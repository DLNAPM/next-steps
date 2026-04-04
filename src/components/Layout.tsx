import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, Landmark, CreditCard, Shield, Menu, X, Users, FileText, Database, HelpCircle, Briefcase, BookOpen, Sparkles, Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import HelpModal from './HelpModal';
import AppIcon from './AppIcon';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showChatbotWidget, setShowChatbotWidget] = useState(false);

  useEffect(() => {
    // Show chatbot widget 30 seconds after mounting (logging in)
    const timer = setTimeout(() => {
      setShowChatbotWidget(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/assets', label: 'Assets', icon: Landmark },
    { path: '/debts', label: 'Debts', icon: CreditCard },
    { path: '/insurance', label: 'Insurance', icon: Shield },
    { path: '/trusts', label: 'Family Trusts & Wills', icon: Briefcase },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/data', label: 'Data Import/Export', icon: Database },
    { path: '/share', label: 'Share Access', icon: Users },
    { path: '/qa', label: 'Glossary & Q&A', icon: BookOpen },
    { path: '/advisor', label: 'AI Advisor', icon: Sparkles, premium: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row print:bg-white print:block">
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shadow-sm print:hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <AppIcon size="sm" className="rounded-lg" />
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">Next Steps</h1>
              <p className="text-[10px] text-slate-500 font-medium">Family Financial Records</p>
            </div>
          </div>
          <button 
            onClick={() => setIsHelpOpen(true)}
            className="text-slate-400 hover:text-indigo-600 transition-colors -mt-1 -mr-2 p-2"
            title="Help & Information"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  isActive 
                    ? "bg-indigo-50 text-indigo-700" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-5 h-5", item.premium && !isActive ? "text-amber-500" : "")} />
                  {item.label}
                </div>
                {item.premium && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    Pro
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                {user?.displayName?.[0] || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.isGuest ? 'Guest Mode' : user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <AppIcon size="sm" className="rounded-lg" />
          <h1 className="text-xl font-bold text-slate-800">Next Steps</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsHelpOpen(true)}
            className="p-2 text-slate-400 hover:text-indigo-600"
          >
            <HelpCircle className="w-6 h-6" />
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-lg z-50">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg",
                    isActive 
                      ? "bg-indigo-50 text-indigo-700" 
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-5 h-5", item.premium && !isActive ? "text-amber-500" : "")} />
                    {item.label}
                  </div>
                  {item.premium && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      Pro
                    </span>
                  )}
                </Link>
              );
            })}
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8 relative print:p-0 print:overflow-visible print:block">
        <div className="max-w-5xl mx-auto print:max-w-none print:mx-0">
          <Outlet />
        </div>
      </main>

      {/* Floating Chatbot Widget */}
      {showChatbotWidget && location.pathname !== '/advisor' && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
          <div className="bg-white px-4 py-2 rounded-xl shadow-lg border border-slate-200 animate-bounce relative">
            <span className="text-sm font-bold text-indigo-600 whitespace-nowrap">Chat With Us!</span>
            <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-l-8 border-l-white border-b-8 border-b-transparent drop-shadow-sm"></div>
          </div>
          <button
            onClick={() => navigate('/advisor')}
            className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-indigo-700 transition-all hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
          >
            <Bot className="w-7 h-7" />
          </button>
        </div>
      )}
    </div>
  );
}
