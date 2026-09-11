import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorState from '../../components/ErrorState.jsx';

function StatCard({ label, value, sub }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useSelector((s) => s.auth);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/dashboard/outcomes-summary')
      .then(({ data }) => { setSummary(data.data); setStatus('succeeded'); })
      .catch((err) => { setError(err.response?.data?.message || 'Failed to load dashboard'); setStatus('failed'); });
  }, []);

  if (status === 'loading') return <Loading label="Loading your dashboard..." />;
  if (status === 'failed') return <ErrorState message={error} />;

  const openTickets = summary.ticketsByStatus?.find((s) => s._id === 'open')?.count || 0;
  const runningCampaigns = summary.campaignsByStatus?.find((s) => s._id === 'running')?.count || 0;

  return (
    <div>
      <PageHeader title={`Welcome back, ${user?.name?.split(' ')[0]}`} breadcrumbs={['Dashboard']} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Unified profiles" value={summary.profileCount} />
        <StatCard label="Open tickets" value={openTickets} />
        <StatCard label="Running campaigns" value={runningCampaigns} />
        <StatCard label="AI recs pending review" value={summary.pendingReviews} sub="Awaiting human approval" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="card">
          <h3 className="font-medium text-slate-800 mb-3">AI recommendation acceptance</h3>
          {summary.acceptanceRate === null ? (
            <p className="text-sm text-slate-500">Not enough reviewed recommendations yet.</p>
          ) : (
            <div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${summary.acceptanceRate * 100}%` }} />
              </div>
              <p className="text-sm text-slate-600 mt-2">{Math.round(summary.acceptanceRate * 100)}% of reviewed AI outputs were accepted</p>
            </div>
          )}
        </div>
        <div className="card">
          <h3 className="font-medium text-slate-800 mb-3">Model health</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>Drift: <span className="capitalize">{summary.modelHealth.drift}</span></li>
            <li>Avg latency: {summary.modelHealth.avgLatencyMs}ms</li>
            <li>Failure rate: {(summary.modelHealth.failureRate * 100).toFixed(1)}%</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
