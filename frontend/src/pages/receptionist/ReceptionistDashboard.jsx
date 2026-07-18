import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAllBookings } from "../../api/bookingApi";
import { fetchOccupation } from "../../api/roomApi";
import { usePolling } from "../../hooks/usePolling";
import PageHeader from "../../components/common/PageHeader";
import StatutBadge from "../../components/common/StatutBadge";
import { formatDateTime } from "../../utils/formatDate";

export default function ReceptionistDashboard() {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);

  const load = useCallback(async () => {
    try {
      const [b, r] = await Promise.all([fetchAllBookings(), fetchOccupation()]);
      setBookings(Array.isArray(b.data) ? b.data : b.data.data ?? []);
      setRooms(Array.isArray(r.data) ? r.data : r.data.data ?? []);
    } catch { /* réessayé au prochain tick */ }
  }, []);
  usePolling(load, 10000);

  const pending = bookings.filter((b) => b.statut === "en_attente");
  const occupied = rooms.filter((r) => (r.statut_effectif ?? r.statut) === "occupee").length;
  const free = rooms.filter((r) => (r.statut_effectif ?? r.statut) === "libre").length;

  return (
    <>
      <PageHeader
        eyebrow="Réception"
        title="Tableau de bord"
        actions={<Link to="/reception/reservations" className="btn-primary">Traiter les demandes</Link>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card border-accent/40 bg-accent-soft p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">Demandes en attente</p>
          <p className="mt-1 font-display text-3xl font-black text-accent-dark">{pending.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Salles libres maintenant</p>
          <p className="mt-1 font-display text-3xl font-black">{free}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Salles occupées</p>
          <p className="mt-1 font-display text-3xl font-black">{occupied}</p>
        </div>
      </div>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Dernières demandes en attente</h2>
          <Link to="/reception/reservations" className="text-sm font-medium text-accent hover:text-accent-dark">Tout voir</Link>
        </div>
        {pending.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/45">Aucune demande à traiter. 👍</p>
        ) : (
          <ul className="divide-y divide-ink/5">
            {pending.slice(0, 6).map((b) => (
              <li key={b.id_reservation} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">
                    {b.client ? `${b.client.prenom} ${b.client.nom}` : `Client #${b.id_client}`} — {b.salle?.nom_salle ?? `salle #${b.id_salle}`}
                  </p>
                  <p className="text-xs text-ink/50">{formatDateTime(b.date_debut)} → {formatDateTime(b.date_fin)}</p>
                </div>
                <StatutBadge statut={b.statut} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
