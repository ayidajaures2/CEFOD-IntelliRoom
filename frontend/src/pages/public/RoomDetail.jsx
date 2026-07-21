import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchRoom } from "../../api/roomApi";
import { useAuth } from "../../hooks/useAuth";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import StatutBadge from "../../components/common/StatutBadge";
import { formatMoney } from "../../utils/formatMoney";
import { CATEGORIE_CLIENT_LABELS, ROLES } from "../../utils/constants";

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, role } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchRoom(id)
      .then(({ data }) => active && setRoom(data.data ?? data))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  if (loading) return <Loader full />;
  if (error || !room) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="Salle introuvable" action={<Link to="/salles" className="btn-primary">Retour au catalogue</Link>} />
      </div>
    );
  }

  const equipements = String(room.equipements ?? "").split(/[,;]/).map((e) => e.trim()).filter(Boolean);
  const tarifs = room.tarifs ?? room.tarif_salles ?? [];
  const reserveTarget = isAuthenticated && role === ROLES.CLIENT
    ? `/client/reserver?salle=${room.id_salle}`
    : "/login";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/salles" className="text-sm text-ink/55 hover:text-accent">← Toutes les salles</Link>

      {room.image_url && (
        <div className="mt-4 h-64 w-full overflow-hidden rounded-2xl bg-ink sm:h-80">
          <img src={room.image_url} alt={room.nom_salle} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-black">{room.nom_salle}</h1>
            <StatutBadge statut={room.statut_effectif ?? room.statut} />
          </div>
          <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-accent">{room.type_salle} · {room.capacite} places</p>
          <p className="mt-4 leading-relaxed text-ink/70">{room.description || "Aucune description fournie."}</p>

          {equipements.length > 0 && (
            <section className="mt-6">
              <h2 className="font-display text-lg font-bold">Équipements</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {equipements.map((e) => (
                  <li key={e} className="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent-dark">{e}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="card h-fit p-5">
          <h2 className="font-display text-lg font-bold">Tarifs</h2>
          {tarifs.length > 0 ? (
            <ul className="mt-3 divide-y divide-ink/5">
              {tarifs.map((t) => {
                const isMine = user?.categorie_client === t.categorie_client;
                return (
                  <li key={t.id_tarif ?? t.categorie_client} className={`flex items-center justify-between py-2.5 ${isMine ? "font-semibold text-accent-dark" : ""}`}>
                    <span className="text-sm">
                      {CATEGORIE_CLIENT_LABELS[t.categorie_client] ?? t.categorie_client}
                      {isMine && <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-paper">vous</span>}
                    </span>
                    <span className="text-sm">{formatMoney(t.prix)} <span className="text-ink/45">/ {t.unite}</span></span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink/50">Tarifs communiqués à la réservation.</p>
          )}
          <p className="mt-3 text-xs text-ink/45">
            Tarif indicatif selon la catégorie déclarée à l'inscription. Le prix final est confirmé avant tout paiement.
          </p>
          <button className="btn-primary mt-5 w-full" onClick={() => navigate(reserveTarget)}>
            {isAuthenticated ? "Réserver cette salle" : "Se connecter pour réserver"}
          </button>
        </aside>
      </div>
    </div>
  );
}
