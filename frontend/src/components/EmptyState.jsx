export default function EmptyState({ title = 'Nothing here yet', description = '', action = null }) {
  return (
    <div className="text-center py-12 px-4 border border-dashed border-slate-300 rounded-xl bg-white">
      <p className="text-slate-700 font-medium">{title}</p>
      {description && <p className="text-slate-500 text-sm mt-1">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
