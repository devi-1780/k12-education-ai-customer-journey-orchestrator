import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecommendations, runIntentSentiment, runChurnPropensity, runNextBestAction } from '../../features/ai/aiSlice.js';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Badge from '../../components/Badge.jsx';

export default function PredictionsPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.ai);
  const [profiles, setProfiles] = useState([]);
  const [kindFilter, setKindFilter] = useState('');
  const [text, setText] = useState('My child has been struggling to keep up with homework lately.');
  const [profileId, setProfileId] = useState('');
  const [running, setRunning] = useState(null);
  const [runError, setRunError] = useState(null);

  useEffect(() => {
    dispatch(fetchRecommendations(kindFilter ? { kind: kindFilter } : {}));
  }, [dispatch, kindFilter]);

  useEffect(() => {
    api.get('/profiles', { params: { limit: 50 } }).then(({ data }) => {
      setProfiles(data.data);
      if (data.data[0]) setProfileId(data.data[0]._id);
    });
  }, []);

  const run = async (kind) => {
    setRunning(kind);
    setRunError(null);
    try {
      if (kind === 'intent_sentiment') await dispatch(runIntentSentiment({ profileId, text })).unwrap();
      if (kind === 'churn_propensity') await dispatch(runChurnPropensity({ profileId })).unwrap();
      if (kind === 'next_best_action') await dispatch(runNextBestAction({ profileId, stage: 'admission' })).unwrap();
      dispatch(fetchRecommendations(kindFilter ? { kind: kindFilter } : {}));
    } catch (err) {
      setRunError(typeof err === 'string' ? err : 'Prediction failed — model unavailable or insufficient data.');
    } finally {
      setRunning(null);
    }
  };

  return (
    <div>
      <PageHeader title="Intent, Sentiment & Propensity Predictions" breadcrumbs={['Dashboard', 'Predictions']} />

      <div className="card mb-5 space-y-3">
        <h3 className="font-medium">Run a new prediction</h3>
        <select className="input" value={profileId} onChange={(e) => setProfileId(e.target.value)}>
          {profiles.map((p) => <option key={p._id} value={p._id}>{p.fullName}</option>)}
        </select>
        <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Sample message to classify..." />
        {runError && <p className="text-sm text-red-600">{runError}</p>}
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" disabled={!profileId || running} onClick={() => run('intent_sentiment')}>
            {running === 'intent_sentiment' ? 'Running...' : 'Classify Intent & Sentiment'}
          </button>
          <button className="btn-secondary" disabled={!profileId || running} onClick={() => run('churn_propensity')}>
            {running === 'churn_propensity' ? 'Running...' : 'Score Churn / Propensity'}
          </button>
          <button className="btn-secondary" disabled={!profileId || running} onClick={() => run('next_best_action')}>
            {running === 'next_best_action' ? 'Running...' : 'Recommend Next-Best-Action'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <select className="input max-w-[220px]" value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
          <option value="">All prediction types</option>
          <option value="intent_sentiment">Intent & sentiment</option>
          <option value="churn_propensity">Churn & propensity</option>
          <option value="next_best_action">Next-best-action</option>
        </select>
      </div>

      {status === 'loading' && <Loading />}
      {status === 'succeeded' && items.length === 0 && <EmptyState title="No predictions yet" description="Run a prediction above to get started." />}

      <div className="space-y-3">
        {items.filter((i) => ['intent_sentiment', 'churn_propensity', 'next_best_action'].includes(i.kind)).map((rec) => (
          <div key={rec._id} className="card">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <span className="badge bg-brand-50 text-brand-700 border border-brand-200 capitalize">{rec.kind.replace(/_/g, ' ')}</span>
              <span className="text-xs text-slate-400">{new Date(rec.createdAt).toLocaleString()} · {rec.modelVersion}</span>
            </div>
            <p className="text-sm text-slate-600 mb-1">For: {rec.profileId?.fullName || 'Unknown'}</p>
            <pre className="text-sm bg-slate-50 rounded-lg p-3 overflow-x-auto">{JSON.stringify(rec.output, null, 2)}</pre>
            <p className="text-xs text-slate-500 mt-2">Confidence: {Math.round(rec.confidence * 100)}% {rec.isMock && '· mock response'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
