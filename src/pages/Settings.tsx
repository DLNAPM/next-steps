import React, { useRef, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { Upload, Image as ImageIcon, Trash2, AlertCircle, Lock, Sparkles } from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings, loading } = useSettings();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) { // 500KB limit
      setError('Logo file size must be less than 500KB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateSettings({ logoUrl: base64String })
        .then(() => setError(null))
        .catch(err => {
          console.error("Error saving logo:", err);
          setError("Failed to save logo. Please try again.");
        });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    updateSettings({ logoUrl: '' })
      .catch(err => {
        console.error("Error removing logo:", err);
        setError("Failed to remove logo.");
      });
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading settings...</div>;
  }

  if (!user?.isPremium) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Premium Feature</h2>
          <p className="text-lg text-slate-600 max-w-lg mb-8">
            Customizing your Print & Export Logo is available exclusively to Premium members. Upgrade your account to personalize your reports and sessions.
          </p>
          <button className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500 mt-1">
          Manage your application preferences and customizations.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-900">Print & Export Logo</h3>
          <p className="text-sm text-slate-500 mt-1">
            Upload a logo to be used when printing or exporting Reports and AI Advisor Sessions.
          </p>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="flex-1 w-full">
              <div 
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[200px]"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-slate-400 mb-3" />
                <p className="text-sm font-medium text-slate-900">Click to upload logo</p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 500KB</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />
              </div>
            </div>

            <div className="w-full sm:w-64 shrink-0 flex flex-col items-center">
              <p className="text-sm font-medium text-slate-700 mb-3 w-full text-left">Current Logo Preview</p>
              <div className="w-full aspect-video bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center p-4 relative overflow-hidden">
                {settings.logoUrl ? (
                  <img 
                    src={settings.logoUrl} 
                    alt="Custom Logo" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs">No logo set</span>
                  </div>
                )}
              </div>
              
              {settings.logoUrl && (
                <button
                  onClick={handleRemoveLogo}
                  className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors w-full justify-center font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Logo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
