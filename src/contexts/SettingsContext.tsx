import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

interface UserSettings {
  logoUrl?: string;
}

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.isGuest || user.isDemo || !db) {
      setSettings({});
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'user_settings', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as UserSettings);
      } else {
        setSettings({});
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user || user.isGuest || user.isDemo || !db) {
      // For guest/demo, just update local state
      setSettings(prev => ({ ...prev, ...newSettings }));
      return;
    }

    const settingsRef = doc(db, 'user_settings', user.uid);
    await setDoc(settingsRef, newSettings, { merge: true });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
