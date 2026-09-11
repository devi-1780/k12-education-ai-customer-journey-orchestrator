export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
      <span>Page {meta.page} of {meta.totalPages} ({meta.total} total)</span>
      <div className="flex gap-2">
        <button className="btn-secondary" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>Previous</button>
        <button className="btn-secondary" disabled={meta.page >= meta.totalPages} onClick={() => onPageChange(meta.page + 1)}>Next</button>
      </div>
    </div>
  );
}
