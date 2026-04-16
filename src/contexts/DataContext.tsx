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
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
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
  }, [user]);

  const mapDocToRecord = (doc: any): FinancialRecord => {
    const data = doc.data();
    
    const parseTimestamp = (ts: any) => {
      if (!ts) return Date.now();
      if (typeof ts === 'number') return ts;
      if (typeof ts.toMillis === 'function') return ts.toMillis();
      if (ts.seconds) return ts.seconds * 1000;
      if (typeof ts === 'string') {
        const num = Number(ts);
        if (!isNaN(num)) return num;
        const parsed = new Date(ts).getTime();
        return isNaN(parsed) ? Date.now() : parsed;
      }
      return Date.now();
    };

    return {
      ...data,
      id: doc.id,
      createdAt: parseTimestamp(data.createdAt),
      updatedAt: parseTimestamp(data.updatedAt),
    } as FinancialRecord;
  };

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
      myRecords = snap.docs.map(mapDocToRecord);
      updateAllRecords();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'records');
    });
    unsubscribes.push(unsubMy);

    // 2. Listen to SHARED_ACCESS to find other owners
    if (user.email) {
      const qShared = query(collection(db, 'shared_access'), where('sharedWithEmail', '==', user.email));
      const unsubShared = onSnapshot(qShared, (snap) => {
        // For each shared access doc, we get an ownerId
        const ownerIds = snap.docs.map(doc => doc.data().ownerId as string);
        
        ownerIds.forEach(ownerId => {
           const qOwner = query(collection(db, 'records'), where('userId', '==', ownerId));
           const unsubOwner = onSnapshot(qOwner, (ownerSnap) => {
             const ownerRecords = ownerSnap.docs.map(mapDocToRecord);
             sharedRecordsMap[ownerId] = ownerRecords;
             updateAllRecords();
           }, (error) => {
             handleFirestoreError(error, OperationType.LIST, `records`);
           });
           unsubscribes.push(unsubOwner);
        });
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'shared_access');
      });
      unsubscribes.push(unsubShared);
    }

    return () => {
      unsubscribes.forEach(u => u());
    };
  }, [user]);

  const addRecord = async (recordData: Omit<FinancialRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    // Remove undefined fields to prevent Firebase errors
    const cleanRecordData = Object.fromEntries(
      Object.entries(recordData).filter(([_, v]) => v !== undefined)
    );

    const newRecord = {
      ...cleanRecordData,
      userId: user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (user.isGuest || user.isDemo) {
      const guestRecord = { ...newRecord, id: uuidv4() } as FinancialRecord;
      setRecords(prev => [...prev, guestRecord]);
    } else if (db) {
      try {
        await addDoc(collection(db, 'records'), {
          ...newRecord,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'records');
      }
    }
  };

  const updateRecord = async (id: string, recordData: Partial<FinancialRecord>) => {
    if (!user) return;

    // Remove undefined fields to prevent Firebase errors
    const cleanRecordData = Object.fromEntries(
      Object.entries(recordData).filter(([_, v]) => v !== undefined)
    );

    if (user.isGuest || user.isDemo) {
      setRecords(prev => prev.map(r => r.id === id ? { ...r, ...cleanRecordData, updatedAt: Date.now() } : r));
    } else if (db) {
      const recordRef = doc(db, 'records', id);
      try {
        await updateDoc(recordRef, {
          ...cleanRecordData,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `records/${id}`);
      }
    }
  };

  const deleteRecord = async (id: string) => {
    if (!user) return;

    if (user.isGuest || user.isDemo) {
      setRecords(prev => prev.filter(r => r.id !== id));
    } else if (db) {
      try {
        await deleteDoc(doc(db, 'records', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `records/${id}`);
      }
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
