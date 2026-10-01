import React, { useState } from 'react';
import {
  UserCheck,
  Shield,
  UserPlus,
  Mail,
  Key,
  Trash2,
  CheckCircle2,
  X,
  Building2,
  Lock,
  Plus
} from 'lucide-react';
import { Workspace } from '../types/fbr';

export interface UserRoleRecord {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TAX_CONSULTANT' | 'CHIEF_ACCOUNTANT' | 'AUDITOR';
  assignedWorkspaceId: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  lastActive: string;
}

const PERMISSIONS_MATRIX = [
  { module: 'Tax Invoices Master', admin: true, consultant: true, accountant: true, auditor: true },
  { module: 'Excel & ERP Ingestion', admin: true, consultant: true, accountant: true, auditor: false },
  { module: 'FBR PRAL Submission', admin: true, consultant: true, accountant: false, auditor: false },
  { module: 'Customer & Product Master', admin: true, consultant: true, accountant: true, auditor: false },
  { module: 'Tax & Tariff Configuration', admin: true, consultant: true, accountant: false, auditor: false },
  { module: 'Security Keys & Adapter', admin: true, consultant: false, accountant: false, auditor: false },
  { module: 'Audit Log & History', admin: true, consultant: true, accountant: true, auditor: true },
];

export function UsersRolesView({ workspace }: { workspace: Workspace }) {
  const [users, setUsers] = useState<UserRoleRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      localStorage.removeItem('paktax_users_v1');
      localStorage.removeItem('paktax_users_v2');
      localStorage.removeItem(`paktax_users_v2_${workspace.id}`);
      const saved = localStorage.getItem(`paktax_users_v3_${workspace.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<UserRoleRecord>>({
    role: 'CHIEF_ACCOUNTANT',
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    const user: UserRoleRecord = {
      id: `usr_${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role || 'CHIEF_ACCOUNTANT',
      assignedWorkspaceId: workspace.id,
      status: 'INVITED',
      lastActive: 'Never',
    };

    const updated = [...users, user];
    setUsers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`paktax_users_v3_${workspace.id}`, JSON.stringify(updated));
    }
    setIsInviteOpen(false);
    setNewUser({ role: 'CHIEF_ACCOUNTANT' });
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Revoke access for this user?')) {
      const updated = users.filter((u) => u.id !== id);
      setUsers(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`paktax_users_v3_${workspace.id}`, JSON.stringify(updated));
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-stone-900">Users & Role-Based Access Control (RBAC)</h2>
          <p className="text-xs text-stone-600 font-medium mt-0.5">
            Manage tax consultants, chief accountants, signatories, and compliance auditors.
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Authorized User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold">
                <th className="p-3.5">User Name</th>
                <th className="p-3.5">Email Address</th>
                <th className="p-3.5">Assigned Role</th>
                <th className="p-3.5">Workspace</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-900 font-sans text-xs">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-stone-500">
                    <UserCheck className="w-10 h-10 mx-auto text-stone-300 mb-3" />
                    <div className="text-base font-bold text-stone-800">No Authorized Users Configured</div>
                    <div className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                      Click the invite button above to add tax consultants or accountants to this compliance workspace.
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50">
                    <td className="p-3.5 font-bold text-stone-900">{u.name}</td>
                    <td className="p-3.5 font-mono text-stone-600">{u.email}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-bold text-[10px]">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-stone-700 font-medium">{workspace.profile.businessName || 'Current Workspace'}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Remove User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900">Privilege & Role Separation Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-700 font-bold bg-stone-50">
                <th className="p-3">Functional Module</th>
                <th className="p-3 text-center">Administrator</th>
                <th className="p-3 text-center">Tax Consultant</th>
                <th className="p-3 text-center">Chief Accountant</th>
                <th className="p-3 text-center">Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-800">
              {PERMISSIONS_MATRIX.map((perm) => (
                <tr key={perm.module} className="hover:bg-stone-50">
                  <td className="p-3 font-semibold text-stone-900">{perm.module}</td>
                  <td className="p-3 text-center">{perm.admin ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : '-'}</td>
                  <td className="p-3 text-center">{perm.consultant ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : '-'}</td>
                  <td className="p-3 text-center">{perm.accountant ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : '-'}</td>
                  <td className="p-3 text-center">{perm.auditor ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /> : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-bold text-stone-900">Invite Team Member</h3>
              <button onClick={() => setIsInviteOpen(false)} className="text-stone-400 hover:text-stone-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-3 text-xs">
              <div>
                <label className="text-stone-700 font-bold block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUser.name || ''}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. Accountant Legal Name"
                />
              </div>

              <div>
                <label className="text-stone-700 font-bold block mb-1">Official Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUser.email || ''}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 focus:border-amber-500 focus:outline-none"
                  placeholder="accountant@company.com"
                />
              </div>

              <div>
                <label className="text-stone-700 font-bold block mb-1">Role Assignment</label>
                <select
                  value={newUser.role || 'CHIEF_ACCOUNTANT'}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900 focus:border-amber-500 focus:outline-none font-medium"
                >
                  <option value="ADMIN">Administrator (Full Access)</option>
                  <option value="TAX_CONSULTANT">Tax Consultant (Filing & Configuration)</option>
                  <option value="CHIEF_ACCOUNTANT">Chief Accountant (Data Ingestion)</option>
                  <option value="AUDITOR">Auditor (Read-Only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
