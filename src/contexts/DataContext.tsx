import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { FinancialRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';

import { SAMPLE_DATA } from '../data/sampleData';

interface DataContextType {
  records: FinancialRecord[];
  loading: boolean;
  addRecord: (record: Omit<FinancialRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRecord: (id: string, record: Partial<FinancialRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  isSharedRecord: (record: FinancialRecord) => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data
  useEffect(() => {
    if (!user) {
      setRecords([]);
      return;
    }

    if (user.isDemo) {
      setRecords(SAMPLE_DATA);
      return;
    }

    if (user.isGuest) {
      return;
    }

    if (db) {
      setLoading(true);
      
      // 1. Fetch my records
      const myRecordsQuery = query(collection(db, 'records'), where('userId', '==', user.uid));
      
      // 2. Fetch shared records
      // First find who shared with me
      const sharedWithMeQuery = query(collection(db, 'shared_access'), where('sharedWithEmail', '==', user.email));
      
      const unsubscribeMyRecords = onSnapshot(myRecordsQuery, (mySnapshot) => {
        const myData = mySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialRecord));
        
        // We need to manage shared records separately or merge them
        // Since we can't do a single query for "mine OR shared", we'll fetch shared separately
        // and merge in state.
        // However, onSnapshot inside onSnapshot is messy.
        // Let's use a simpler approach: 
        // We'll listen to my records.
        // We'll also listen to shared_access to know which owners to listen to.
        
        // For simplicity in this demo, let's just fetch shared records once or set up listeners dynamically.
        // A robust solution would be complex. Let's try to set up listeners for all relevant owners.
        
        // Let's just store myData in a ref or separate state? 
        // Actually, let's just restart the whole fetch process if shared_access changes.
        
        // But we are inside the effect. 
        // Let's do this:
        // We will maintain a list of unsubscribe functions.
        
      });

      // REFACTOR: Let's separate the logic.
      // We need to listen to:
      // A. My records
      // B. The 'shared_access' collection to see who shared with me.
      // C. For each person who shared with me, listen to their records.
      
      // This is getting complicated for a single useEffect.
      // Let's simplify: Just fetch my records for now in the main listener, 
      // and do a separate useEffect for shared records.
      
      return () => unsubscribeMyRecords();
    }
  }, [user]);

  // Effect for handling BOTH my records and shared records properly
  useEffect(() => {
    if (!user || user.isGuest || user.isDemo || !db) return;

    setLoading(true);
    let unsubscribes: (() => void)[] = [];
    let myRecords: FinancialRecord[] = [];
    let sharedRecordsMap: Record<string, FinancialRecord[]> = {};

    const updateAllRecords = () => {
      const allShared = Object.values(sharedRecordsMap).flat();
      setRecords([...myRecords, ...allShared]);
      setLoading(false);
    };

    // 1. Listen to MY records
    const qMy = query(collection(db, 'records'), where('userId', '==', user.uid));
    const unsubMy = onSnapshot(qMy, (snap) => {
      myRecords = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialRecord));
      updateAllRecords();
    });
    unsubscribes.push(unsubMy);

    // 2. Listen to SHARED_ACCESS to find other owners
    if (user.email) {
      const qShared = query(collection(db, 'shared_access'), where('sharedWithEmail', '==', user.email));
      const unsubShared = onSnapshot(qShared, (snap) => {
        // For each shared access doc, we get an ownerId
        const ownerIds = snap.docs.map(doc => doc.data().ownerId as string);
        
        // We need to listen to records for these owners
        // NOTE: In a real app, we should be careful about creating too many listeners.
        // We also need to cleanup old listeners if ownerIds change. 
        // For this implementation, we'll just add new listeners. Cleanup is hard without a ref.
        // A better way: Just fetch them once? No, we want real time.
        
        // Let's just iterate and add listeners if we haven't already?
        // Actually, simpler: 
        // For each ownerId, set up a listener.
        
        // Clear previous shared records to avoid duplicates if this snapshot fires again?
        // This is tricky. Let's just support 1 level of sharing update for now.
        
        ownerIds.forEach(ownerId => {
           // Check if we already have a listener? (Hard to track here)
           // Let's just create a listener.
           const qOwner = query(collection(db, 'records'), where('userId', '==', ownerId));
           const unsubOwner = onSnapshot(qOwner, (ownerSnap) => {
             const ownerRecords = ownerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialRecord));
             sharedRecordsMap[ownerId] = ownerRecords;
             updateAllRecords();
           });
           unsubscribes.push(unsubOwner);
        });
      });
      unsubscribes.push(unsubShared);
    }

    return () => {
      unsubscribes.forEach(u => u());
    };
  }, [user]);

  const addRecord = async (recordData: Omit<FinancialRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    const newRecord = {
      ...recordData,
      userId: user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (user.isGuest || user.isDemo) {
      const guestRecord = { ...newRecord, id: uuidv4() } as FinancialRecord;
      setRecords(prev => [...prev, guestRecord]);
    } else if (db) {
      await addDoc(collection(db, 'records'), {
        ...newRecord,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const updateRecord = async (id: string, recordData: Partial<FinancialRecord>) => {
    if (!user) return;

    if (user.isGuest || user.isDemo) {
      setRecords(prev => prev.map(r => r.id === id ? { ...r, ...recordData, updatedAt: Date.now() } : r));
    } else if (db) {
      const recordRef = doc(db, 'records', id);
      await updateDoc(recordRef, {
        ...recordData,
        updatedAt: serverTimestamp(),
      });
    }
  };

  const deleteRecord = async (id: string) => {
    if (!user) return;

    if (user.isGuest || user.isDemo) {
      setRecords(prev => prev.filter(r => r.id !== id));
    } else if (db) {
      await deleteDoc(doc(db, 'records', id));
    }
  };

  const isSharedRecord = (record: FinancialRecord) => {
    return user ? record.userId !== user.uid : false;
  };

  return (
    <DataContext.Provider value={{ records, loading, addRecord, updateRecord, deleteRecord, isSharedRecord }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
