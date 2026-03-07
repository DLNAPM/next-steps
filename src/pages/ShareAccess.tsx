import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { UserPlus, Trash2, Shield, Mail, Check } from 'lucide-react';

interface SharedUser {
  email: string;
  permission: 'read' | 'edit';
  status: 'pending' | 'accepted';
}

export default function ShareAccess() {
  const { user } = useAuth();
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([
    // Mock data for demonstration if authenticated, or empty
  ]);
  const { register, handleSubmit, reset } = useForm<{ email: string; permission: 'read' | 'edit' }>();

  const onSubmit = (data: { email: string; permission: 'read' | 'edit' }) => {
    setSharedUsers([...sharedUsers, { ...data, status: 'pending' }]);
    reset();
    alert(`Invitation sent to ${data.email}`);
  };

  const removeUser = (email: string) => {
    setSharedUsers(sharedUsers.filter(u => u.email !== email));
  };

  if (user?.isGuest) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <UserPlus className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Sharing is disabled in Guest Mode</h2>
        <p className="text-slate-500 max-w-md mt-2">
          To share your financial records securely with family members, please sign in with your Google Account.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Share Access</h2>
        <p className="text-slate-500 mt-1">
          Grant loved ones access to these records. They will need a Google Account to sign in.
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
            type="submit"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite
          </button>
        </form>
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
              <li key={u.email} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {u.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{u.email}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className={u.permission === 'edit' ? 'text-amber-600' : 'text-slate-500'}>
                        {u.permission === 'edit' ? 'Can Edit' : 'Read Only'}
                      </span>
                      <span>•</span>
                      <span className={u.status === 'accepted' ? 'text-emerald-600' : 'text-slate-400'}>
                        {u.status === 'accepted' ? 'Accepted' : 'Pending Invitation'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeUser(u.email)}
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
