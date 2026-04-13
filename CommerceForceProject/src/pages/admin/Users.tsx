import React, { useEffect, useState } from 'react';
import { User } from '../../shared/types';
import { Search, Loader2, User as UserIcon, CreditCard, Shield, Mail, RefreshCw, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'motion/react';

import { useBranding } from '../../context/BrandingContext';

export const UsersAdmin = () => {
  const { config: brandingConfig } = useBranding();
  const currency = brandingConfig?.currency_symbol || '£';
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRoleUserId, setEditingRoleUserId] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState<number>(0);
  const [newRole, setNewRole] = useState<string>('');
  const { token, user: currentUser } = useAuth();

  const fetchUsers = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleUpdateLimit = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/credit-limit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ creditLimit: newLimit })
      });

      if (res.ok) {
        setEditingId(null);
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to update credit limit:', err);
    }
  };

  const handleUpdateRole = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        setEditingRoleUserId(null);
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to update user role:', err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button 
          onClick={fetchUsers}
          className="p-2 hover:bg-[#141414]/5 rounded-full transition-colors"
        >
          <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-[#141414] pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#141414]"
        />
      </div>

      <div className="border border-[#141414] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] font-mono uppercase tracking-widest">
              <th className="p-4 font-medium">User</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Credit Limit</th>
              <th className="p-4 font-medium">Available Credit</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-white transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#141414]/5 flex items-center justify-center">
                      <UserIcon size={14} className="opacity-40" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs opacity-40">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  {editingRoleUserId === user.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={newRole}
                        onChange={e => setNewRole(e.target.value)}
                        className="bg-white border border-[#141414] px-2 py-1 text-[10px] font-mono uppercase"
                      >
                        <option value="customer">Customer</option>
                        <option value="client">Client</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                      <button 
                        onClick={() => handleUpdateRole(user.id)}
                        className="p-1.5 bg-[#141414] text-white rounded hover:bg-black transition-colors"
                      >
                        <Save size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Shield size={12} className="opacity-30" />
                      <span className="text-[10px] font-mono uppercase">{user.role}</span>
                      {currentUser?.role === 'superadmin' && (
                        <button 
                          onClick={() => {
                            setEditingRoleUserId(user.id);
                            setNewRole(user.role);
                          }}
                          className="p-1 hover:bg-black/5 rounded transition-colors ml-1"
                        >
                          <RefreshCw size={10} className="opacity-40" />
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="p-4">
                  {editingId === user.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={newLimit}
                        onChange={e => setNewLimit(Number(e.target.value))}
                        className="w-24 border border-[#141414] px-2 py-1 text-sm"
                      />
                      <button 
                        onClick={() => handleUpdateLimit(user.id)}
                        className="p-1.5 bg-[#141414] text-white rounded hover:bg-black transition-colors"
                      >
                        <Save size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-mono">{currency}{user.credit_limit?.toLocaleString()}</span>
                  )}
                </td>
                <td className="p-4">
                  <span className={`text-sm font-mono ${user.available_credit! < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {currency}{user.available_credit?.toLocaleString()}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => {
                      setEditingId(user.id);
                      setNewLimit(user.credit_limit || 0);
                    }}
                    className="text-[10px] font-mono uppercase hover:underline"
                  >
                    Edit Limit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
