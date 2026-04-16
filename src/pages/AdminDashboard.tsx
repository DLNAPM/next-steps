import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { useAuth } from '../contexts/AuthContext';
import { Shield, UserX, UserCheck, Star, Snowflake, Trash2, ShieldAlert, Users, PieChart as PieChartIcon } from 'lucide-react';
import { UserProfile } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold pointer-events-none">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.isAdmin || !db) return;

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      })) as UserProfile[];
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, [user]);

  const handleTogglePremium = async (targetUserId: string, currentPremium: boolean) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'users', targetUserId), {
        isPremium: !currentPremium
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${targetUserId}`);
    }
  };

  const handleToggleFreeze = async (targetUserId: string, currentFrozen: boolean) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'users', targetUserId), {
        isFrozen: !currentFrozen
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${targetUserId}`);
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    if (!db) return;
    if (targetUserId === user?.uid) {
      alert("You cannot delete your own admin account.");
      return;
    }
    const confirmed = window.confirm('Are you sure you want to completely delete this user record? This action cannot be undone.');
    if (!confirmed) return;
    try {
      // NOTE: This deletes them from the Firestore map but NOT Firebase auth completely.
      // A more robust backend is needed to delete Firebase auth, but this prevents login if handled via freeze/deleted fields.
      await deleteDoc(doc(db, 'users', targetUserId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${targetUserId}`);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-slate-500 mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  const totalUsers = users.length;
  // If an Admin also has isPremium flag, we just count them as Admin for the distribution.
  const adminUsersCount = users.filter(u => u.isAdmin).length;
  const premiumUsersCount = users.filter(u => u.isPremium && !u.isAdmin).length;
  const basicUsersCount = users.filter(u => !u.isPremium && !u.isAdmin).length;

  const pieData = [
    { name: 'Admins', value: adminUsersCount },
    { name: 'Premium', value: premiumUsersCount },
    { name: 'Basic', value: basicUsersCount }
  ].filter(d => d.value > 0);

  const COLORS = ['#6366f1', '#f59e0b', '#94a3b8']; // Indigo (Admin), Amber (Premium), Slate (Basic)

  const getPercent = (count: number) => totalUsers > 0 ? ((count / totalUsers) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" />
          Admin Dashboard
        </h2>
        <p className="text-slate-500 mt-1">Manage users, adjust premium services, and secure accounts.</p>
      </div>

      {!loading && totalUsers > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-6 flex flex-col justify-center items-center">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-slate-500" />
              User Distribution Graph
            </h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [value, 'Users']} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              Distribution Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="font-medium text-slate-700">Total Users</span>
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-900">{totalUsers}</div>
                  <div className="text-xs text-slate-500 font-medium">100% of total users</div>
                </div>
              </div>
              <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                <span className="font-medium text-indigo-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500" /> Total Admin Users
                </span>
                <div className="text-right">
                  <div className="text-xl font-bold text-indigo-700">{adminUsersCount}</div>
                  <div className="text-xs text-indigo-600/70 font-medium">{getPercent(adminUsersCount)}% of total users</div>
                </div>
              </div>
              <div className="flex justify-between items-center bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                <span className="font-medium text-amber-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" /> Total Premium Users
                </span>
                <div className="text-right">
                  <div className="text-xl font-bold text-amber-700">{premiumUsersCount}</div>
                  <div className="text-xs text-amber-600/70 font-medium">{getPercent(premiumUsersCount)}% of total users</div>
                </div>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <span className="font-medium text-slate-700 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-400" /> Total Basic Users
                </span>
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-700">{basicUsersCount}</div>
                  <div className="text-xs text-slate-500 font-medium">{getPercent(basicUsersCount)}% of total users</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">Registered Users ({users.length})</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-3 font-semibold">User</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.uid} className={`hover:bg-slate-50 ${u.isFrozen ? 'bg-indigo-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full border border-slate-200" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                            {u.displayName?.[0] || 'U'}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            {u.displayName || 'Unknown Name'}
                            {u.isAdmin && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">ADMIN</span>}
                          </div>
                          <div className="text-xs text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        {u.isFrozen ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            <Snowflake className="w-3 h-3" /> Frozen
                          </span>
                        ) : u.isPremium ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            <Star className="w-3 h-3" /> Premium
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                            Basic
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTogglePremium(u.uid, !!u.isPremium)}
                          className={`p-2 rounded-lg transition-colors ${u.isPremium ? 'text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:bg-slate-100 hover:text-amber-500'}`}
                          title={u.isPremium ? "Revoke Premium" : "Make Premium"}
                        >
                          <Star className={`w-5 h-5 ${u.isPremium ? 'fill-current' : ''}`} />
                        </button>
                        
                        <button
                          onClick={() => handleToggleFreeze(u.uid, !!u.isFrozen)}
                          className={`p-2 rounded-lg transition-colors ${u.isFrozen ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-400 hover:bg-slate-100 hover:text-blue-500'}`}
                          title={u.isFrozen ? "Unfreeze Account" : "Freeze Account"}
                        >
                          {u.isFrozen ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u.uid)}
                          disabled={u.uid === user.uid}
                          className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete User"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
