/** Pastille "en direct" — à placer à côté du titre des pages qui pollent
 * automatiquement, pour que l'actualisation en arrière-plan soit visible
 * plutôt que silencieuse (sinon rien ne distingue une page vivante d'une
 * page figée tant que le contenu ne change pas sous les yeux). */
export default function LiveIndicator({ label = "Mise à jour automatique" }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/45">
      <span className="live-dot" />
      {label}
    </span>
  );
}