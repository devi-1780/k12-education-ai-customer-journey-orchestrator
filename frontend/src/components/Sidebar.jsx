import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';

const NAV = [
  { to: '/', label: 'Dashboard', roles: ['admin', 'sales_manager', 'marketing_manager', 'service_agent', 'customer'] },
  { to: '/profiles', label: 'Unified Profiles', roles: ['admin', 'sales_manager', 'marketing_manager', 'service_agent', 'customer'] },
  { to: '/journey', label: 'Journey Timeline', roles: ['admin', 'sales_manager', 'marketing_manager', 'service_agent', 'customer'] },
  { to: '/engagement', label: 'Segments & Outreach', roles: ['admin', 'sales_manager', 'marketing_manager'] },
  { to: '/tickets', label: 'Service Tickets', roles: ['admin', 'service_agent', 'sales_manager', 'marketing_manager', 'customer'] },
  { to: '/predictions', label: 'Predictions', roles: ['admin', 'sales_manager', 'marketing_manager', 'service_agent'] },
  { to: '/recommendations', label: 'Recommendations', roles: ['admin', 'sales_manager', 'marketing_manager', 'service_agent'] },
  { to: '/outcomes', label: 'Outcomes & Feedback', roles: ['admin', 'sales_manager', 'marketing_manager'] },
  { to: '/reports', label: 'Reports & Analytics', roles: ['admin', 'sales_manager', 'marketing_manager', 'service_agent'] },
  { to: '/notifications', label: 'Notifications', roles: ['admin', 'sales_manager', 'marketing_manager', 'service_agent', 'customer'] },
  { to: '/users', label: 'User & Role Management', roles: ['admin'] },
  { to: '/audit', label: 'Audit Logs & Settings', roles: ['admin'] },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useSelector((s) => s.auth);
  const items = NAV.filter((n) => n.roles.includes(user?.role));

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={onClose} />}
      <aside
        className={`fixed md:static z-40 top-0 left-0 h-full md:h-auto w-64 bg-white border-r border-slate-200 transform transition-transform md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 font-semibold text-brand-700 md:hidden">Menu</div>
        <nav className="p-3 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
