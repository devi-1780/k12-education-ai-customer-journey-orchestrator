import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAuditLogs } from '../../features/audit/auditSlice.js';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Pagination from '../../components/Pagination.jsx';
import Badge from '../../components/Badge.jsx';

export default function AuditPage() {
  const dispatch = useDispatch();
  const { items, meta, status } = useSelector((s) => s.audit);
  const [filters, setFilters] = useState({ page: 1, action: '', entityType: '', outcome: '' });
  const [tab, setTab] = useState('audit');
  const [config, setConfig] = useState([]);
  const [configForm, setConfigForm] = useState({ key: '', value: '', category: 'thresholds' });

  useEffect(() => { dispatch(fetchAuditLogs(filters)); }, [dispatch, filters]);

  useEffect(() => {
    if (tab === 'settings') api.get('/config').then(({ data }) => setConfig(data.data));
  }, [tab]);

  const saveConfig = async (e) => {
    e.preventDefault();
    let value = configForm.value;
    try { value = JSON.parse(value); } catch { /* keep as string */ }
    await api.put('/config', { ...configForm, value });
    const { data } = await api.get('/config');
    setConfig(data.data);
    setConfigForm({ key: '', value: '', category: 'thresholds' });
  };

  return (
    <div>
      <PageHeader title="Audit Logs & System Settings" breadcrumbs={['Dashboard', 'Audit']} />

      <div className="flex gap-2 mb-4 border-b border-slate-200">
        {['audit', 'settings'].map((t) => (
          <button
            key={t}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500'}`}
            onClick={() => setTab(t)}
          >
            {t === 'audit' ? 'Audit logs' : 'System settings'}
          </button>
        ))}
      </div>

      {tab === 'audit' && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <input className="input max-w-[200px]" placeholder="Filter by action..." value={filters.action} onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value, page: 1 }))} />
            <input className="input max-w-[200px]" placeholder="Filter by entity type..." value={filters.entityType} onChange={(e) => setFilters((f) => ({ ...f, entityType: e.target.value, page: 1 }))} />
            <select className="input max-w-[160px]" value={filters.outcome} onChange={(e) => setFilters((f) => ({ ...f, outcome: e.target.value, page: 1 }))}>
              <option value="">All outcomes</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </div>

          {status === 'loading' && <Loading />}
          {status === 'succeeded' && items.length === 0 && <EmptyState title="No audit entries match your filters" />}

          {items.length > 0 && (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Actor</th>
                    <th className="py-2 pr-4">Action</th>
                    <th className="py-2 pr-4">Entity</th>
                    <th className="py-2 pr-4">Outcome</th>
                    <th className="py-2 pr-4">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => (
                    <tr key={a._id} className="border-b border-slate-100 align-top">
                      <td className="py-2 pr-4 text-slate-500 whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</td>
                      <td className="py-2 pr-4">{a.actorId?.name || 'system'} <span className="text-xs text-slate-400">({a.actorRole})</span></td>
                      <td className="py-2 pr-4 font-mono text-xs">{a.action}</td>
                      <td className="py-2 pr-4">{a.entityType}</td>
                      <td className="py-2 pr-4"><Badge value={a.outcome === 'success' ? 'approved' : 'rejected'} label={a.outcome} /></td>
                      <td className="py-2 pr-4 text-slate-500">{a.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination meta={meta} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />
            </div>
          )}
        </>
      )}

      {tab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-2">
            {config.length === 0 ? (
              <EmptyState title="No configuration entries yet" />
            ) : (
              config.map((c) => (
                <div key={c._id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{c.key}</p>
                    <p className="text-xs text-slate-400 capitalize">{c.category?.replace('_', ' ')}</p>
                  </div>
                  <pre className="text-xs bg-slate-50 rounded px-2 py-1">{JSON.stringify(c.value)}</pre>
                </div>
              ))
            )}
          </div>
          <form onSubmit={saveConfig} className="card space-y-3 h-fit">
            <h3 className="font-medium">Add / update setting</h3>
            <input className="input" placeholder="Key (e.g. ai.confidence_threshold)" value={configForm.key} onChange={(e) => setConfigForm((f) => ({ ...f, key: e.target.value }))} required />
            <input className="input" placeholder="Value (JSON or plain text)" value={configForm.value} onChange={(e) => setConfigForm((f) => ({ ...f, value: e.target.value }))} required />
            <select className="input" value={configForm.category} onChange={(e) => setConfigForm((f) => ({ ...f, category: e.target.value }))}>
              {['ai_settings', 'workflow_rules', 'thresholds', 'integrations', 'notification_rules', 'master_data'].map((c) => (
                <option key={c} value={c}>{c.replace('_', ' ')}</option>
              ))}
            </select>
            <button className="btn-primary w-full">Save setting</button>
          </form>
        </div>
      )}
    </div>
  );
}
