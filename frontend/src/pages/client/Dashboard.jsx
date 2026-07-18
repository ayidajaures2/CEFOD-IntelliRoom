import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyBookings } from "../../api/bookingApi";
import { useAuth } from "../../hooks/useAuth";
import { usePolling } from "../../hooks/usePolling";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import StatutBadge from "../../components/common/StatutBadge";
import { formatDateTime } from "../../utils/formatDate";
import { CATEGORIE_CLIENT_LABELS } from "../../utils/constants";

export default function ClientDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await fetchMyBookings();
      setBookings(Array.isArray(data) ? data : data.data ?? []);
    } catch { /* le tableau de bord reste consultable */ }
    finally { setLoading(false); }
  }, []);
  usePolling(load, 15000);

  const upcoming = bookings
    .filter((b) => ["validee", "confirmee", "en_attente"].includes(b.statut))
    .slice(0, 5);
  const toPay = bookings.filter((b) => b.statut === "validee").length;
  const pending = bookings.filter((b) => b.statut === "en_attente").length;

  return (
    <>
      <PageHeader
        eyebrow="Espace client"
        title={`Bonjour, ${user?.prenom ?? ""}`}
        subtitle={user?.categorie_client ? `Catégorie tarifaire : ${CATEGORIE_CLIENT_LABELS[user.categorie_client]}` : undefined}
        actions={<Link to="/client/reserver" className="btn-primary">Réserver une salle</Link>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Réservations", bookings.length, "/client/reservations"],
          ["En attente de validation", pending, "/client/reservations"],
          ["À payer", toPay, "/client/reservations"],
        ].map(([label, value, to]) => (
          <Link key={label} to={to} className="card p-5 transition-shadow hover:shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</p>
            <p className="mt-1 font-display text-3xl font-black text-accent-dark">{loading ? "…" : value}</p>
          </Link>
        ))}
      </div>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Réservations à venir</h2>
          <Link to="/client/reservations" className="text-sm font-medium text-accent hover:text-accent-dark">Tout voir</Link>
        </div>
        {loading ? <Loader /> : upcoming.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/45">Aucune réservation en cours.</p>
        ) : (
          <ul className="divide-y divide-ink/5">
            {upcoming.map((b) => (
              <li key={b.id_reservation} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">{b.salle?.nom_salle ?? `Salle #${b.id_salle}`}</p>
                  <p className="text-xs text-ink/50">{formatDateTime(b.date_debut)} → {formatDateTime(b.date_fin)}</p>
                </div>
                <StatutBadge statut={b.statut_effectif ?? b.statut} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
