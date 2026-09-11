import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecommendations, reviewRecommendation } from '../../features/ai/aiSlice.js';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Pagination from '../../components/Pagination.jsx';
import AIOutputCard from '../../components/AIOutputCard.jsx';

export default function RecommendationsPage() {
  const dispatch = useDispatch();
  const { items, meta, status } = useSelector((s) => s.ai);
  const { user } = useSelector((s) => s.auth);
  const [reviewState, setReviewState] = useState('pending_review');
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchRecommendations({ reviewState: reviewState || undefined, page }));
  }, [dispatch, reviewState, page]);

  const canReview = ['admin', 'service_agent', 'marketing_manager', 'sales_manager'].includes(user?.role);

  const onReview = async (rec, decision, reason) => {
    await dispatch(reviewRecommendation({ id: rec._id, decision, reason }));
  };

  return (
    <div>
      <PageHeader title="Consent-Aware Recommendations" breadcrumbs={['Dashboard', 'Recommendations']} />
      <p className="text-sm text-slate-500 mb-4">
        AI suggestions are shown separately from approved business decisions. Rejecting or overriding a
        recommendation requires a reason, which is recorded in the audit trail.
      </p>

      <div className="flex gap-2 mb-4">
        <select className="input max-w-[220px]" value={reviewState} onChange={(e) => { setReviewState(e.target.value); setPage(1); }}>
          <option value="">All review states</option>
          <option value="pending_review">Pending review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="overridden">Overridden</option>
        </select>
      </div>

      {status === 'loading' && <Loading />}
      {status === 'succeeded' && items.length === 0 && <EmptyState title="Nothing to review" />}

      <div className="space-y-3">
        {items.map((rec) => (
          <div key={rec._id}>
            <p className="text-xs text-slate-500 mb-1">For: {rec.profileId?.fullName || 'Unknown profile'}</p>
            <AIOutputCard rec={rec} canReview={canReview} onReview={onReview} />
          </div>
        ))}
      </div>
      <Pagination meta={meta} onPageChange={setPage} />
    </div>
  );
}
