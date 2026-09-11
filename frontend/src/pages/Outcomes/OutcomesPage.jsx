import { useEffect, useState } from 'react';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import ErrorState from '../../components/ErrorState.jsx';

function MetricCard({ label, value }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

export default function OutcomesPage() {
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/dashboard/outcomes-summary')
      .then(({ data }) => { setSummary(data.data); setStatus('succeeded'); })
      .catch((err) => { setError(err.response?.data?.message || 'Failed to load outcomes'); setStatus('failed'); });
  }, []);

  if (status === 'loading') return <Loading />;
  if (status === 'failed') return <ErrorState message={error} />;

  const outcomeCounts = Object.fromEntries((summary.outcomesByType || []).map((o) => [o._id, o.count]));

  return (
    <div>
      <PageHeader title="Journey Outcomes & Model Feedback" breadcrumbs={['Dashboard', 'Outcomes']} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Acceptance" value={outcomeCounts.acceptance || 0} />
        <MetricCard label="Response" value={outcomeCounts.response || 0} />
        <MetricCard label="Conversion" value={outcomeCounts.conversion || 0} />
        <MetricCard label="Retention" value={outcomeCounts.retention || 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-medium mb-3">Recommendation acceptance rate</h3>
          {summary.acceptanceRate === null ? (
            <p className="text-sm text-slate-500">Not enough reviewed recommendations to compute a rate yet.</p>
          ) : (
            <>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${summary.acceptanceRate * 100}%` }} />
              </div>
              <p className="text-sm text-slate-600 mt-2">{Math.round(summary.acceptanceRate * 100)}% accepted</p>
            </>
          )}
        </div>
        <div className="card">
          <h3 className="font-medium mb-3">Model quality indicators</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>Drift: <span className="capitalize">{summary.modelHealth.drift}</span></li>
            <li>Average latency: {summary.modelHealth.avgLatencyMs}ms</li>
            <li>Failure rate: {(summary.modelHealth.failureRate * 100).toFixed(1)}%</li>
            <li>Pending human reviews: {summary.pendingReviews}</li>
          </ul>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-4">
        Segment fairness and false-positive analysis are computed from the Outcome collection as more
        feedback is captured through ticket and campaign reviews.
      </p>
    </div>
  );
}
