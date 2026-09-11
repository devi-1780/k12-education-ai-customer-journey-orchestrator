const COLORS = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  pending_review: 'bg-amber-100 text-amber-700',
  deferred: 'bg-slate-100 text-slate-600',
  escalated: 'bg-red-100 text-red-700',
  closed: 'bg-slate-200 text-slate-600',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  overridden: 'bg-purple-100 text-purple-700',
  draft: 'bg-slate-100 text-slate-600',
  scheduled: 'bg-blue-100 text-blue-700',
  running: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-slate-100 text-slate-600',
  urgent: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-amber-100 text-amber-700',
};

export default function Badge({ value, label }) {
  const cls = COLORS[value] || 'bg-slate-100 text-slate-600';
  return <span className={`badge ${cls}`}>{label || String(value).replace(/_/g, ' ')}</span>;
}
