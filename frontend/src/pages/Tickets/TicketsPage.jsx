import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTickets } from '../../features/tickets/ticketsSlice.js';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import Pagination from '../../components/Pagination.jsx';
import Badge from '../../components/Badge.jsx';
import TicketDetail from './TicketDetail.jsx';
import api from '../../api/axiosInstance.js';

export default function TicketsPage() {
  const dispatch = useDispatch();
  const { items, meta, status, error } = useSelector((s) => s.tickets);
  const { user } = useSelector((s) => s.auth);
  const [filters, setFilters] = useState({ page: 1, status: '', priority: '' });
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ subject: '', initialMessage: '', profileId: '' });
  const [profiles, setProfiles] = useState([]);

  const refresh = () => dispatch(fetchTickets(filters));
  useEffect(() => { refresh(); }, [dispatch, filters]);

  useEffect(() => {
    api.get('/profiles', { params: { limit: 50 } }).then(({ data }) => setProfiles(data.data));
  }, []);

  const submitTicket = async (e) => {
    e.preventDefault();
    await api.post('/tickets', form);
    setCreating(false);
    setForm({ subject: '', initialMessage: '', profileId: '' });
    refresh();
  };

  return (
    <div>
      <PageHeader
        title="Service Tickets & Agent Assist"
        breadcrumbs={['Dashboard', 'Tickets']}
        actions={<button className="btn-primary" onClick={() => setCreating(true)}>New ticket</button>}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <select className="input max-w-[180px]" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}>
          <option value="">All statuses</option>
          {['open', 'pending_review', 'in_progress', 'deferred', 'escalated', 'closed'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="input max-w-[160px]" value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value, page: 1 }))}>
          <option value="">All priorities</option>
          {['low', 'medium', 'high', 'urgent'].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {status === 'loading' && <Loading />}
      {status === 'failed' && <ErrorState message={error} />}
      {status === 'succeeded' && items.length === 0 && <EmptyState title="No tickets found" />}

      {status === 'succeeded' && items.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Family</th>
                <th className="py-2 pr-4">Priority</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Assigned</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 pr-4 font-medium text-slate-800">{t.subject}</td>
                  <td className="py-2 pr-4">{t.profileId?.fullName || '—'}</td>
                  <td className="py-2 pr-4"><Badge value={t.priority} /></td>
                  <td className="py-2 pr-4"><Badge value={t.status} /></td>
                  <td className="py-2 pr-4">{t.assignedTo?.name || 'Unassigned'}</td>
                  <td className="py-2 pr-4">
                    <button className="text-brand-600 font-medium" onClick={() => setSelected(t._id)}>Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={meta} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <form onSubmit={submitTicket} className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">New ticket</h2>
              <button type="button" className="btn-ghost" onClick={() => setCreating(false)}>✕</button>
            </div>
            <select className="input" value={form.profileId} onChange={(e) => setForm((f) => ({ ...f, profileId: e.target.value }))} required>
              <option value="">Select family / profile</option>
              {profiles.map((p) => <option key={p._id} value={p._id}>{p.fullName}</option>)}
            </select>
            <input className="input" placeholder="Subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} required />
            <textarea className="input" placeholder="Describe the issue..." value={form.initialMessage} onChange={(e) => setForm((f) => ({ ...f, initialMessage: e.target.value }))} />
            <button className="btn-primary w-full">Create ticket</button>
          </form>
        </div>
      )}

      {selected && <TicketDetail id={selected} onClose={() => { setSelected(null); refresh(); }} canManage={['admin', 'service_agent'].includes(user?.role)} />}
    </div>
  );
}
