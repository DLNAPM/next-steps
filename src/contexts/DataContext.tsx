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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { FinancialRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface DataContextType {
  records: FinancialRecord[];
  loading: boolean;
  addRecord: (record: Omit<FinancialRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRecord: (id: string, record: Partial<FinancialRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
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

    if (user.isGuest) {
      // Guest mode: Data is just in memory (already initialized as empty array or preserved in state)
      // If we wanted to persist guest data across refreshes we'd use localStorage here.
      // The prompt says: "Guest User's data won't be saved once user logs out or closes App"
      // So in-memory is correct.
      return;
    }

    if (db) {
      setLoading(true);
      const q = query(collection(db, 'records'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const data: FinancialRecord[] = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as FinancialRecord);
        });
        setRecords(data);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching records:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const addRecord = async (recordData: Omit<FinancialRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    const newRecord = {
      ...recordData,
      userId: user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (user.isGuest) {
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

    if (user.isGuest) {
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

    if (user.isGuest) {
      setRecords(prev => prev.filter(r => r.id !== id));
    } else if (db) {
      await deleteDoc(doc(db, 'records', id));
    }
  };

  return (
    <DataContext.Provider value={{ records, loading, addRecord, updateRecord, deleteRecord }}>
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
