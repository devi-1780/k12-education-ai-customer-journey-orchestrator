import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReports } from '../../features/reports/reportsSlice.js';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Badge from '../../components/Badge.jsx';

const TYPES = ['journey', 'campaign', 'service', 'conversion', 'retention'];

export default function ReportsPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.reports);
  const [form, setForm] = useState({ name: '', type: 'service', format: 'csv' });
  const [generating, setGenerating] = useState(false);

  const refresh = () => dispatch(fetchReports());
  useEffect(() => { refresh(); }, [dispatch]);

  const generate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.post('/reports', form);
      setForm((f) => ({ ...f, name: '' }));
      refresh();
    } finally {
      setGenerating(false);
    }
  };

  const download = async (report) => {
    const res = await api.get(`/reports/${report._id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name}.${report.format}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Reports & Analytics" breadcrumbs={['Dashboard', 'Reports']} />

      <form onSubmit={generate} className="card mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-slate-700">Report name</label>
          <input className="input mt-1" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Type</label>
          <select className="input mt-1" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Format</label>
          <select className="input mt-1" value={form.format} onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))}>
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
        <div className="sm:col-span-4">
          <button className="btn-primary" disabled={generating}>{generating ? 'Generating...' : 'Generate report'}</button>
        </div>
      </form>

      {status === 'loading' && <Loading />}
      {status === 'succeeded' && items.length === 0 && <EmptyState title="No reports generated yet" />}

      {items.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Format</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Generated</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r._id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium">{r.name}</td>
                  <td className="py-2 pr-4 capitalize">{r.type}</td>
                  <td className="py-2 pr-4 uppercase">{r.format}</td>
                  <td className="py-2 pr-4"><Badge value={r.status} /></td>
                  <td className="py-2 pr-4 text-slate-500">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="py-2 pr-4">
                    {r.status === 'completed' && <button className="text-brand-600 font-medium" onClick={() => download(r)}>Download</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
