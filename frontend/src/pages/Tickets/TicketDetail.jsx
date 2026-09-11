import { useEffect, useState } from 'react';
import api from '../../api/axiosInstance.js';
import Loading from '../../components/Loading.jsx';
import Badge from '../../components/Badge.jsx';

const ACTIONS = [
  { key: 'approve', label: 'Approve', needsReason: false },
  { key: 'reject', label: 'Reject', needsReason: true },
  { key: 'defer', label: 'Defer', needsReason: true },
  { key: 'escalate', label: 'Escalate', needsReason: false },
  { key: 'close', label: 'Close', needsReason: false },
];

export default function TicketDetail({ id, onClose, canManage }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [reply, setReply] = useState('');
  const [draft, setDraft] = useState(null);
  const [summary, setSummary] = useState(null);

  const load = () => {
    api.get(`/tickets/${id}`).then(({ data }) => { setData(data.data); setStatus('succeeded'); }).catch(() => setStatus('failed'));
  };
  useEffect(load, [id]);

  const doAction = async (action, needsReason) => {
    let reason;
    if (needsReason) {
      reason = window.prompt(`Reason for this action:`);
      if (!reason) return;
    }
    await api.post(`/tickets/${id}/${action}`, reason ? { reason } : {});
    load();
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    await api.post(`/tickets/${id}/messages`, { body: reply, idempotencyKey: `${id}-${Date.now()}` });
    setReply('');
    load();
  };

  const getDraft = async () => {
    const { data } = await api.post('/ai/draft-response', { ticketId: id });
    setDraft(data.data);
  };

  const getSummary = async () => {
    const { data } = await api.post('/ai/summarize', { ticketId: id });
    setSummary(data.data);
  };

  const useDraft = () => {
    if (draft) setReply(draft.output.draft);
  };

  if (status === 'loading') return <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"><Loading /></div>;
  if (status === 'failed' || !data) return null;

  const { ticket, messages } = data;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-lg">{ticket.subject}</h2>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div className="flex flex-wrap gap-2 items-center text-xs text-slate-500 mb-4">
          <Badge value={ticket.status} /><Badge value={ticket.priority} />
          <span>Family: {ticket.profileId?.fullName}</span>
          {ticket.churnPropensity != null && <span>Churn risk: {(ticket.churnPropensity * 100).toFixed(0)}%</span>}
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-2 mb-4">
            {ACTIONS.map((a) => (
              <button key={a.key} className="btn-secondary" onClick={() => doAction(a.key, a.needsReason)}>{a.label}</button>
            ))}
            <button className="btn-ghost" onClick={getSummary}>Summarize conversation (AI)</button>
          </div>
        )}

        {summary && (
          <div className="card mb-4 border-l-4 border-l-brand-400">
            <p className="text-xs text-brand-700 font-medium mb-1">AI conversation summary ({summary.isMock ? 'mock' : 'live'})</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{summary.output.summary}</p>
          </div>
        )}

        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {messages.length === 0 && <p className="text-sm text-slate-500">No messages yet.</p>}
          {messages.map((m) => (
            <div key={m._id} className={`p-3 rounded-xl max-w-[85%] text-sm ${m.direction === 'inbound' ? 'bg-slate-100 mr-auto' : 'bg-brand-50 ml-auto'}`}>
              {m.aiDrafted && <p className="text-[10px] text-brand-700 font-medium mb-1">AI-drafted (agent sent)</p>}
              <p>{m.body}</p>
              <p className="text-[10px] text-slate-400 mt-1">{new Date(m.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>

        {canManage && (
          <div className="mb-3">
            <button className="btn-ghost text-sm" onClick={getDraft}>✨ Get AI-drafted response</button>
            {draft && (
              <div className="card mt-2 border-l-4 border-l-brand-400">
                <p className="text-xs text-brand-700 font-medium mb-1">AI draft ({draft.isMock ? 'mock' : 'live'}) — review before sending</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{draft.output.draft}</p>
                <button className="btn-secondary mt-2" onClick={useDraft}>Use this draft as reply</button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={sendReply} className="flex gap-2">
          <input className="input" placeholder="Type a reply..." value={reply} onChange={(e) => setReply(e.target.value)} />
          <button className="btn-primary" type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
