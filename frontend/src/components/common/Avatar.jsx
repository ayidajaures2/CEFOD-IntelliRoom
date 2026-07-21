/**
 * Avatar rond : photo si disponible, sinon initiales sur fond orange doux.
 */
export default function Avatar({ user, size = 40 }) {
  const url = user?.photo_url;
  const initials = `${user?.prenom?.[0] ?? ""}${user?.nom?.[0] ?? ""}`.toUpperCase() || "?";
  const s = { width: size, height: size };

  if (url) {
    return <img src={url} alt={initials} style={s} className="rounded-full object-cover" />;
  }
  return (
    <span
      style={s}
      className="inline-flex items-center justify-center rounded-full bg-accent-soft font-display text-sm font-bold text-accent-dark"
    >
      {initials}
    </span>
  );
}
