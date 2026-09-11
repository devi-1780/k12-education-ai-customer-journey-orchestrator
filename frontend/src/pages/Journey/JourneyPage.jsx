import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchJourney } from '../../features/journey/journeySlice.js';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import Pagination from '../../components/Pagination.jsx';
import Badge from '../../components/Badge.jsx';

const STAGES = ['admission', 'timetable_planning', 'teaching', 'assessment', 'attendance', 'parent_communication', 'support_intervention', 'reporting'];

export default function JourneyPage() {
  const dispatch = useDispatch();
  const { items, meta, status, error } = useSelector((s) => s.journey);
  const [filters, setFilters] = useState({ page: 1, stage: '', status: '' });

  useEffect(() => {
    dispatch(fetchJourney(filters));
  }, [dispatch, filters]);

  return (
    <div>
      <PageHeader title="Journey Timeline & Service History" breadcrumbs={['Dashboard', 'Journey']} />

      <div className="flex flex-wrap gap-2 mb-4">
        <select className="input max-w-[220px]" value={filters.stage} onChange={(e) => setFilters((f) => ({ ...f, stage: e.target.value, page: 1 }))}>
          <option value="">All journey stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="input max-w-[180px]" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}>
          <option value="">All statuses</option>
          {['open', 'in_progress', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {status === 'loading' && <Loading />}
      {status === 'failed' && <ErrorState message={error} />}
      {status === 'succeeded' && items.length === 0 && <EmptyState title="No journey events found" />}

      {status === 'succeeded' && items.length > 0 && (
        <div className="card">
          <ol className="border-l border-slate-200 pl-4 space-y-4">
            {items.map((i) => (
              <li key={i._id} className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-brand-500 rounded-full" />
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <p className="text-sm font-medium capitalize">{i.stage.replace('_', ' ')} — {i.profileId?.fullName || 'Unknown profile'}</p>
                  <Badge value={i.status} />
                </div>
                <p className="text-sm text-slate-600">{i.summary}</p>
                <p className="text-xs text-slate-400">{new Date(i.occurredAt).toLocaleString()} · via {i.channel}</p>
              </li>
            ))}
          </ol>
          <Pagination meta={meta} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />
        </div>
      )}
    </div>
  );
}
