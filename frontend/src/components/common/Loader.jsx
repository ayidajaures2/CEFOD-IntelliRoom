export default function Loader({ label = "Chargement…", full = false }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-ink/60 ${full ? "min-h-[50vh]" : "py-10"}`} role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink/15 border-t-accent" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
