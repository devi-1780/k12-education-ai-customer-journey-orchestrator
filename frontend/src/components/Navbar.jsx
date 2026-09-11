import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../features/auth/authSlice.js';
import { fetchNotifications, markAllNotificationsRead } from '../features/notifications/notificationsSlice.js';
import { useEffect } from 'react';

export default function Navbar({ onToggleSidebar }) {
  const { user } = useSelector((s) => s.auth);
  const { items } = useSelector((s) => s.notifications);
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 5 }));
  }, [dispatch]);

  const unread = items.filter((i) => !i.isRead).length;

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button className="md:hidden btn-ghost" onClick={onToggleSidebar} aria-label="Toggle navigation">☰</button>
          <Link to="/" className="font-semibold text-brand-700">K-12 Journey Orchestrator</Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button className="btn-ghost relative" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
              🔔
              {unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{unread}</span>}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-2">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-sm font-medium">Notifications</span>
                  <button className="text-xs text-brand-600" onClick={() => dispatch(markAllNotificationsRead())}>Mark all read</button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {items.length === 0 && <p className="text-xs text-slate-500 px-2 py-3">No notifications</p>}
                  {items.map((n) => (
                    <div key={n._id} className={`px-2 py-2 rounded-lg text-sm ${n.isRead ? 'text-slate-500' : 'text-slate-800 bg-brand-50'}`}>
                      <p className="font-medium">{n.title}</p>
                      {n.body && <p className="text-xs text-slate-500">{n.body}</p>}
                    </div>
                  ))}
                </div>
                <Link to="/notifications" className="block text-center text-xs text-brand-600 py-2" onClick={() => setOpen(false)}>View all</Link>
              </div>
            )}
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button
            className="btn-secondary"
            onClick={() => {
              dispatch(logout());
              navigate('/login');
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
