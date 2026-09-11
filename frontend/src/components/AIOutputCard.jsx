import Badge from './Badge.jsx';

/**
 * Renders an AI output with source data, confidence, explanation, timestamp,
 * model/version, and (for authorised roles) approve/reject/override controls.
 * Visually distinguished from human-approved content via the amber "AI suggested" tag.
 */
export default function AIOutputCard({ rec, canReview = false, onReview }) {
  const confidencePct = Math.round((rec.confidence || 0) * 100);
  return (
    <div className="card border-l-4 border-l-brand-400">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge bg-brand-50 text-brand-700 border border-brand-200">AI suggested</span>
            <Badge value={rec.reviewState} />
            {rec.isMock && <span className="badge bg-slate-100 text-slate-500">mock response</span>}
          </div>
          <p className="font-medium text-slate-800 capitalize">{rec.kind?.replace(/_/g, ' ')}</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>{new Date(rec.createdAt).toLocaleString()}</div>
          <div>{rec.modelVersion}</div>
        </div>
      </div>

      <pre className="mt-3 whitespace-pre-wrap text-sm bg-slate-50 rounded-lg p-3 text-slate-700 overflow-x-auto">
{JSON.stringify(rec.output, null, 2)}
      </pre>

      {rec.explanation && <p className="text-sm text-slate-600 mt-2">{rec.explanation}</p>}

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Confidence:</span>
          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500" style={{ width: `${confidencePct}%` }} />
          </div>
          <span>{confidencePct}%</span>
        </div>

        {canReview && rec.reviewState === 'pending_review' && (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => onReview(rec, 'approved')}>Approve</button>
            <button
              className="btn-ghost text-red-600"
              onClick={() => {
                const reason = window.prompt('Reason for rejecting this AI recommendation:');
                if (reason) onReview(rec, 'rejected', reason);
              }}
            >
              Reject
            </button>
            <button
              className="btn-ghost text-purple-600"
              onClick={() => {
                const reason = window.prompt('Reason for overriding this AI recommendation:');
                if (reason) onReview(rec, 'overridden', reason);
              }}
            >
              Override
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
