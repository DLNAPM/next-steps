import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { UserPlus, Trash2, Shield, Mail, Check, AlertCircle, Lock, Sparkles } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import PremiumModal from '../components/PremiumModal';

interface SharedUser {
  sharedWithEmail: string;
  permission: 'read' | 'edit';
  status: 'pending' | 'accepted';
  ownerId: string;
}

export default function ShareAccess() {
  const { user } = useAuth();
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(true);
  const { register, handleSubmit, reset } = useForm<{ email: string; permission: 'read' | 'edit' }>();

  // Fetch shared users
  useEffect(() => {
    if (!user || user.isGuest || user.isDemo || !db) return;

    const q = query(collection(db, 'shared_access'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: SharedUser[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as SharedUser);
      });
      setSharedUsers(users);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'shared_access');
    });

    return () => unsubscribe();
  }, [user]);

  const onSubmit = async (data: { email: string; permission: 'read' | 'edit' }) => {
    if (!user || !db) return;
    
    if (!user.isPremium) {
      setError('Inviting family members is a Premium (PRO) feature. Please upgrade to use this feature.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create a composite ID to ensure uniqueness per user-email pair
      const docId = `${user.uid}_${data.email}`;
      await setDoc(doc(db, 'shared_access', docId), {
        ownerId: user.uid,
        sharedWithEmail: data.email,
        permission: data.permission,
        status: 'accepted', // Auto-accept for now
        createdAt: serverTimestamp(),
      });
      reset();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'shared_access');
      setError("Failed to share access. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const removeUser = async (email: string) => {
    if (!user || !db) return;
    if (!confirm(`Are you sure you want to remove access for ${email}?`)) return;

    try {
      const docId = `${user.uid}_${email}`;
      await deleteDoc(doc(db, 'shared_access', docId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'shared_access');
      alert("Failed to remove user.");
    }
  };

  if (user?.isGuest || user?.isDemo) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <UserPlus className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Sharing is disabled in Demo/Guest Mode</h2>
        <p className="text-slate-500 max-w-md mt-2">
          To share your financial records securely with family members, please sign in with your Google Account.
        </p>
      </div>
    );
  }

  if (!user?.isPremium) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <PremiumModal 
          isOpen={showPremiumModal} 
          onClose={() => setShowPremiumModal(false)} 
          featureName="Share Access"
        />
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Premium Feature</h2>
          <p className="text-lg text-slate-600 max-w-lg mb-8">
            Sharing access with family members is available exclusively to Premium members. Upgrade your account to securely share your financial records.
          </p>
          <button 
            onClick={() => setShowPremiumModal(true)}
            className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Share Access</h2>
        <p className="text-slate-500 mt-1">
          Grant loved ones access to these records. They will need to sign in with the email address you invite.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Invite Family Member</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="sr-only">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                {...register('email', { required: true })}
                type="email"
                placeholder="Enter email address"
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <label className="sr-only">Permission</label>
            <select
              {...register('permission')}
              className="block w-full pl-3 pr-10 py-2 text-base border border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
            >
              <option value="read">Read Only</option>
              <option value="edit">Read & Write</option>
            </select>
          </div>
          <button
            type={user?.isPremium ? "submit" : "button"}
            onClick={!user?.isPremium ? () => setError('Inviting family members is a Premium (PRO) feature. Please upgrade to use this feature.') : undefined}
            disabled={loading}
            className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 ${user?.isPremium ? 'text-white bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {user?.isPremium ? <UserPlus className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
            {loading ? 'Sending...' : 'Invite'}
            {!user?.isPremium && <span className="ml-2 text-[10px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full font-bold tracking-wider">PRO</span>}
          </button>
        </form>
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-900">People with Access</h3>
        </div>
        <ul className="divide-y divide-slate-100">
          {sharedUsers.length === 0 ? (
            <li className="px-6 py-8 text-center text-slate-500 italic">
              No one has been invited yet.
            </li>
          ) : (
            sharedUsers.map((u) => (
              <li key={u.sharedWithEmail} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {u.sharedWithEmail?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{u.sharedWithEmail}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className={u.permission === 'edit' ? 'text-amber-600' : 'text-slate-500'}>
                        {u.permission === 'edit' ? 'Can Edit' : 'Read Only'}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-600">
                        Has Access
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeUser(u.sharedWithEmail)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove Access"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
