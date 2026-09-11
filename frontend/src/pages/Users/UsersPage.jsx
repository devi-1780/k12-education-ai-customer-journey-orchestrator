import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from '../../features/users/usersSlice.js';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Badge from '../../components/Badge.jsx';

const ROLES = ['admin', 'sales_manager', 'marketing_manager', 'service_agent', 'customer'];

export default function UsersPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.users);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [search, setSearch] = useState('');

  const refresh = () => dispatch(fetchUsers({ search }));
  useEffect(() => { refresh(); }, [dispatch, search]);

  const createUser = async (e) => {
    e.preventDefault();
    await api.post('/users', form);
    setCreating(false);
    setForm({ name: '', email: '', password: '', role: 'customer' });
    refresh();
  };

  const toggleActive = async (u) => {
    await api.post(`/users/${u._id}/${u.isActive ? 'deactivate' : 'activate'}`);
    refresh();
  };

  return (
    <div>
      <PageHeader
        title="User & Role Management"
        breadcrumbs={['Dashboard', 'Users']}
        actions={<button className="btn-primary" onClick={() => setCreating(true)}>New user</button>}
      />

      <input className="input max-w-xs mb-4" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {status === 'loading' && <Loading />}
      {status === 'succeeded' && items.length === 0 && <EmptyState title="No users found" />}

      {items.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Last login</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u._id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium">{u.name}</td>
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 pr-4 capitalize">{u.role.replace('_', ' ')}</td>
                  <td className="py-2 pr-4">
                    <span className={`badge ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-slate-500">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</td>
                  <td className="py-2 pr-4">
                    <button className="text-brand-600 font-medium" onClick={() => toggleActive(u)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <form onSubmit={createUser} className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">New user</h2>
              <button type="button" className="btn-ghost" onClick={() => setCreating(false)}>✕</button>
            </div>
            <input className="input" placeholder="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            <input className="input" type="password" placeholder="Temporary password (min 8 chars)" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={8} />
            <select className="input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
            <button className="btn-primary w-full">Create user</button>
          </form>
        </div>
      )}
    </div>
  );
}
