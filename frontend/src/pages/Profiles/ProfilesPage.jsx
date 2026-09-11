import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfiles } from '../../features/profiles/profilesSlice.js';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import Pagination from '../../components/Pagination.jsx';
import Badge from '../../components/Badge.jsx';
import ProfileDetail from './ProfileDetail.jsx';

export default function ProfilesPage() {
  const dispatch = useDispatch();
  const { items, meta, status, error } = useSelector((s) => s.profiles);
  const [filters, setFilters] = useState({ page: 1, search: '', entityType: '', riskLevel: '' });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    dispatch(fetchProfiles(filters));
  }, [dispatch, filters]);

  return (
    <div>
      <PageHeader title="Unified Customer Profiles" breadcrumbs={['Dashboard', 'Profiles']} />

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search by name or email..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
        />
        <select className="input max-w-[160px]" value={filters.entityType} onChange={(e) => setFilters((f) => ({ ...f, entityType: e.target.value, page: 1 }))}>
          <option value="">All types</option>
          {['student', 'parent', 'teacher', 'school_leader', 'counsellor', 'staff'].map((t) => (
            <option key={t} value={t}>{t.replace('_', ' ')}</option>
          ))}
        </select>
        <select className="input max-w-[160px]" value={filters.riskLevel} onChange={(e) => setFilters((f) => ({ ...f, riskLevel: e.target.value, page: 1 }))}>
          <option value="">All risk levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {status === 'loading' && <Loading />}
      {status === 'failed' && <ErrorState message={error} />}
      {status === 'succeeded' && items.length === 0 && <EmptyState title="No profiles found" description="Try adjusting your filters." />}

      {status === 'succeeded' && items.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Contact</th>
                <th className="py-2 pr-4">Risk</th>
                <th className="py-2 pr-4">Tags</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 pr-4 font-medium text-slate-800">{p.fullName}</td>
                  <td className="py-2 pr-4 capitalize">{p.entityType.replace('_', ' ')}</td>
                  <td className="py-2 pr-4 text-slate-500">{p.email || p.phone || '—'}</td>
                  <td className="py-2 pr-4"><Badge value={p.riskLevel} /></td>
                  <td className="py-2 pr-4">{(p.tags || []).slice(0, 2).join(', ')}</td>
                  <td className="py-2 pr-4">
                    <button className="text-brand-600 font-medium" onClick={() => setSelected(p._id)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={meta} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />
        </div>
      )}

      {selected && <ProfileDetail id={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
