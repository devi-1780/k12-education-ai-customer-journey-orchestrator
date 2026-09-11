import { useEffect, useState } from 'react';
import api from '../../api/axiosInstance.js';
import Loading from '../../components/Loading.jsx';
import Badge from '../../components/Badge.jsx';

export default function ProfileDetail({ id, onClose }) {
  const [profile, setProfile] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [consents, setConsents] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    Promise.all([
      api.get(`/profiles/${id}`),
      api.get('/journey', { params: { profileId: id, limit: 20 } }),
      api.get(`/profiles/${id}/consents`),
    ])
      .then(([p, j, c]) => {
        setProfile(p.data.data);
        setInteractions(j.data.data);
        setConsents(c.data.data);
        setStatus('succeeded');
      })
      .catch(() => setStatus('failed'));
  }, [id]);

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Profile & Journey History</h2>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>

        {status === 'loading' && <Loading />}
        {status === 'failed' && <p className="text-red-600 text-sm">Failed to load profile.</p>}

        {status === 'succeeded' && profile && (
          <div className="space-y-5">
            <div>
              <p className="text-lg font-medium">{profile.fullName}</p>
              <p className="text-sm text-slate-500 capitalize">{profile.entityType.replace('_', ' ')} · <Badge value={profile.riskLevel} /></p>
              <p className="text-sm text-slate-500 mt-1">{profile.email || '—'} · {profile.phone || '—'}</p>
            </div>

            <div>
              <h3 className="font-medium text-slate-800 mb-2">Consent & preferences</h3>
              {consents.length === 0 ? (
                <p className="text-sm text-slate-500">No consent records yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {consents.map((c) => (
                    <span key={c._id} className={`badge ${c.granted ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {c.channel} / {c.purpose}: {c.granted ? 'granted' : 'revoked'}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-medium text-slate-800 mb-2">Journey timeline & service history</h3>
              {interactions.length === 0 ? (
                <p className="text-sm text-slate-500">No journey events yet.</p>
              ) : (
                <ol className="border-l border-slate-200 pl-4 space-y-3">
                  {interactions.map((i) => (
                    <li key={i._id} className="relative">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-brand-500 rounded-full" />
                      <p className="text-sm font-medium capitalize">{i.stage.replace('_', ' ')}</p>
                      <p className="text-sm text-slate-600">{i.summary}</p>
                      <p className="text-xs text-slate-400">{new Date(i.occurredAt).toLocaleString()} · <Badge value={i.status} /></p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
