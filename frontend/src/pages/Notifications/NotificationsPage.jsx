import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../../features/notifications/notificationsSlice.js';
import PageHeader from '../../components/PageHeader.jsx';
import Loading from '../../components/Loading.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Pagination from '../../components/Pagination.jsx';
import Badge from '../../components/Badge.jsx';

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const { items, meta, status } = useSelector((s) => s.notifications);
  const [filters, setFilters] = useState({ page: 1, isRead: '', severity: '' });

  useEffect(() => {
    const params = { page: filters.page };
    if (filters.isRead !== '') params.isRead = filters.isRead;
    if (filters.severity) params.severity = filters.severity;
    dispatch(fetchNotifications(params));
  }, [dispatch, filters]);

  return (
    <div>
      <PageHeader
        title="Notifications"
        breadcrumbs={['Dashboard', 'Notifications']}
        actions={<button className="btn-secondary" onClick={() => dispatch(markAllNotificationsRead())}>Mark all as read</button>}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <select className="input max-w-[160px]" value={filters.isRead} onChange={(e) => setFilters((f) => ({ ...f, isRead: e.target.value, page: 1 }))}>
          <option value="">All</option>
          <option value="false">Unread</option>
          <option value="true">Read</option>
        </select>
        <select className="input max-w-[160px]" value={filters.severity} onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value, page: 1 }))}>
          <option value="">All severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {status === 'loading' && <Loading />}
      {status === 'succeeded' && items.length === 0 && <EmptyState title="No notifications" />}

      <div className="space-y-2">
        {items.map((n) => (
          <div key={n._id} className={`card flex items-start justify-between gap-3 ${!n.isRead ? 'border-l-4 border-l-brand-500' : ''}`}>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{n.title}</p>
                <Badge value={n.severity} />
              </div>
              {n.body && <p className="text-sm text-slate-600 mt-0.5">{n.body}</p>}
              <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()} · {n.type.replace('_', ' ')}</p>
            </div>
            {!n.isRead && (
              <button className="btn-ghost text-xs" onClick={() => dispatch(markNotificationRead(n._id))}>Mark read</button>
            )}
          </div>
        ))}
      </div>
      <Pagination meta={meta} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />
    </div>
  );
}
