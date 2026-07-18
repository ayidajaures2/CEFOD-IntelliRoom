export default function EmptyState({ title, hint, action }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-xl" aria-hidden="true">◻︎</span>
      <p className="font-display text-lg font-semibold">{title}</p>
      {hint && <p className="max-w-sm text-sm text-ink/55">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
