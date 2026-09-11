export default function ErrorState({ message = 'Something went wrong.' }) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
      {message}
    </div>
  );
}
