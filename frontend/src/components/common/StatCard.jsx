/**
 * Carte de statistique façon dashboard moderne : pastille d'icône colorée
 * (Lucide via react-icons) à gauche, libellé + valeur à droite.
 * Palette : orange sur fond orange doux (charte respectée).
 */
export default function StatCard({ label, value, icon: Icon, hint, accent = false }) {
  return (
    <div className={`card card-hover flex items-center gap-4 p-5 ${accent ? "border-accent/30" : ""}`}>
      <span className={`stat-icon ${accent ? "bg-accent text-white" : ""}`}>
        {Icon && <Icon className="h-6 w-6" strokeWidth={2} />}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</p>
        <p className="mt-0.5 font-display text-2xl font-black leading-tight">{value}</p>
        {hint && <p className="text-xs text-ink/40">{hint}</p>}
      </div>
    </div>
  );
}
