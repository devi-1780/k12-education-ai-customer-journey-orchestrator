import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSegments, fetchCampaigns, fetchNBAQueue } from '../../features/engagement/engagementSlice.js';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Badge from '../../components/Badge.jsx';
import AIOutputCard from '../../components/AIOutputCard.jsx';

const TABS = ['segments', 'campaigns', 'nba'];

export default function EngagementPage() {
  const dispatch = useDispatch();
  const { segments, campaigns, nbaQueue, status } = useSelector((s) => s.engagement);
  const { user } = useSelector((s) => s.auth);
  const [tab, setTab] = useState('campaigns');
  const [segmentForm, setSegmentForm] = useState({ name: '', description: '', entityType: 'parent' });
  const [campaignForm, setCampaignForm] = useState({ name: '', channel: 'email', purpose: 'marketing', segmentId: '', messageTemplate: '' });
  const [formStatus, setFormStatus] = useState(null);

  const refresh = () => {
    dispatch(fetchSegments());
    dispatch(fetchCampaigns());
    dispatch(fetchNBAQueue());
  };

  useEffect(() => { refresh(); }, [dispatch]);

  const canManage = ['admin', 'marketing_manager', 'sales_manager'].includes(user?.role);

  const createSegment = async (e) => {
    e.preventDefault();
    setFormStatus('saving');
    try {
      await api.post('/engagement/segments', segmentForm);
      setSegmentForm({ name: '', description: '', entityType: 'parent' });
      dispatch(fetchSegments());
      setFormStatus('success');
    } catch {
      setFormStatus('error');
    }
  };

  const createCampaign = async (e) => {
    e.preventDefault();
    setFormStatus('saving');
    try {
      const payload = { ...campaignForm };
      if (!payload.segmentId) delete payload.segmentId;
      await api.post('/engagement/campaigns', payload);
      setCampaignForm({ name: '', channel: 'email', purpose: 'marketing', segmentId: '', messageTemplate: '' });
      dispatch(fetchCampaigns());
      setFormStatus('success');
    } catch {
      setFormStatus('error');
    }
  };

  const campaignAction = async (id, action) => {
    let reason;
    if (action === 'reject') reason = window.prompt('Reason for rejecting this campaign:');
    if (action === 'reject' && !reason) return;
    await api.post(`/engagement/campaigns/${id}/${action}`, reason ? { reason } : {});
    dispatch(fetchCampaigns());
  };

  const reviewNBA = async (rec, decision) => {
    let reason;
    if (decision !== 'approved') {
      reason = window.prompt(`Reason for ${decision === 'rejected' ? 'rejecting' : 'overriding'} this recommendation:`);
      if (!reason) return;
    }
    await api.post(`/ai/recommendations/${rec._id}/review`, { decision, reason });
    dispatch(fetchNBAQueue());
  };

  return (
    <div>
      <PageHeader title="Segments, Outreach & Next-Best-Actions" breadcrumbs={['Dashboard', 'Engagement']} />

      <div className="flex gap-2 mb-4 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500'}`}
            onClick={() => setTab(t)}
          >
            {t === 'nba' ? 'Next-Best-Action Queue' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {status === 'loading' && <Loading />}

      {tab === 'segments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {segments.length === 0 ? (
              <EmptyState title="No segments yet" />
            ) : (
              segments.map((s) => (
                <div key={s._id} className="card">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{s.name}</p>
                    <span className="text-xs text-slate-500">{s.memberCount} members</span>
                  </div>
                  <p className="text-sm text-slate-500">{s.description}</p>
                  <p className="text-xs text-slate-400 mt-1 capitalize">Target: {s.entityType?.replace('_', ' ')}</p>
                </div>
              ))
            )}
          </div>
          {canManage && (
            <form onSubmit={createSegment} className="card space-y-3 h-fit">
              <h3 className="font-medium">Segment builder</h3>
              <input className="input" placeholder="Segment name" value={segmentForm.name} onChange={(e) => setSegmentForm((f) => ({ ...f, name: e.target.value }))} required />
              <textarea className="input" placeholder="Description" value={segmentForm.description} onChange={(e) => setSegmentForm((f) => ({ ...f, description: e.target.value }))} />
              <select className="input" value={segmentForm.entityType} onChange={(e) => setSegmentForm((f) => ({ ...f, entityType: e.target.value }))}>
                {['student', 'parent', 'teacher', 'prospective_family'].map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
              <button className="btn-primary w-full" disabled={formStatus === 'saving'}>Create segment</button>
            </form>
          )}
        </div>
      )}

      {tab === 'campaigns' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {campaigns.length === 0 ? (
              <EmptyState title="No campaigns yet" />
            ) : (
              campaigns.map((c) => (
                <div key={c._id} className="card">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="font-medium">{c.name}</p>
                    <Badge value={c.status} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{c.channel} · {c.purpose} · segment: {c.segmentId?.name || '—'}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 mt-2">
                    <span>Sent: {c.stats?.sent ?? 0}</span>
                    <span>Responded: {c.stats?.responded ?? 0}</span>
                    <span>Converted: {c.stats?.converted ?? 0}</span>
                  </div>
                  {canManage && (
                    <div className="flex gap-2 mt-3">
                      {c.status === 'draft' || c.status === 'pending_review' ? (
                        <>
                          <button className="btn-secondary" onClick={() => campaignAction(c._id, 'approve')}>Approve</button>
                          <button className="btn-ghost text-red-600" onClick={() => campaignAction(c._id, 'reject')}>Reject</button>
                        </>
                      ) : null}
                      {c.status === 'approved' && <button className="btn-primary" onClick={() => campaignAction(c._id, 'launch')}>Launch</button>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          {canManage && (
            <form onSubmit={createCampaign} className="card space-y-3 h-fit">
              <h3 className="font-medium">Campaign configuration</h3>
              <input className="input" placeholder="Campaign name" value={campaignForm.name} onChange={(e) => setCampaignForm((f) => ({ ...f, name: e.target.value }))} required />
              <select className="input" value={campaignForm.channel} onChange={(e) => setCampaignForm((f) => ({ ...f, channel: e.target.value }))}>
                {['email', 'sms', 'push', 'call', 'in_app'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="input" value={campaignForm.segmentId} onChange={(e) => setCampaignForm((f) => ({ ...f, segmentId: e.target.value }))}>
                <option value="">No segment</option>
                {segments.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <textarea className="input" placeholder="Message template" value={campaignForm.messageTemplate} onChange={(e) => setCampaignForm((f) => ({ ...f, messageTemplate: e.target.value }))} />
              <button className="btn-primary w-full" disabled={formStatus === 'saving'}>Create campaign</button>
            </form>
          )}
        </div>
      )}

      {tab === 'nba' && (
        <div className="space-y-3">
          {nbaQueue.length === 0 ? (
            <EmptyState title="Agent work queue is empty" description="No next-best-action recommendations awaiting review." />
          ) : (
            nbaQueue.map((rec) => (
              <div key={rec._id}>
                <p className="text-xs text-slate-500 mb-1">For: {rec.profileId?.fullName || 'Unknown profile'}</p>
                <AIOutputCard rec={rec} canReview={canManage} onReview={reviewNBA} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
