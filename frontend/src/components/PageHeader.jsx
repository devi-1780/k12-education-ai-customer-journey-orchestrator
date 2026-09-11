export default function PageHeader({ title, breadcrumbs = [], actions = null }) {
  return (
    <div className="mb-6">
      {breadcrumbs.length > 0 && (
        <nav className="text-xs text-slate-500 mb-1">
          {breadcrumbs.map((b, i) => (
            <span key={i}>
              {b}
              {i < breadcrumbs.length - 1 && <span className="mx-1">/</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900">{title}</h1>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}
